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
  | 'mailchimp' | 'salesforce' | 'facebook' | 'instagram';

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
  type: 'text' | 'number' | 'select' | 'textarea' | 'toggle' | 'json';
  options?: string[];
  placeholder?: string;
  help?: string;
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