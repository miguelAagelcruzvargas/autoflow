import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NODE_CATALOG } from "../constants";
import { LanguageCode } from "../types";

// --- CONFIGURATION ---
type AIProvider = 'gemini' | 'groq';
const CURRENT_PROVIDER: AIProvider = 'groq'; // Toggle here or via env

// Keys
const GEMINI_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Models
const GEMINI_MODEL = "gemini-1.5-flash"; // Updated to stable 1.5 flash if available, or keep preview
const GROQ_MODEL = "llama3-70b-8192";

// --- GEMINI SETUP ---
let geminiClient: GoogleGenAI | null = null;
const getGemini = () => {
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({ apiKey: GEMINI_KEY });
    }
    return geminiClient;
};

// --- GROQ HELPER ---
const callGroq = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = true) => {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt + (jsonMode ? "\n\nIMPORTANT: Return ONLY valid JSON." : "") },
                    { role: "user", content: userPrompt }
                ],
                model: GROQ_MODEL,
                response_format: jsonMode ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${err}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq Call Failed:", error);
        throw error;
    }
};


// --- PUBLIC API ---

export const generateWorkflowFromPrompt = async (userPrompt: string, lang: LanguageCode) => {
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
    
    Response Format: { "nodes": [ { "type": "node_type", "config": { ... } } ] }
  `;

    if (CURRENT_PROVIDER === 'groq') {
        const json = await callGroq(systemInstruction, userPrompt, true);
        return JSON.parse(json || '{"nodes": []}');
    } else {
        // Gemini Fallback
        const client = getGemini();
        const configSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                nodes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            config: { type: Type.OBJECT, properties: {} }
                        },
                        required: ["type"]
                    }
                }
            }
        };
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: configSchema }
        });
        return JSON.parse(response.text || '{"nodes": []}');
    }
};


export const generateSmartConfig = async (node: any, instruction: string) => {
    // Adapter to match App.tsx signature
    const template = NODE_CATALOG.find(t => t.type === node.type);
    if (!template) throw new Error("Unknown node type");

    const systemInstruction = `
    Configure a node of type "${template.name}".
    Fields schema: ${JSON.stringify(template.fields)}
    User Instruction: "${instruction}"
    
    Return a JSON object with a 'config' property containing key-values that match the schema fields.
  `;

    if (CURRENT_PROVIDER === 'groq') {
        const json = await callGroq(systemInstruction, instruction, true);
        return JSON.parse(json || '{"config": {}}').config;
    } else {
        const client = getGemini();
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: instruction,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || '{"config": {}}');
        return parsed.config || parsed;
    }
};

export const analyzeWorkflow = async (nodes: any[], connections: any[]) => {
    const systemInstruction = `
    You are an expert n8n Workflow Auditor.
    Analyze the provided workflow JSON (nodes and connections).
    Identify potential issues, optimizations, or logic gaps.
    Return a concise HTML report (use <b>, <ul>, <li>, <span class="text-emerald-400">, etc for styling).
    Focus on:
    1. Validation (Are all required fields likely filled?)
    2. Logic (Are there disconnected nodes? Dead ends?)
    3. Best Practices (Naming, structure).
  `;
    const userPrompt = JSON.stringify({ nodes, connections });

    if (CURRENT_PROVIDER === 'groq') {
        return await callGroq(systemInstruction, userPrompt, false);
    } else {
        const client = getGemini();
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "text/plain" }
        });
        return response.text || '';
    }
};

export const explainWorkflow = async (nodes: any[], lang: LanguageCode) => {
    const systemInstruction = `
    You are a helpful assistant explaining a workflow.
    Language: ${lang}.
    Explain the following flow in simple terms (max 3 sentences).
    Focus on the "Why" and "What", not technical details.
  `;
    const userPrompt = JSON.stringify(nodes);

    if (CURRENT_PROVIDER === 'groq') {
        return await callGroq(systemInstruction, userPrompt, false); // Not JSON mode for text
    } else {
        const client = getGemini();
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "text/plain" }
        });
        return response.text || '';
    }
};

export const analyzeBusinessIdea = async (idea: string, lang: LanguageCode) => {
    // Placeholder implementation if it was missing or minimal in original
    // But assuming it existed like explainWorkflow
    const systemInstruction = `
    You are a Business Automation Expert.
    Language: ${lang}.
    Analyze this business idea and suggest 3 automation workflows using n8n.
    Return JSON: { "suggestions": [ { "title": "...", "description": "..." } ] }
  `;

    if (CURRENT_PROVIDER === 'groq') {
        const json = await callGroq(systemInstruction, idea, true);
        return JSON.parse(json || '{"suggestions": []}');
    } else {
        const client = getGemini();
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: idea,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{"suggestions": []}');
    }
};
