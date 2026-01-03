import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NODE_CATALOG } from "../constants";
import { LanguageCode } from "../types";

// Using gemini-1.5-flash for speed and efficiency in generating structured JSON
const MODEL_NAME = "gemini-1.5-flash";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return ai;
};

// --- Schema Definitions ---

const configSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "The internal type of the node (e.g. 'webhook', 'gemini')" },
          config: { type: Type.OBJECT, description: "Configuration parameters for the node", properties: {} } // Simplified for flexibility
        },
        required: ["type"]
      }
    }
  }
};

const singleNodeConfigSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    config: {
      type: Type.OBJECT,
      description: "Key-value pairs for the node configuration based on fields",
      properties: {}
    }
  }
};


export const generateWorkflowFromPrompt = async (userPrompt: string, lang: LanguageCode) => {
  const client = getAI();
  const catalogInfo = NODE_CATALOG.map(n => ({ type: n.type, n8nType: n.n8nType, name: n.name, desc: n.desc }));

  const systemInstruction = `
    You are an expert n8n Workflow Architect for 'AutoFlow'.
    The user is asking in language: ${lang}.
    Your goal is to design a valid, logical automation flow.

    CATALOG: ${JSON.stringify(catalogInfo)}

    Rules:
    1. ONLY use nodes from the provided CATALOG.
    2. Analyze the user's intent to pick the perfect nodes (e.g. 'schedule' -> 'cron', 'email' -> 'gmail_send').
    3. If conditional logic is needed, use 'if' or 'switch'.
    4. Return a JSON object with a 'nodes' array.
    5. Ensure the flow is linear and logical (Trigger -> Processing -> Action).
  `;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: configSchema
      }
    });

    return JSON.parse(response.text || '{"nodes": []}');
  } catch (error) {
    console.error("Gemini Gen Workflow Error:", error);
    // Fallback logic could go here, but for now we rethrow or return empty
    return { nodes: [] };
  }
};

export const smartConfigureNode = async (nodeType: string, instruction: string, lang: LanguageCode) => {
  const client = getAI();
  const template = NODE_CATALOG.find(t => t.type === nodeType);

  if (!template) throw new Error("Unknown node type");

  const systemInstruction = `
    Configure a node of type "${template.name}".
    The user instruction is in language: ${lang}.
    Fields schema: ${JSON.stringify(template.fields)}
    User Instruction: "${instruction}"
    
    Return a JSON object with a 'config' property containing key-values.
  `;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate configuration",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: singleNodeConfigSchema
      }
    });

    return JSON.parse(response.text || '{"config": {}}');
  } catch (error) {
    console.error("Gemini Config Error:", error);
    return { config: {} };
  }
};

export const analyzeBusinessIdea = async (nodes: any[], lang: LanguageCode) => {
  const client = getAI();
  const workflowSummary = nodes.map(n => n.name).join(" -> ");

  const systemInstruction = `
    You are a Senior Automation Engineer. Review this n8n workflow structure: ${workflowSummary}.
    
    Your goal is to find logical gaps, security issues, or missing nodes.
    
    IMPORTANT: Respond in the following language: ${lang}.
    
    Return a short, punchy HTML formatted response (using <b>, <br>, <ul>, <li>) with:
    1. A "Efficiency Score" (e.g. 8/10).
    2. A "Critical Audit" list (bullet points).
    3. One "Pro Tip" to make it production-ready.
    
    Keep it concise.
  `;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: "Review this flow.",
      config: {
        systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    return "Could not analyze at this time.";
  }
}

export const explainWorkflow = async (nodes: any[], lang: LanguageCode) => {
  const client = getAI();
  const minimalNodes = nodes.map(n => ({ type: n.type, name: n.name, config: n.config }));

  const systemInstruction = `
    You are a Technical Interpreter. 
    Translate this n8n workflow JSON into a simple, non-technical story in language: ${lang}.
    
    Structure:
    1. "Here is how this automation works:"
    2. Step-by-step narrative (e.g. "First, we wait for an email. Then we check if it's urgent...").
    3. Final summary of the value.
    
    Keep it friendly and easy to understad for a CEO.
  `;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Explain this flow: ${JSON.stringify(minimalNodes)}`,
      config: {
        systemInstruction,
      }
    });
    return response.text || "Could not explain flow.";
  } catch (error) {
    console.error("Gemini Explain Error:", error);
    return "AI is offline.";
  }
};
