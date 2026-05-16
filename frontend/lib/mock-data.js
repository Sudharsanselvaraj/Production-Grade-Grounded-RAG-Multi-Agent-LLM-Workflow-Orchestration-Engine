const CUSTOMERS = [
  { id: 'cust_1', name: 'Sarah Johnson', email: 'sarah@acmecorp.com', company: 'Acme Corp' },
  { id: 'cust_2', name: 'Michael Chen', email: 'mchen@techstart.io', company: 'TechStart Inc' },
  { id: 'cust_3', name: 'Jessica Lee', email: 'jlee@globalretail.com', company: 'Global Retail' },
  { id: 'cust_4', name: 'David Martinez', email: 'dmartinez@fintech.co', company: 'FinTech Solutions' },
]

const CATEGORIES = ['billing', 'technical-issue', 'feature-request', 'account-help', 'integration', 'refund', 'general-inquiry', 'bug-report']

const generateTickets = (count = 50) => {
  const tickets = []
  const statuses = ['queued', 'decided', 'drafted', 'reviewed', 'approved']
  const sentiments = ['positive', 'neutral', 'negative', 'frustrated']
  const priorities = ['p0', 'p1', 'p2', 'p3']

  const messages = [
    'How do I upgrade my account?',
    'I received an error integrating with Slack',
    'Can you help me set up SSO?',
    'I was charged twice',
    'How to export data?',
    'How do I reset my password?',
    'Can I cancel anytime?',
    'Do you offer dedicated support?',
  ]

  for (let i = 0; i < count; i++) {
    const customer = CUSTOMERS[i % CUSTOMERS.length]
    const messageIdx = i % messages.length
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    
    tickets.push({
      id: `TKT-${String(1000 + i).padStart(4, '0')}`,
      customer_name: customer.name,
      customer_email: customer.email,
      company: customer.company,
      subject: messages[messageIdx],
      body: `${messages[messageIdx]}\n\nI've been a customer for 6 months.`,
      created_at: timestamp.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      
      ai_classification: {
        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        confidence: (0.65 + Math.random() * 0.35).toFixed(3),
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      },
      
      ai_decision: {
        action: ['resolve', 'escalate', 'route-to-specialist', 'request-info'][Math.floor(Math.random() * 4)],
        confidence: (0.70 + Math.random() * 0.30).toFixed(3),
      },
      
      ai_draft: 'Thank you for reaching out! I understand your concern...',
      
      retrieval: {
        documents: [
          { id: 'doc_1', title: 'Upgrade Guide', score: 0.92, snippet: 'To upgrade, go to Settings > Billing...' },
          { id: 'doc_2', title: 'Pricing Tiers', score: 0.87, snippet: 'Our pricing tiers offer...' },
        ],
      },
      
      groundedness: { score: (0.75 + Math.random() * 0.20).toFixed(3) },
      hallucination_detected: Math.random() > 0.85,
      human_review_status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
    })
  }

  return tickets
}

export const generateMockTickets = () => generateTickets(50)

export const getMockTicket = (ticketId) => {
  const tickets = generateMockTickets()
  return tickets.find(t => t.id === ticketId)
}

export const generateWorkflowTrace = (ticketId) => ({
  trace_id: `trace_${ticketId}`,
  ticket_id: ticketId,
  status: 'completed',
  total_duration_ms: 2345,
  total_tokens: { input: 1250, output: 450, total: 1700 },
  steps: [
    { id: 's1', name: 'Classification', duration_ms: 240, tokens: { total: 570 }, model: 'gpt-4' },
    { id: 's2', name: 'Retrieval', duration_ms: 580, tokens: { total: 150 }, model: 'bge-large' },
    { id: 's3', name: 'Reasoning', duration_ms: 450, tokens: { total: 1000 }, model: 'gpt-4' },
    { id: 's4', name: 'Decision', duration_ms: 180, tokens: { total: 480 }, model: 'gpt-4' },
    { id: 's5', name: 'Draft', duration_ms: 520, tokens: { total: 1550 }, model: 'gpt-4' },
  ],
})

export const generateEvaluationMetrics = () => {
  const tickets = generateMockTickets()
  const evaluations = tickets.map((t) => ({
    eval_id: `eval_${t.id}`,
    ticket_id: t.id,
    category_predicted: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    category_actual: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    judge_score: Math.floor(Math.random() * 5) + 1,
    groundedness_score: (0.65 + Math.random() * 0.35).toFixed(3),
    hallucination_detected: Math.random() > 0.8,
    latency_ms: 1500 + Math.floor(Math.random() * 2000),
  }))
  
  return {
    auto_resolution_rate: 0.72 + Math.random() * 0.15,
    groundedness_score: 0.78 + Math.random() * 0.15,
    hallucination_incidents: Math.floor(Math.random() * 50) + 10,
    average_latency_ms: 1800 + Math.floor(Math.random() * 1000),
    evaluations: evaluations,
  }
}
