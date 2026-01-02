import {
  Zap, Clock, Mail, Globe, MessageSquare, FileSpreadsheet,
  Bot, Send, Sparkles, LayoutTemplate,
  Database, GitBranch, Terminal,
  Cloud, CreditCard, Pause, Split, Merge, Image,
  Phone, Users, Briefcase, Calendar, Video, Folder,
  Box, Link, Variable
} from 'lucide-react';
import { Category, NodeTemplate, GuideTip } from './types';

export const CATEGORIES: Record<Category, string> = {
  trigger: "Disparadores (Start)",
  core: "Lógica y Control",
  ai: "Inteligencia Artificial",
  google: "Google Suite",
  msg: "Mensajería & Social",
  data: "Datos y Almacenamiento",
  app: "Productividad y CRM",
  cloud: "Infraestructura",
  dev: "Developer Tools"
};

// Templates with explicit positions and connection logic
export const WORKFLOW_TEMPLATES = [
  {
    id: 't1', // Lead Magnet
    nodes: [
      { type: 'form_trigger', config: { formId: 'ebook-signup-2024' }, position: { x: 50, y: 150 } },
      { type: 'gmail_send', config: { subject: 'Tu Ebook Gratis', sendTo: '{{email}}', message: 'Hola {{name}}, aquí tienes tu descarga: https://...' }, position: { x: 400, y: 50 } },
      { type: 'slack', config: { channelId: '#growth-leads', text: '🚀 Nuevo lead capturado: {{email}}' }, position: { x: 400, y: 250 } }
    ],
    connections: [
      { source: 0, target: 1 }, // Form -> Gmail
      { source: 0, target: 2 }  // Form -> Slack (Parallel)
    ]
  },
  {
    id: 't2', // Social Monitor
    nodes: [
      { type: 'cron', config: { mode: 'everyHour' }, position: { x: 50, y: 200 } },
      { type: 'http', config: { url: 'https://api.twitter.com/2/tweets/search/recent', method: 'GET' }, position: { x: 300, y: 200 } },
      { type: 'gemini', config: { prompt: 'Analiza el sentimiento de estos tweets: {{data}}. Devuelve solo los muy negativos.' }, position: { x: 600, y: 200 } },
      { type: 'if', config: { conditions: '{{sentiment_score}} < 0.3' }, position: { x: 900, y: 200 } },
      { type: 'telegram', config: { text: '🚨 Alerta de Crisis: {{tweet_text}}' }, position: { x: 1200, y: 100 } }
    ],
    connections: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      { source: 3, target: 4, sourceHandle: 'true' } // Connect only on True path
    ]
  },
  {
    id: 't3', // Daily Briefing
    nodes: [
      { type: 'cron', config: { mode: 'everyDay' }, position: { x: 50, y: 150 } },
      { type: 'googleCalendar', config: { operation: 'get', calendarId: 'primary' }, position: { x: 300, y: 150 } },
      { type: 'gemini', config: { prompt: 'Genera un resumen ejecutivo de mi día basado en estos eventos: {{events}}.' }, position: { x: 600, y: 150 } },
      { type: 'telegram', config: { text: '🌞 Buenos días, aquí tienes tu plan: \n{{summary}}' }, position: { x: 900, y: 150 } }
    ],
    connections: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  {
    id: 't4', // Form to Slack
    nodes: [
      { type: 'form_trigger', config: { formId: 'feedback-form' }, position: { x: 50, y: 150 } },
      { type: 'slack', config: { channel: '#feedback', text: 'New Feedback: {{message}}' }, position: { x: 350, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }]
  },
  {
    id: 't5', // Email to Sheets
    nodes: [
      { type: 'mail_trigger', config: { format: 'simple' }, position: { x: 50, y: 150 } },
      { type: 'gemini', config: { prompt: 'Extract key info from email: {{body}}' }, position: { x: 300, y: 150 } },
      { type: 'googleSheets', config: { operation: 'append', documentId: 'sheet-id' }, position: { x: 600, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2 }]
  },
  {
    id: 't6', // Weekly Report
    nodes: [
      { type: 'cron', config: { mode: 'everyWeek' }, position: { x: 50, y: 150 } },
      { type: 'postgres', config: { operation: 'executeQuery', query: 'SELECT * FROM users' }, position: { x: 300, y: 150 } },
      { type: 'gmail_send', config: { subject: 'Weekly Report', message: 'Report attached.' }, position: { x: 600, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2 }]
  },
  {
    id: 't7', // Payment Alert
    nodes: [
      { type: 'stripe', config: { resource: 'charge' }, position: { x: 50, y: 150 } },
      { type: 'if', config: { conditions: '{{amount}} > 100' }, position: { x: 300, y: 150 } },
      { type: 'slack', config: { text: '💰 High Value Payment: ${{amount}}' }, position: { x: 600, y: 100 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2, sourceHandle: 'true' }]
  },
  {
    id: 't8', // Webhook to DB
    nodes: [
      { type: 'webhook', config: { path: 'data-ingest', httpMethod: 'POST' }, position: { x: 50, y: 150 } },
      { type: 'mysql', config: { operation: 'insert', query: 'INSERT INTO logs...' }, position: { x: 350, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }]
  },
  {
    id: 't9', // Image Gen Bot
    nodes: [
      { type: 'telegram', config: { text: '/imagine {{prompt}}' }, position: { x: 50, y: 150 } },
      { type: 'stability', config: { prompt: '{{prompt}}' }, position: { x: 350, y: 150 } },
      { type: 'telegram', config: { text: 'Here is your image.' }, position: { x: 650, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2 }]
  },
  {
    id: 't10', // Simple Reminder
    nodes: [
      { type: 'cron', config: { mode: 'everyDay' }, position: { x: 50, y: 150 } },
      { type: 'telegram', config: { text: '🔔 Time to drink water!' }, position: { x: 350, y: 150 } }
    ],
    connections: [{ source: 0, target: 1 }]
  },
  {
    id: 't11', // Crypto Watch
    nodes: [
      { type: 'cron', config: { mode: 'everyHour' }, position: { x: 50, y: 150 } },
      { type: 'http', config: { url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', method: 'GET' }, position: { x: 300, y: 150 } },
      { type: 'if', config: { conditions: '{{bitcoin.usd}} < 50000' }, position: { x: 600, y: 150 } },
      { type: 'whatsapp', config: { phoneNumber: '522811975587', operation: 'sendMessage' }, position: { x: 900, y: 100 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2 }, { source: 2, target: 3, sourceHandle: 'true' }]
  },
  {
    id: 't12', // Telegram Alert (Free/Plan A)
    nodes: [
      { type: 'cron', config: { mode: 'everyHour' }, position: { x: 50, y: 150 } },
      { type: 'http', config: { url: 'https://google.com', method: 'HEAD' }, position: { x: 300, y: 150 } },
      { type: 'if', config: { conditions: '{{status}} != 200' }, position: { x: 600, y: 150 } },
      { type: 'telegram', config: { chatId: 'GET_FROM_@userinfobot', text: '🚨 *Server Alert*\nTarget: Google.com\nStatus: {{status}}' }, position: { x: 900, y: 100 } }
    ],
    connections: [{ source: 0, target: 1 }, { source: 1, target: 2 }, { source: 2, target: 3, sourceHandle: 'true' }]
  }
];

export const SAMPLE_TEMPLATES = WORKFLOW_TEMPLATES; // Alias for backward compatibility

export const NODE_CATALOG: NodeTemplate[] = [
  // --- TRIGGERS ---
  {
    type: 'webhook', name: 'Webhook', icon: Zap, category: 'trigger',
    color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/50',
    desc: 'Receive HTTP data',
    n8nType: 'n8n-nodes-base.webhook',
    n8nVersion: 2,
    fields: [
      { name: 'path', label: 'Slug', type: 'text', placeholder: 'order-received', help: 'webhookPath' },
      { name: 'httpMethod', label: 'Method', type: 'select', options: ['GET', 'POST'], help: 'httpMethod' }
    ]
  },
  {
    type: 'cron', name: 'Cron Schedule', icon: Clock, category: 'trigger',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50',
    desc: 'Run periodically',
    n8nType: 'n8n-nodes-base.cron',
    n8nVersion: 1,
    fields: [{ name: 'mode', label: 'Mode', type: 'select', options: ['everyMinute', 'everyHour', 'everyDay', 'custom'], help: 'cron' }]
  },
  {
    type: 'mail_trigger', name: 'Email Trigger', icon: Mail, category: 'trigger',
    color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50',
    desc: 'On new email',
    n8nType: 'n8n-nodes-base.emailReadImap',
    n8nVersion: 2,
    fields: [{ name: 'format', label: 'Format', type: 'select', options: ['simple', 'resolved'], help: 'format' }]
  },
  {
    type: 'form_trigger', name: 'Typeform', icon: LayoutTemplate, category: 'trigger',
    color: 'text-slate-200', bg: 'bg-slate-700', border: 'border-slate-500',
    desc: 'On form submission',
    n8nType: 'n8n-nodes-base.typeformTrigger',
    n8nVersion: 1,
    fields: [{ name: 'formId', label: 'Form ID', type: 'text', help: 'formId' }]
  },

  // --- GOOGLE SUITE ---
  {
    type: 'googleSheets', name: 'Google Sheets', icon: FileSpreadsheet, category: 'google',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50',
    desc: 'Read/Write Rows',
    n8nType: 'n8n-nodes-base.googleSheets',
    n8nVersion: 4, // Updated to v4
    fields: [
      { name: 'operation', label: 'Operation', type: 'select', options: ['append', 'read', 'update', 'clear'], help: 'operation' },
      { name: 'documentId', label: 'Sheet ID', type: 'text', help: 'sheetId' } // Renamed to documentId for n8n
    ]
  },
  {
    type: 'googleDrive', name: 'Google Drive', icon: Folder, category: 'google',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50',
    desc: 'File Management',
    n8nType: 'n8n-nodes-base.googleDrive',
    n8nVersion: 3,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['upload', 'list', 'download'], help: 'operation' }, { name: 'fileName', label: 'File Name', type: 'text', help: 'fileName' }]
  },
  {
    type: 'googleCalendar', name: 'Google Calendar', icon: Calendar, category: 'google',
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50',
    desc: 'Events & Meetings',
    n8nType: 'n8n-nodes-base.googleCalendar',
    n8nVersion: 1,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['create', 'get'], help: 'operation' }, { name: 'calendarId', label: 'Calendar ID', type: 'text', help: 'calendarId' }]
  },
  {
    type: 'gmail_send', name: 'Gmail Send', icon: Mail, category: 'google',
    color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50',
    desc: 'Send Emails',
    n8nType: 'n8n-nodes-base.gmail',
    n8nVersion: 2, // Updated to v2
    fields: [
      { name: 'sendTo', label: 'To', type: 'text', help: 'toEmail' }, // Renamed to sendTo
      { name: 'subject', label: 'Subject', type: 'text', help: 'subject' },
      { name: 'message', label: 'Body', type: 'textarea', help: 'text' } // Renamed to message
    ]
  },

  // --- CORE LOGIC ---
  {
    type: 'if', name: 'IF Condition', icon: GitBranch, category: 'core',
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/50',
    desc: 'Branch Flow',
    n8nType: 'n8n-nodes-base.if',
    n8nVersion: 2, // Updated to v2 (not v1)
    fields: [{ name: 'conditions', label: 'Condition', type: 'textarea', placeholder: '{{json.value}} > 10', help: 'conditions' }]
  },
  {
    type: 'switch', name: 'Switch', icon: Split, category: 'core',
    color: 'text-orange-300', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'Multi-route',
    n8nType: 'n8n-nodes-base.switch',
    n8nVersion: 3, // Updated to v3
    fields: [{ name: 'rules', label: 'Routing Rules', type: 'textarea', help: 'rules' }]
  },
  {
    type: 'merge', name: 'Merge', icon: Merge, category: 'core',
    color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-600',
    desc: 'Join Paths',
    n8nType: 'n8n-nodes-base.merge',
    n8nVersion: 3, // Updated to v3
    fields: [{ name: 'mode', label: 'Mode', type: 'select', options: ['append', 'combine', 'wait'], help: 'mode' }]
  },
  {
    type: 'wait', name: 'Wait', icon: Pause, category: 'core',
    color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-500',
    desc: 'Delay Flow',
    n8nType: 'n8n-nodes-base.wait',
    n8nVersion: 1,
    fields: [{ name: 'amount', label: 'Amount', type: 'number', help: 'amount' }, { name: 'unit', label: 'Unit', type: 'select', options: ['seconds', 'minutes', 'hours'], help: 'unit' }]
  },
  {
    type: 'set', name: 'Set Data', icon: Variable, category: 'core',
    color: 'text-yellow-200', bg: 'bg-yellow-900/20', border: 'border-yellow-500/50',
    desc: 'Define Variables',
    n8nType: 'n8n-nodes-base.set',
    n8nVersion: 3, // Updated to v3 (Edit Fields)
    fields: [{ name: 'values', label: 'JSON Values', type: 'textarea', help: 'values' }]
  },

  // --- AI & ML ---
  {
    type: 'gemini', name: 'Google Gemini', icon: Sparkles, category: 'ai',
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50',
    desc: 'Generative Text',
    n8nType: 'n8n-nodes-base.googleGemini',
    n8nVersion: 1,
    fields: [{ name: 'model', label: 'Model', type: 'select', options: ['gemini-pro', 'gemini-1.5-flash'], help: 'model' }, { name: 'prompt', label: 'Prompt', type: 'textarea', help: 'prompt' }]
  },
  {
    type: 'openai', name: 'OpenAI', icon: Bot, category: 'ai',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50',
    desc: 'GPT Models',
    n8nType: 'n8n-nodes-base.openAi',
    n8nVersion: 1, // Keep v1 for simpler mapping in this demo (v4 requires messages array construction)
    fields: [{ name: 'model', label: 'Model', type: 'select', options: ['gpt-4o', 'gpt-3.5-turbo'], help: 'model' }, { name: 'prompt', label: 'Prompt', type: 'textarea', help: 'prompt' }]
  },
  {
    type: 'stability', name: 'Stability AI', icon: Image, category: 'ai',
    color: 'text-purple-300', bg: 'bg-purple-900/20', border: 'border-purple-500/50',
    desc: 'Image Generation',
    n8nType: 'n8n-nodes-base.stabilityAi',
    n8nVersion: 1,
    fields: [{ name: 'prompt', label: 'Description', type: 'textarea', help: 'prompt' }]
  },
  {
    type: 'langchain', name: 'LangChain', icon: Link, category: 'ai',
    color: 'text-blue-300', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'AI Chains',
    n8nType: 'n8n-nodes-base.langChain',
    n8nVersion: 1,
    fields: [{ name: 'chainType', label: 'Chain Type', type: 'text' }]
  },

  // --- MESSAGING ---
  {
    type: 'telegram', name: 'Telegram', icon: Send, category: 'msg',
    color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/50',
    desc: 'Bot API',
    n8nType: 'n8n-nodes-base.telegram',
    n8nVersion: 1,
    fields: [{ name: 'chatId', label: 'Chat ID', type: 'text', help: 'telegramChatId' }, { name: 'text', label: 'Message', type: 'textarea', help: 'text' }]
  },

  {
    type: 'whatsapp', name: 'WhatsApp', icon: Phone, category: 'msg',
    color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-500/50',
    desc: 'Business API',
    n8nType: 'n8n-nodes-base.whatsapp',
    n8nVersion: 1,
    fields: [
      { name: 'operation', label: 'Operation', type: 'select', options: ['sendTemplate', 'sendMessage'], help: 'operation' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', help: 'phoneNumber' }
    ]
  },
  {
    type: 'slack', name: 'Slack', icon: MessageSquare, category: 'msg',
    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50',
    desc: 'Team Chat',
    n8nType: 'n8n-nodes-base.slack',
    n8nVersion: 2,
    fields: [{ name: 'channel', label: 'Channel ID', type: 'text', help: 'channel' }, { name: 'text', label: 'Message', type: 'textarea', help: 'text' }]
  },
  {
    type: 'discord', name: 'Discord', icon: MessageSquare, category: 'msg',
    color: 'text-indigo-300', bg: 'bg-indigo-900/20', border: 'border-indigo-500/50',
    desc: 'Webhook Msg',
    n8nType: 'n8n-nodes-base.discord',
    n8nVersion: 2,
    fields: [{ name: 'webhookUrl', label: 'Webhook URL', type: 'text', help: 'webhookUrl' }, { name: 'content', label: 'Content', type: 'textarea', help: 'text' }]
  },

  // --- APPS & CRM ---
  {
    type: 'hubspot', name: 'HubSpot', icon: Users, category: 'app',
    color: 'text-orange-500', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'CRM',
    n8nType: 'n8n-nodes-base.hubspot',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['contact', 'deal'], help: 'operation' }]
  },
  {
    type: 'jira', name: 'Jira', icon: Briefcase, category: 'app',
    color: 'text-blue-500', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'Project Mgmt',
    n8nType: 'n8n-nodes-base.jira',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['issue'], help: 'operation' }, { name: 'operation', label: 'Action', type: 'select', options: ['create', 'update'], help: 'operation' }]
  },
  {
    type: 'notion', name: 'Notion', icon: FileSpreadsheet, category: 'app',
    color: 'text-white', bg: 'bg-slate-700/50', border: 'border-slate-500/50',
    desc: 'Workspace',
    n8nType: 'n8n-nodes-base.notion',
    n8nVersion: 2,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['database', 'page'], help: 'operation' }]
  },
  {
    type: 'zoom', name: 'Zoom', icon: Video, category: 'app',
    color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-500/50',
    desc: 'Conferencing',
    n8nType: 'n8n-nodes-base.zoom',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['meeting', 'user'], help: 'operation' }]
  },

  // --- DATA & STORAGE ---
  {
    type: 'mysql', name: 'MySQL', icon: Database, category: 'data',
    color: 'text-blue-300', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'SQL Database',
    n8nType: 'n8n-nodes-base.mySql',
    n8nVersion: 1,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['executeQuery', 'insert'], help: 'operation' }, { name: 'query', label: 'Query', type: 'textarea', help: 'mysqlQuery' }]
  },
  {
    type: 'postgres', name: 'PostgreSQL', icon: Database, category: 'data',
    color: 'text-indigo-300', bg: 'bg-indigo-900/20', border: 'border-indigo-500/50',
    desc: 'SQL Database',
    n8nType: 'n8n-nodes-base.postgres',
    n8nVersion: 1,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['executeQuery', 'insert'], help: 'operation' }, { name: 'query', label: 'Query', type: 'textarea', help: 'query' }]
  },
  {
    type: 'airtable', name: 'Airtable', icon: Database, category: 'data',
    color: 'text-yellow-500', bg: 'bg-yellow-900/20', border: 'border-yellow-500/50',
    desc: 'Database',
    n8nType: 'n8n-nodes-base.airtable',
    n8nVersion: 1,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['append', 'list'], help: 'operation' }, { name: 'baseId', label: 'Base ID', type: 'text', help: 'baseId' }]
  },

  // --- CLOUD & UTILS ---
  {
    type: 'aws', name: 'AWS S3', icon: Cloud, category: 'cloud',
    color: 'text-orange-300', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'Object Storage',
    n8nType: 'n8n-nodes-base.awsS3',
    n8nVersion: 1,
    fields: [{ name: 'bucket', label: 'Bucket', type: 'text', help: 'bucket' }]
  },
  {
    type: 'stripe', name: 'Stripe', icon: CreditCard, category: 'cloud',
    color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/50',
    desc: 'Payments',
    n8nType: 'n8n-nodes-base.stripe',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['charge', 'customer'], help: 'operation' }]
  },
  {
    type: 'http', name: 'HTTP Request', icon: Globe, category: 'dev',
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50',
    desc: 'REST API',
    n8nType: 'n8n-nodes-base.httpRequest',
    n8nVersion: 4, // Updated to v4
    fields: [{ name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com', help: 'httpUrl' }, { name: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT'], help: 'method' }]
  },
  {
    type: 'code', name: 'JS Code', icon: Terminal, category: 'dev',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50',
    desc: 'Custom Script',
    n8nType: 'n8n-nodes-base.function', // Note: 'function' is legacy, 'code' is new, but sticking to Function for broad compat
    n8nVersion: 1,
    fields: [{ name: 'jsCode', label: 'JavaScript', type: 'textarea', help: 'jsCode' }]
  },
  // --- FLOW CONTROL (NEW) ---
  {
    type: 'splitInBatches', name: 'Split In Batches', icon: Split, category: 'core',
    color: 'text-orange-300', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'Loop / Batching',
    n8nType: 'n8n-nodes-base.splitInBatches',
    n8nVersion: 1,
    fields: [{ name: 'batchSize', label: 'Batch Size', type: 'number', help: 'amount' }]
  },
  {
    type: 'crypto', name: 'Crypto / Hashing', icon: Variable, category: 'core',
    color: 'text-yellow-200', bg: 'bg-yellow-900/20', border: 'border-yellow-500/50',
    desc: 'Hash & Sign',
    n8nType: 'n8n-nodes-base.crypto',
    n8nVersion: 1,
    fields: [{ name: 'action', label: 'Action', type: 'select', options: ['hash', 'sign'], help: 'operation' }]
  },
  {
    type: 'dateTime', name: 'Date & Time', icon: Calendar, category: 'core',
    color: 'text-emerald-300', bg: 'bg-emerald-900/20', border: 'border-emerald-500/50',
    desc: 'Format / Calc',
    n8nType: 'n8n-nodes-base.dateTime',
    n8nVersion: 1,
    fields: [{ name: 'action', label: 'Action', type: 'select', options: ['format', 'add', 'subtract'], help: 'operation' }]
  },
  {
    type: 'compareDatasets', name: 'Compare Datasets', icon: GitBranch, category: 'core',
    color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'Find Delta',
    n8nType: 'n8n-nodes-base.compareDatasets',
    n8nVersion: 1,
    fields: [{ name: 'mergeBy', label: 'Merge By', type: 'text', help: 'rules' }]
  },

  // --- PRODUCTIVITY (NEW) ---
  {
    type: 'microsoftTeams', name: 'Microsoft Teams', icon: Users, category: 'app',
    color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/50',
    desc: 'Chat & Meetings',
    n8nType: 'n8n-nodes-base.microsoftTeams',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['channel', 'chat'], help: 'operation' }]
  },
  {
    type: 'trello', name: 'Trello', icon: FileSpreadsheet, category: 'app',
    color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'Kanban Boards',
    n8nType: 'n8n-nodes-base.trello',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['card', 'list'], help: 'operation' }]
  },
  {
    type: 'asana', name: 'Asana', icon: Briefcase, category: 'app',
    color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-500/50',
    desc: 'Project Tracking',
    n8nType: 'n8n-nodes-base.asana',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['task', 'project'], help: 'operation' }]
  },
  {
    type: 'clickup', name: 'ClickUp', icon: Briefcase, category: 'app',
    color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/50',
    desc: 'All-in-one App',
    n8nType: 'n8n-nodes-base.clickUp',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['task', 'list'], help: 'operation' }]
  },

  // --- E-COMMERCE (NEW) ---
  {
    type: 'shopify', name: 'Shopify', icon: Box, category: 'app',
    color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/50',
    desc: 'E-commerce',
    n8nType: 'n8n-nodes-base.shopify',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['product', 'order'], help: 'operation' }]
  },
  {
    type: 'woocommerce', name: 'WooCommerce', icon: Box, category: 'app',
    color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/50',
    desc: 'WordPress Shop',
    n8nType: 'n8n-nodes-base.wooCommerce',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['product', 'order'], help: 'operation' }]
  },

  // --- DEV & INFRA (NEW) ---
  {
    type: 'github', name: 'GitHub', icon: GitBranch, category: 'dev',
    color: 'text-slate-200', bg: 'bg-slate-700/50', border: 'border-slate-500/50',
    desc: 'Version Control',
    n8nType: 'n8n-nodes-base.github',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['issue', 'repository'], help: 'operation' }]
  },
  {
    type: 'gitlab', name: 'GitLab', icon: GitBranch, category: 'dev',
    color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/50',
    desc: 'DevOps Platform',
    n8nType: 'n8n-nodes-base.gitlab',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['issue', 'repository'], help: 'operation' }]
  },
  {
    type: 'ssh', name: 'SSH', icon: Terminal, category: 'dev',
    color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-600',
    desc: 'Secure Shell',
    n8nType: 'n8n-nodes-base.ssh',
    n8nVersion: 1,
    fields: [{ name: 'command', label: 'Command', type: 'textarea', help: 'jsCode' }]
  },
  {
    type: 'ftp', name: 'FTP / SFTP', icon: Folder, category: 'dev',
    color: 'text-blue-300', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'File Transfer',
    n8nType: 'n8n-nodes-base.ftp',
    n8nVersion: 1,
    fields: [{ name: 'operation', label: 'Operation', type: 'select', options: ['upload', 'download'], help: 'operation' }]
  },

  // --- MARKETING (NEW) ---
  {
    type: 'mailchimp', name: 'Mailchimp', icon: Mail, category: 'app',
    color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/50',
    desc: 'Newsletter / Mkt',
    n8nType: 'n8n-nodes-base.mailchimp',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['member', 'list'], help: 'operation' }]
  },
  {
    type: 'salesforce', name: 'Salesforce', icon: Cloud, category: 'app',
    color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/50',
    desc: 'Enterprise CRM',
    n8nType: 'n8n-nodes-base.salesforce',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['lead', 'contact'], help: 'operation' }]
  },
  {
    type: 'facebook', name: 'Facebook', icon: Globe, category: 'msg',
    color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-500/50',
    desc: 'Social Graph',
    n8nType: 'n8n-nodes-base.facebook',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['post', 'page'], help: 'operation' }]
  },
  {
    type: 'instagram', name: 'Instagram', icon: Globe, category: 'msg',
    color: 'text-pink-500', bg: 'bg-pink-600/10', border: 'border-pink-500/50',
    desc: 'Social Photo',
    n8nType: 'n8n-nodes-base.instagram',
    n8nVersion: 1,
    fields: [{ name: 'resource', label: 'Resource', type: 'select', options: ['post', 'user'], help: 'operation' }]
  },

  // --- UNIVERSAL NODE ---
  {
    type: 'generic', name: 'Generic', icon: Box, category: 'dev',
    color: 'text-slate-200', bg: 'bg-slate-700', border: 'border-slate-500',
    desc: 'Universal',
    n8nType: 'n8n-nodes-base.set',
    n8nVersion: 1,
    fields: []
  }
];