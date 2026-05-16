/**
 * Mock data for the AI Operations Platform
 */

export const TICKETS = [
  {
    id: 'TKT-2847',
    subject: 'Billing discrepancy in April invoice',
    customer: 'Sarah Chen',
    status: 'resolved',
    priority: 'high',
    sentiment: 'negative',
    intent: 'billing_query',
    aiConfidence: 0.94,
    assignedTo: 'AI Agent',
    createdAt: '2026-05-16T10:00:00Z',
    reasoning: 'Customer identified a $15 overcharge. Verified against billing records and issued a credit. Triggered automated refund workflow.',
    citations: ['Invoice #4492', 'Subscription Plan: Pro'],
    tags: ['billing', 'refund', 'priority']
  },
  {
    id: 'TKT-2843',
    subject: 'Cannot access API endpoint /v1/search',
    customer: 'Alex Rivera',
    status: 'needs_review',
    priority: 'critical',
    sentiment: 'neutral',
    intent: 'technical_issue',
    aiConfidence: 0.72,
    assignedTo: 'Human Operator',
    createdAt: '2026-05-16T11:15:00Z',
    reasoning: 'AI detected a potential rate limiting issue but requires human verification of the API key status and usage limits.',
    citations: ['API Logs: 403 Forbidden', 'User Profile: Enterprise'],
    tags: ['api', 'technical', 'urgent']
  },
  {
    id: 'TKT-2841',
    subject: 'Feature request: Dark mode for dashboard',
    customer: 'Jordan Smith',
    status: 'in_progress',
    priority: 'low',
    sentiment: 'positive',
    intent: 'feature_request',
    aiConfidence: 0.88,
    assignedTo: 'AI Agent',
    createdAt: '2026-05-16T09:30:00Z',
    reasoning: 'Categorized as UI/UX improvement. Logged in product backlog and sent automated confirmation to user.',
    citations: ['Product Roadmap v3', 'User Feedback Log'],
    tags: ['feature', 'ui-ux']
  },
  {
    id: 'TKT-2839',
    subject: 'Password reset link not working',
    customer: 'Emma Wilson',
    status: 'open',
    priority: 'medium',
    sentiment: 'frustrated',
    intent: 'account_access',
    aiConfidence: 0.91,
    assignedTo: 'AI Agent',
    createdAt: '2026-05-16T12:05:00Z',
    reasoning: 'Reset link expired due to 24h limit. Generating new link and validating SMTP delivery status.',
    citations: ['Auth Logs: Expired Token', 'SMTP Status: Delivered'],
    tags: ['auth', 'account']
  }
];

export const TRACES = [
  {
    id: 'TR-9901',
    name: 'Ticket Ingestion & Classification',
    status: 'completed',
    latency: '450ms',
    startTime: '2026-05-16T10:00:01Z',
    spans: [
      { id: 'S1', name: 'Retrieve Context', type: 'retrieval', duration: '120ms', status: 'success' },
      { id: 'S2', name: 'LLM Intent Detection', type: 'llm', duration: '200ms', status: 'success', input: 'Billing discrepancy...', output: 'intent: billing_query' },
      { id: 'S3', name: 'Sentiment Analysis', type: 'llm', duration: '80ms', status: 'success', output: 'sentiment: negative' },
      { id: 'S4', name: 'Update DB', type: 'database', duration: '50ms', status: 'success' }
    ]
  },
  {
    id: 'TR-9902',
    name: 'Automated Refund Execution',
    status: 'failed',
    latency: '1.2s',
    startTime: '2026-05-16T10:05:00Z',
    spans: [
      { id: 'S1', name: 'Validate Request', type: 'logic', duration: '50ms', status: 'success' },
      { id: 'S2', name: 'Stripe API Call', type: 'tool', duration: '1.1s', status: 'error', error: 'ConnectTimeout' },
      { id: 'S3', name: 'Fallback: Log for Review', type: 'logic', duration: '50ms', status: 'success' }
    ]
  }
];

export const EVALS = {
  accuracy: [
    { name: 'Mon', value: 92 },
    { name: 'Tue', value: 91 },
    { name: 'Wed', value: 94 },
    { name: 'Thu', value: 93 },
    { name: 'Fri', value: 95 },
    { name: 'Sat', value: 96 },
    { name: 'Sun', value: 94 },
  ],
  hallucinationRate: [
    { name: 'Mon', value: 2.1 },
    { name: 'Tue', value: 1.8 },
    { name: 'Wed', value: 1.5 },
    { name: 'Thu', value: 1.9 },
    { name: 'Fri', value: 1.2 },
    { name: 'Sat', value: 0.8 },
    { name: 'Sun', value: 1.0 },
  ],
  costPerTicket: [
    { name: 'Mon', cost: 0.12 },
    { name: 'Tue', cost: 0.11 },
    { name: 'Wed', cost: 0.13 },
    { name: 'Thu', cost: 0.12 },
    { name: 'Fri', cost: 0.14 },
    { name: 'Sat', cost: 0.10 },
    { name: 'Sun', cost: 0.09 },
  ]
};

export const PROMPTS = [
  { id: 'v2.4', name: 'Customer Ingestion Prompt', status: 'draft', updatedAt: '2026-05-16T14:20:00Z', author: 'Sudharsan' },
  { id: 'v2.3', name: 'Customer Ingestion Prompt', status: 'production', updatedAt: '2026-05-14T10:00:00Z', author: 'Sudharsan' },
  { id: 'v2.2', name: 'Customer Ingestion Prompt', status: 'archived', updatedAt: '2026-05-10T09:30:00Z', author: 'Sudharsan' },
];

export const ACTIVITY_FEED = [
  { id: 1, type: 'resolution', title: 'Ticket #2847 resolved', description: 'AI Agent issued $15 credit to Sarah Chen', time: '2 min ago', icon: 'CheckCircle' },
  { id: 2, type: 'escalation', title: 'Ticket #2843 escalated', description: 'High technical complexity detected', time: '15 min ago', icon: 'AlertCircle' },
  { id: 3, type: 'trace', title: 'Trace TR-9902 failed', description: 'Stripe API timeout triggered fallback', time: '45 min ago', icon: 'XCircle' },
  { id: 4, type: 'deployment', title: 'Prompt v2.3 promoted', description: 'Production traffic routing to v2.3', time: '3 hours ago', icon: 'Rocket' },
];
