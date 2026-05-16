export const COLORS = {
  primary: '#A7F070',
  secondary: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
  },
  border: '#E2E8F0',
};

export const NAV_ITEMS = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Evaluation', href: '#evaluation' },
  { label: 'Observability', href: '#observability' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources' },
];

export const DASHBOARD_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard', icon: 'BarChart3' },
  { id: 'tickets', label: 'Ticket Queue', href: '/dashboard/tickets', icon: 'Inbox' },
  { id: 'intelligence', label: 'Ticket Intelligence', href: '/dashboard/tickets', icon: 'Brain' },
  { id: 'review', label: 'Human Review', href: '/dashboard/human-review', icon: 'CheckCircle' },
  { id: 'traces', label: 'Workflow Traces', href: '/dashboard/traces', icon: 'GitBranch' },
  { id: 'evaluations', label: 'Evaluations', href: '/dashboard/evaluations', icon: 'TrendingUp' },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics', icon: 'LineChart' },
  { id: 'prompts', label: 'Prompts', href: '/dashboard/prompts', icon: 'FileText' },
  { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
];

export const FEATURE_CARDS = [
  {
    title: 'Grounded RAG Retrieval',
    description: 'Retrieve relevant customer knowledge with citations and confidence scores',
    icon: 'Database',
  },
  {
    title: 'Multi-Agent Orchestration',
    description: 'Coordinate intelligent agents for classification, routing, and drafting',
    icon: 'Network',
  },
  {
    title: 'Human-in-the-Loop Review',
    description: 'Support operators review, edit, and approve AI-generated drafts',
    icon: 'Users',
  },
  {
    title: 'AI Evaluation Harness',
    description: 'Measure groundedness, hallucination, and judge quality at scale',
    icon: 'BarChart3',
  },
  {
    title: 'Workflow Tracing',
    description: 'Full observability into model calls, tool usage, and execution flows',
    icon: 'GitBranch',
  },
  {
    title: 'Prompt Versioning',
    description: 'Version, test, and deploy prompts with A/B testing capabilities',
    icon: 'FileText',
  },
  {
    title: 'Guardrails & Safety',
    description: 'Detect PII, enforce output constraints, and prevent hallucinations',
    icon: 'Shield',
  },
  {
    title: 'Retrieval Evidence',
    description: 'Transparent source citations with relevance scores for all retrieved chunks',
    icon: 'Eye',
  },
  {
    title: 'Latency Analytics',
    description: 'Monitor model latency, bottlenecks, and optimization opportunities',
    icon: 'Zap',
  },
];

export const WORKFLOW_STEPS = [
  { step: 1, label: 'Ingest', description: 'Receive support emails' },
  { step: 2, label: 'Classify', description: 'Determine category & urgency' },
  { step: 3, label: 'Retrieve', description: 'Find relevant knowledge' },
  { step: 4, label: 'Decide', description: 'Route or auto-resolve' },
  { step: 5, label: 'Draft', description: 'Generate AI response' },
  { step: 6, label: 'Review', description: 'Human approval' },
  { step: 7, label: 'Evaluate', description: 'Measure quality' },
];

export const KPI_CARDS = [
  { id: 'active', label: 'Active Tickets', value: '2,341', trend: '+12%', icon: 'Inbox' },
  { id: 'resolution', label: 'Auto Resolution Rate', value: '84%', trend: '+3%', icon: 'TrendingUp' },
  { id: 'latency', label: 'Avg Latency', value: '1.2s', trend: '-0.3s', icon: 'Zap' },
  { id: 'override', label: 'Override Rate', value: '8%', trend: '-1.2%', icon: 'AlertCircle' },
  { id: 'escalation', label: 'Escalation Rate', value: '4.2%', trend: '-0.8%', icon: 'ArrowUp' },
  { id: 'groundedness', label: 'Groundedness Score', value: '96.4%', trend: '+2.1%', icon: 'CheckCircle' },
];
