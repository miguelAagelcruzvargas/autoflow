import { LucideIcon } from 'lucide-react';

export type NodeType =
  | 'webhook' | 'cron' | 'mail_trigger' | 'form_trigger'
  | 'googleSheets' | 'googleDrive' | 'googleCalendar' | 'gmail_send'
  | 'if' | 'switch' | 'merge' | 'wait' | 'set'
  | 'splitInBatches' | 'crypto' | 'dateTime' | 'compareDatasets'
  | 'gemini' | 'openai' | 'stability' | 'langchain'
  | 'telegram' | 'whatsapp' | 'slack' | 'discord'
  | 'microsoftTeams' | 'trello' | 'asana' | 'clickup'
  | 'hubspot' | 'jira' | 'notion' | 'zoom'
  | 'shopify' | 'woocommerce'
  | 'mysql' | 'postgres' | 'airtable'
  | 'aws' | 'stripe' | 'http' | 'code' | 'generic'
  | 'github' | 'gitlab' | 'ssh' | 'ftp'
  | 'graphql' | 'htmlExtract' | 'jsonSchema' | 'xml' | 'markdown' | 'stickyNote'
  | 'mailchimp' | 'salesforce' | 'facebook' | 'instagram'
  | 'claude' | 'huggingFace' | 'pinecone'
  | 'reddit' | 'linkedin' | 'twitter' | 'medium'
  | 'dropbox' | 'onedrive'
  | 'redis' | 'mongodb' | 'supabase' | 'firebase'
  | 'intercom' | 'zendesk' | 'freshdesk'
  | 'monday' | 'pipedrive' | 'jotform' | 'surveyMonkey'
  | 'sendgrid' | 'twilio'
  | 'sns' | 'sqs' | 'lambda' | 'eventbridge'
  | 'kafka' | 'mqtt' | 'amqp'
  // --- EXPANSION PACK V2 (50+ NEW NODES) ---
  // Productivity
  | 'microsoftToDo' | 'todoist' | 'evernote' | 'microsoftOutlook' | 'googleTasks'
  // Marketing & CRM
  | 'activeCampaign' | 'mailerLite' | 'brevo' | 'convertKit' | 'getResponse'
  | 'keap' | 'customerio' | 'drip'
  // Communication
  | 'mattermost' | 'rocketchat' | 'matrix' | 'pushbullet' | 'pushover'
  // Dev & Infra
  | 'docker' | 'kubernetes' | 'sentry' | 'grafana' | 'jenkins'
  | 'circleci' | 'travisci' | 'pagerduty' | 'uptimeRobot'
  // Data & Storage
  | 'mariadb' | 'snowflake' | 'elasticsearch' | 'couchdb' | 'dynamodb' | 'mssql'
  // CMS
  | 'wordpress' | 'contentful' | 'strapi' | 'ghost' | 'webflow' | 'bubble'
  // Finance
  | 'paypal' | 'wise' | 'quickbooks' | 'xero' | 'wave'
  // Time & Projects
  | 'harvest' | 'toggl' | 'basecamp' | 'linear'
  // Files
  | 'box' | 'nextcloud'
  // Utilities
  | 'spreadsheetFile' | 'readBinaryFile' | 'writeBinaryFile' | 'executeCommand' | 'itemLists' | 'moveBinaryData' | 'compression'
  // --- EXPANSION PACK V3 (Multimedia & Design) ---
  | 'youtube' | 'spotify' | 'vimeo' | 'twitch' | 'pinterest' | 'unsplash'
  | 'calendly' | 'docusign' | 'dropboxSign' | 'bitly' | 'openWeather'
  | 'figma';

export type Category = 'trigger' | 'core' | 'ai' | 'google' | 'msg' | 'data' | 'app' | 'cloud' | 'dev';

export type LanguageCode = 'en' | 'es' | 'es-la' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export interface Viewport {
  x: number;
  y: number;
  k: number;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'toggle' | 'json' | 'credential' | 'date';
  options?: string[]; // For select type
  placeholder?: string;
  help?: string; // Translation key for tooltip
  defaultValue?: any;

  // Validation & Logic
  required?: boolean;
  validation?: {
    regex?: string;
    min?: number;
    max?: number;
  };
  displayCondition?: {
    field: string;
    value: string | string[] | number | boolean;
  };
}

export interface NodeTemplate {
  type: NodeType;
  name: string;
  icon: LucideIcon;
  category: Category;
  color: string;
  bg: string;
  border: string;
  desc: string;
  n8nType: string;
  n8nVersion: number; // Added: version control for n8n nodes
  fields: Field[];
}

export interface NodeInstance extends NodeTemplate {
  id: string;
  config: Record<string, any>;
  customParams: Record<string, any>;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  source: string;
  sourceHandle: string; // 'main', 'true', 'false', etc.
  target: string;
  targetHandle: string; // usually 'main'
}

export interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface GuideTip {
  title: string;       // El concepto corto (ej. "Expresión de Tiempo")
  explanation: string; // Qué hace (ej. "Define la frecuencia...")
  context?: string;    // Dónde buscarlo (ej. "Mira en la URL del navegador...")
  example?: string;    // Dato concreto (ej. "0 9 * * 1")
}