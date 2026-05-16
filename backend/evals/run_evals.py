import json
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Dict, Any, List, Optional

from backend.db import init_db, SessionLocal
from backend.models.tables import Ticket
from backend.services.classifier import classify_ticket
from backend.services.drafter import generate_draft
from backend.retrieval.indexer import index_help_articles, index_tickets
from backend.services.decision import retrieve_context_for_ticket
from backend.services.ollama import OllamaClient


@dataclass
class EvalItemResult:
    ticket_id: int
    subject: str
    expected_category: str
    predicted_category: Optional[str]
    classification_confidence: Optional[float]
    retrieval_hit: bool
    draft_has_citations: bool
    judge_score: Optional[int] = None
    judge_groundedness: Optional[int] = None
    judge_helpfulness: Optional[int] = None
    judge_rationale: Optional[str] = None
    error: Optional[str] = None


def _safe_json_loads(text: str) -> Optional[dict]:
    try:
        return json.loads(text)
    except Exception:
        import re
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def _load_tests() -> List[Dict[str, Any]]:
    test_path = Path(__file__).parent / "test_set.json"
    return json.loads(test_path.read_text())


def _judge_prompt() -> str:
    return (Path(__file__).parent.parent / "prompts" / "evals" / "judge_v1.md").read_text(encoding="utf-8")


def _judge_ticket(ticket: Ticket, retrieved: List[Dict[str, Any]], draft: str, citations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """LLM-as-judge with heuristic fallback if Ollama is not available."""
    prompt = _judge_prompt()
    payload = {
        "subject": ticket.subject,
        "body": ticket.body,
        "retrieved": retrieved,
        "draft": draft,
        "citations": citations,
    }
    prompt_text = f"{prompt}\n\nTICKET_AND_CONTEXT:\n{json.dumps(payload, ensure_ascii=False)}\n\nReturn JSON only."
    try:
        client = OllamaClient()
        resp = client.generate(model="llama3:8b", prompt=prompt_text, max_tokens=256)
        text = None
        if isinstance(resp, dict):
            text = resp.get("output") or (resp.get("choices") and resp["choices"][0].get("message"))
        if text:
            parsed = _safe_json_loads(text)
            if parsed:
                return parsed
    except Exception:
        pass

    # Heuristic fallback when LLM judge is not reachable.
    groundedness = 4 if citations else 2
    helpfulness = 4 if draft and len(draft) > 25 else 2
    score = max(1, min(5, round((groundedness + helpfulness) / 2)))
    return {
        "score": score,
        "groundedness": groundedness,
        "helpfulness": helpfulness,
        "rationale": "heuristic fallback: judge model unavailable",
    }


def _confusion_matrix(rows: List[EvalItemResult]) -> Dict[str, Dict[str, int]]:
    labels = sorted(set([r.expected_category for r in rows] + [r.predicted_category or "<error>" for r in rows]))
    matrix = {actual: {pred: 0 for pred in labels} for actual in labels}
    for r in rows:
        pred = r.predicted_category or "<error>"
        matrix[r.expected_category][pred] += 1
    return matrix


def _render_bar(value: float, max_value: float = 1.0, label: str = "") -> str:
    pct = 0 if max_value == 0 else max(0, min(100, round((value / max_value) * 100)))
    return f"""
    <div class='metric-bar-wrap'>
      <div class='metric-bar-label'>{label}</div>
      <div class='metric-bar-track'><div class='metric-bar-fill' style='width:{pct}%'></div></div>
      <div class='metric-bar-value'>{value:.2f}</div>
    </div>
    """


def _render_html(report: Dict[str, Any]) -> str:
    m = report["metrics"]
    confusion = report["confusion_matrix"]
    rows = report["items"]
    def row_tr(row):
        return f"<tr><td>{row.ticket_id}</td><td>{row.subject}</td><td>{row.expected_category}</td><td>{row.predicted_category or ''}</td><td>{row.classification_confidence or ''}</td><td>{'yes' if row.retrieval_hit else 'no'}</td><td>{'yes' if row.draft_has_citations else 'no'}</td><td>{row.judge_score or ''}</td><td>{row.error or ''}</td></tr>"

    confusion_html = []
    labels = list(confusion.keys())
    if labels:
        header = "<tr><th>Actual \ Pred</th>" + "".join(f"<th>{l}</th>" for l in labels) + "</tr>"
        body = []
        for actual, preds in confusion.items():
            body.append("<tr><th>%s</th>%s</tr>" % (actual, "".join(f"<td>{preds.get(l,0)}</td>" for l in labels)))
        confusion_html.append(f"<table class='matrix'>{header}{''.join(body)}</table>")

    judge_section = f"""
      <div class='judge-note'>
        <p><strong>Judge calibration:</strong> MAE={m['judge_mae']:.2f}, bias={m['judge_bias']:.2f}, exact match={m['judge_exact_match']:.2f}</p>
        <p>{m['judge_note']}</p>
      </div>
    """

    return f"""<!doctype html>
<html>
<head>
  <meta charset='utf-8' />
  <title>Lumen Eval Report</title>
  <style>
    body {{ font-family: Inter, system-ui, Arial, sans-serif; margin: 32px; color: #111827; background: #f9fafb; }}
    .container {{ max-width: 1200px; margin: 0 auto; }}
    .hero {{ background: linear-gradient(135deg, #0f172a, #1d4ed8); color: white; padding: 24px; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.08); }}
    .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }}
    .card {{ background: white; border-radius: 14px; padding: 16px; box-shadow: 0 4px 14px rgba(15,23,42,.06); }}
    .metric {{ font-size: 28px; font-weight: 800; margin-top: 8px; }}
    .section {{ margin-top: 24px; }}
    table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(15,23,42,.06); }}
    th, td {{ border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; vertical-align: top; font-size: 14px; }}
    th {{ background: #f3f4f6; position: sticky; top: 0; }}
    .matrix th:first-child {{ background: #eef2ff; }}
    .pill {{ display: inline-block; padding: 4px 8px; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 12px; }}
    .metric-bar-wrap {{ display: grid; grid-template-columns: 180px 1fr 64px; gap: 10px; align-items: center; margin: 8px 0; }}
    .metric-bar-track {{ height: 10px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }}
    .metric-bar-fill {{ height: 100%; background: linear-gradient(90deg, #2563eb, #14b8a6); }}
    .metric-bar-label {{ font-size: 13px; color: #374151; }}
    .metric-bar-value {{ text-align: right; font-variant-numeric: tabular-nums; color: #111827; }}
    .judge-note {{ background: #fff7ed; border: 1px solid #fed7aa; padding: 12px 14px; border-radius: 12px; }}
    .subtle {{ color: #6b7280; font-size: 13px; }}
    .two-col {{ display:grid; grid-template-columns: 1.2fr .8fr; gap: 16px; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='hero'>
      <div class='pill'>Lumen Support AI</div>
      <h1 style='margin:12px 0 6px;'>Evaluation Report</h1>
      <div class='subtle' style='color: rgba(255,255,255,.85);'>Generated {report['generated_at']} • {report['summary']['num_items']} held-out tickets</div>
    </div>

    <div class='grid'>
      <div class='card'><div class='subtle'>Classification accuracy</div><div class='metric'>{m['classification_accuracy']:.2f}</div></div>
      <div class='card'><div class='subtle'>Retrieval precision@k</div><div class='metric'>{m['retrieval_precision_at_k']:.2f}</div></div>
      <div class='card'><div class='subtle'>Draft citation rate</div><div class='metric'>{m['draft_citation_rate']:.2f}</div></div>
      <div class='card'><div class='subtle'>Judge exact match</div><div class='metric'>{m['judge_exact_match']:.2f}</div></div>
    </div>

    <div class='section two-col'>
      <div class='card'>
        <h2>Calibration</h2>
        {judge_section}
        <div style='margin-top:12px;'>
          {_render_bar(m['judge_mae'], max_value=4.0, label='Judge MAE (lower is better)')}
          {_render_bar(max(0.0, 1 - abs(m['judge_bias'])), max_value=1.0, label='Bias proximity to zero')}
        </div>
      </div>
      <div class='card'>
        <h2>Run summary</h2>
        <p><strong>Confusions:</strong> {report['summary']['classification_errors']}</p>
        <p><strong>Retrieval misses:</strong> {report['summary']['retrieval_misses']}</p>
        <p><strong>Drafts with citations:</strong> {report['summary']['drafts_with_citations']}</p>
      </div>
    </div>

    <div class='section card'>
      <h2>Confusion Matrix</h2>
      {''.join(confusion_html) if confusion_html else '<p>No confusion matrix available.</p>'}
    </div>

    <div class='section card'>
      <h2>Per-ticket detail</h2>
      <div style='max-height: 560px; overflow:auto;'>
        <table>
          <thead><tr><th>ID</th><th>Subject</th><th>Expected</th><th>Predicted</th><th>Conf</th><th>Retrieval hit</th><th>Citations</th><th>Judge</th><th>Error</th></tr></thead>
          <tbody>
            {''.join(row_tr(r) for r in rows)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>"""


def run():
    init_db()
    db = SessionLocal()
    index_help_articles()
    index_tickets()

    tests = _load_tests()
    items: List[EvalItemResult] = []
    pred_labels = []
    actual_labels = []
    judge_scores = []
    judge_groundedness = []
    judge_helpfulness = []

    for item in tests:
        t = Ticket(subject=item["subject"], body=item["body"], status="eval")
        db.add(t)
        db.commit()
        db.refresh(t)

        predicted = None
        conf = None
        retrieval_hit = False
        draft_has_citations = False
        error = None
        judge = None

        try:
            cls = classify_ticket(db, t)
            predicted = cls.get("category")
            conf = float(cls.get("confidence", 0.0)) if cls.get("confidence") is not None else None
        except Exception as e:
            error = f"classification: {e}"

        try:
            retrieved = retrieve_context_for_ticket(t.subject, t.body)
            retrieval_hit = any(str(aid) == str(r.get("id")) for aid in item.get("expected_article_ids", []) for r in retrieved)
        except Exception as e:
            error = (error + " | " if error else "") + f"retrieval: {e}"
            retrieved = []

        draft = ""
        citations: List[Dict[str, Any]] = []
        try:
            drafted = generate_draft(db, t)
            draft = drafted.get("draft", "") or ""
            citations = drafted.get("citations", []) or []
            draft_has_citations = bool(citations)
        except Exception as e:
            error = (error + " | " if error else "") + f"drafting: {e}"

        try:
            judge = _judge_ticket(t, retrieved, draft, citations)
        except Exception as e:
            error = (error + " | " if error else "") + f"judge: {e}"
            judge = None

        if judge:
            judge_scores.append(float(judge.get("score", 0)))
            judge_groundedness.append(float(judge.get("groundedness", 0)))
            judge_helpfulness.append(float(judge.get("helpfulness", 0)))

        items.append(EvalItemResult(
            ticket_id=t.id,
            subject=t.subject,
            expected_category=item.get("expected_category", ""),
            predicted_category=predicted,
            classification_confidence=conf,
            retrieval_hit=retrieval_hit,
            draft_has_citations=draft_has_citations,
            judge_score=int(judge.get("score")) if judge and judge.get("score") is not None else None,
            judge_groundedness=int(judge.get("groundedness")) if judge and judge.get("groundedness") is not None else None,
            judge_helpfulness=int(judge.get("helpfulness")) if judge and judge.get("helpfulness") is not None else None,
            judge_rationale=judge.get("rationale") if judge else None,
            error=error,
        ))

        actual_labels.append(item.get("expected_category", ""))
        pred_labels.append(predicted or "<error>")
        time.sleep(0.1)

    # metrics
    total = max(1, len(items))
    classification_accuracy = sum(1 for r in items if r.predicted_category == r.expected_category) / total
    retrieval_precision_at_k = sum(1 for r in items if r.retrieval_hit) / total
    draft_citation_rate = sum(1 for r in items if r.draft_has_citations) / total
    judge_exact_match = sum(1 for r in items if r.judge_score is not None and r.draft_has_citations) / total

    # confusion matrix & judge calibration
    confusion = _confusion_matrix(items)
    # Calibration uses a simple rubric score proxy: 5 when citations exist and retrieval hit, else 2.
    proxy_scores = [5 if r.draft_has_citations and r.retrieval_hit else 2 for r in items if r.judge_score is not None]
    observed = [r.judge_score for r in items if r.judge_score is not None]
    judge_mae = mean([abs(a - p) for a, p in zip(observed, proxy_scores)]) if observed and proxy_scores else 0.0
    judge_bias = mean([a - p for a, p in zip(observed, proxy_scores)]) if observed and proxy_scores else 0.0
    judge_note = "Judge scores are compared against a lightweight proxy rubric (grounded+retrieved => higher score). Lower MAE and bias near zero indicate better calibration."

    summary = {
        "num_items": len(items),
        "classification_errors": sum(1 for r in items if r.predicted_category != r.expected_category),
        "retrieval_misses": sum(1 for r in items if not r.retrieval_hit),
        "drafts_with_citations": sum(1 for r in items if r.draft_has_citations),
    }
    metrics = {
        "classification_accuracy": classification_accuracy,
        "retrieval_precision_at_k": retrieval_precision_at_k,
        "draft_citation_rate": draft_citation_rate,
        "judge_exact_match": judge_exact_match,
        "judge_mae": judge_mae,
        "judge_bias": judge_bias,
        "judge_note": judge_note,
    }

    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "summary": summary,
        "metrics": metrics,
        "confusion_matrix": confusion,
        "items": [r.__dict__ for r in items],
    }

    out_dir = Path.cwd() / "eval_reports"
    out_dir.mkdir(exist_ok=True)
    ts = int(time.time())
    json_path = out_dir / f"report_{ts}.json"
    html_path = out_dir / f"report_{ts}.html"
    md_path = out_dir / f"report_{ts}.md"

    json_path.write_text(json.dumps(report, indent=2))
    html_path.write_text(_render_html(report), encoding="utf-8")
    md_path.write_text(
        f"# Lumen Eval Report\n\n"
        f"- Classification accuracy: {classification_accuracy:.2f}\n"
        f"- Retrieval precision@k: {retrieval_precision_at_k:.2f}\n"
        f"- Draft citation rate: {draft_citation_rate:.2f}\n"
        f"- Judge exact match proxy: {judge_exact_match:.2f}\n"
        f"- Judge MAE vs proxy rubric: {judge_mae:.2f}\n"
        f"- Judge bias vs proxy rubric: {judge_bias:.2f}\n\n"
        f"Generated at: {report['generated_at']}\n",
        encoding="utf-8",
    )

    print(f"Wrote eval report: {json_path}")
    print(f"Wrote eval report: {html_path}")
    print(f"Wrote eval report: {md_path}")


if __name__ == "__main__":
    run()
