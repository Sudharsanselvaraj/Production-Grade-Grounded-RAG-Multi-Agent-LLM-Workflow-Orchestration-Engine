"""
Lumen Support AI — Guardrails
Input-side: prompt injection detection, PII detection, content sanitization.
Output-side: hallucination detection, policy validation, tone enforcement.

Design philosophy: Fail visibly, not silently.
Every guardrail records what it found so the trace shows why something was flagged.
We use pattern matching + lightweight heuristics — no separate ML model for guardrails
because that adds latency and complexity that isn't justified yet.
"""

import re
import bleach
from dataclasses import dataclass
from typing import Optional
import structlog

logger = structlog.get_logger()

# ─── Prompt Injection Patterns ────────────────────────────────────────────────
# Common injection patterns from: https://github.com/greshake/llm-security
# We pattern-match rather than use another LLM — deterministic and auditable.
INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?",
    r"disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?",
    r"forget\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?",
    r"you\s+are\s+now\s+(?:a|an)\s+\w+",
    r"act\s+as\s+(?:a|an)\s+\w+\s+without\s+restrictions?",
    r"pretend\s+(?:you\s+are|to\s+be)",
    r"new\s+instructions?:\s*",
    r"system\s+prompt:",
    r"\[system\]",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"###\s*(?:instruction|system|human|assistant)",
    r"jailbreak",
    r"do\s+anything\s+now",
    r"dan\s+mode",
]

COMPILED_INJECTION_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

# ─── PII Patterns ─────────────────────────────────────────────────────────────
# We detect but don't always block — we log PII presence for compliance tracking.
# For drafts, we strip PII before sending to customer.
PII_PATTERNS = {
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b(?:\d{4}[\s-]?){3}\d{4}\b"),
    "phone_us": re.compile(r"\b(?:\+1\s?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "ip_address": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "api_key": re.compile(r"(?:sk-|pk-|api[_-]?key[_-]?)[A-Za-z0-9]{20,}"),
}

# ─── Unsafe Content Keywords ──────────────────────────────────────────────────
UNSAFE_KEYWORDS = [
    "kill", "bomb", "terrorist", "suicide", "self-harm",
    "hack", "exploit", "vulnerability",
]


@dataclass
class GuardrailResult:
    passed: bool
    injection_detected: bool = False
    injection_matches: list[str] = None
    pii_types_found: list[str] = None
    unsafe_content: bool = False
    sanitized_text: Optional[str] = None
    reasons: list[str] = None

    def __post_init__(self):
        if self.injection_matches is None:
            self.injection_matches = []
        if self.pii_types_found is None:
            self.pii_types_found = []
        if self.reasons is None:
            self.reasons = []

    def to_dict(self) -> dict:
        return {
            "passed": self.passed,
            "injection_detected": self.injection_detected,
            "injection_matches": self.injection_matches,
            "pii_types_found": self.pii_types_found,
            "unsafe_content": self.unsafe_content,
            "reasons": self.reasons,
        }


def check_prompt_injection(text: str) -> tuple[bool, list[str]]:
    """
    Returns (detected, matched_patterns).
    We don't block outright — we flag and route to human review.
    Blocking would allow attackers to fingerprint our detection.
    """
    matches = []
    for pattern in COMPILED_INJECTION_PATTERNS:
        if pattern.search(text):
            matches.append(pattern.pattern)
    return len(matches) > 0, matches


def detect_pii(text: str) -> list[str]:
    """Returns list of PII types found in text."""
    found = []
    for pii_type, pattern in PII_PATTERNS.items():
        if pii_type == "email":
            # Emails in support tickets are expected — only flag multiple unusual ones
            emails = pattern.findall(text)
            if len(emails) > 3:  # More than sender + a few refs = suspicious
                found.append(f"multiple_emails({len(emails)})")
        elif pattern.search(text):
            found.append(pii_type)
    return found


def sanitize_html(text: str) -> str:
    """Strip all HTML tags — email bodies may contain HTML."""
    return bleach.clean(text, tags=[], strip=True)


def strip_excessive_whitespace(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    # Collapse more than 2 consecutive blank lines
    result = []
    blank_count = 0
    for line in lines:
        if not line:
            blank_count += 1
            if blank_count <= 2:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    return "\n".join(result)


def run_input_guardrails(subject: str, body: str) -> GuardrailResult:
    """
    Full input-side guardrail pipeline.
    Called before any LLM sees the email content.
    """
    combined = f"{subject}\n\n{body}"

    # 1. Sanitize HTML
    subject_clean = sanitize_html(subject)
    body_clean = sanitize_html(body)
    body_clean = strip_excessive_whitespace(body_clean)

    # 2. Prompt injection check
    injection_detected, injection_matches = check_prompt_injection(combined)

    # 3. PII detection
    pii_found = detect_pii(body)

    # 4. Unsafe content (very lightweight — just keyword check)
    unsafe = any(kw in combined.lower() for kw in UNSAFE_KEYWORDS)

    # Assemble result
    reasons = []
    if injection_detected:
        reasons.append(f"Prompt injection patterns detected: {len(injection_matches)} matches")
    if pii_found:
        reasons.append(f"PII found: {', '.join(pii_found)}")
    if unsafe:
        reasons.append("Potentially unsafe content keywords detected")

    # We don't auto-block injections — we flag them and let the workflow
    # handle them with injection-aware prompts and human escalation.
    # Rationale: blocking injections causes false positives on legitimate
    # security-related support requests.
    passed = True  # Always pass to workflow; workflow adapts based on flags

    if injection_detected:
        logger.warning(
            "injection_detected",
            matches=injection_matches[:3],  # Don't log full patterns (fingerprinting risk)
        )

    return GuardrailResult(
        passed=passed,
        injection_detected=injection_detected,
        injection_matches=injection_matches,
        pii_types_found=pii_found,
        unsafe_content=unsafe,
        sanitized_text=body_clean,
        reasons=reasons,
    )


@dataclass
class OutputGuardrailResult:
    passed: bool
    pii_in_draft: list[str] = None
    hallucination_flags: list[str] = None
    tone_issues: list[str] = None
    policy_violations: list[str] = None
    cleaned_draft: Optional[str] = None

    def __post_init__(self):
        if self.pii_in_draft is None:
            self.pii_in_draft = []
        if self.hallucination_flags is None:
            self.hallucination_flags = []
        if self.tone_issues is None:
            self.tone_issues = []
        if self.policy_violations is None:
            self.policy_violations = []


# Policy-violating phrases — things we must never say to customers
POLICY_VIOLATIONS = [
    (r"guaranteed\s+refund", "Cannot guarantee refunds — policy dependent"),
    (r"definitely\s+fix", "Cannot guarantee fix timeline"),
    (r"never\s+happens?\s+again", "Cannot guarantee future behavior"),
    (r"your\s+data\s+(?:is|was)\s+(?:definitely|certainly)\s+safe", "Overconfident data safety claim"),
    (r"we\s+will\s+pay\s+you", "Unauthorized payment commitment"),
    (r"compensation\s+of\s+\$\d+", "Unauthorized specific compensation"),
]
COMPILED_POLICY_PATTERNS = [(re.compile(p, re.IGNORECASE), reason) for p, reason in POLICY_VIOLATIONS]

# Tone issues — aggressive or inappropriate language
TONE_ISSUES = [
    r"\byou\s+(?:are|were)\s+wrong\b",
    r"\bthat'?s?\s+(?:not|never)\s+(?:true|correct|right)\b",
    r"\bclearly\s+you\s+",
    r"\bobviously\b",
]
COMPILED_TONE_PATTERNS = [re.compile(p, re.IGNORECASE) for p in TONE_ISSUES]


def run_output_guardrails(draft: str, citations: list[dict]) -> OutputGuardrailResult:
    """
    Output-side guardrail pipeline.
    Checks draft before it's shown to human reviewer.
    """
    # 1. PII in draft
    pii_found = detect_pii(draft)

    # 2. Hallucination heuristics
    # Check if specific numbers/claims have citation backing
    hallucination_flags = []
    # Look for specific dollar amounts without citation
    money_mentions = re.findall(r"\$[\d,]+", draft)
    citation_text = " ".join(c.get("chunk_text", "") for c in citations)
    for amount in money_mentions:
        if amount not in citation_text:
            hallucination_flags.append(f"Ungrounded monetary claim: {amount}")

    # Check for specific dates without grounding
    date_mentions = re.findall(r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?\b", draft)
    for date in date_mentions:
        if date not in citation_text:
            hallucination_flags.append(f"Ungrounded date claim: {date}")

    # 3. Policy violations
    policy_violations = []
    for pattern, reason in COMPILED_POLICY_PATTERNS:
        if pattern.search(draft):
            policy_violations.append(reason)

    # 4. Tone issues
    tone_issues = []
    for pattern in COMPILED_TONE_PATTERNS:
        match = pattern.search(draft)
        if match:
            tone_issues.append(f"Potentially aggressive phrasing: '{match.group()}'")

    # 5. Strip PII from draft if found
    cleaned_draft = draft
    if "ssn" in pii_found:
        cleaned_draft = PII_PATTERNS["ssn"].sub("[REDACTED-SSN]", cleaned_draft)
    if "credit_card" in pii_found:
        cleaned_draft = PII_PATTERNS["credit_card"].sub("[REDACTED-CC]", cleaned_draft)

    # Draft fails only on hard policy violations or SSN/CC exposure
    hard_failures = policy_violations or ("ssn" in pii_found) or ("credit_card" in pii_found)

    return OutputGuardrailResult(
        passed=not hard_failures,
        pii_in_draft=pii_found,
        hallucination_flags=hallucination_flags,
        tone_issues=tone_issues,
        policy_violations=policy_violations,
        cleaned_draft=cleaned_draft,
    )
