# ⚡ AutoFlow Pro
> **The Ultimate AI-Powered Visual Automation Studio**

![AutoFlow Pro Banner](https://images.unsplash.com/photo-1642132652859-3ef5a22554e8?auto=format&fit=crop&q=80&w=1200&h=400)

**AutoFlow Pro** redefine la automatización visual. Es una plataforma de orquestación de flujos de trabajo "Low-Code" que fusiona la potencia de modelos de lenguaje masivos (LLMs) con una interfaz de lienzo infinito, permitiendo a desarrolladores y empresas construir sistemas complejos en minutos, no días.

---

## 🔮 Capacidades Principales

### 🧠 1. Arquitecto de IA (Copilot)
No empieces desde cero. AutoFlow integra **Google Gemini 1.5 Flash** y **Groq Llama 3** profundamente en el núcleo:
*   ✨ **Construcción Mágica:** Describe tu idea (ej: *"Monitor sales emails and slack me if value > $1000"*) y la IA generará el flujo completo con nodos y conexiones.
*   🔧 **Configuración Inteligente:** ¿No sabes qué poner en un campo JSON? Pide a la IA que configure el nodo por ti.
*   🕵️ **Auditor de Flujos:** Analiza tu lógica en busca de errores, bucles infinitos o desconexiones antes de desplegar.
*   📝 **Explicador de Nodos:** Obtén resúmenes en lenguaje natural de lo que hace cualquier flujo complejo.

### 🎨 2. Lienzo Infinito & UX de Vanguardia
Una experiencia de usuario diseñada para la velocidad y la claridad:
*   **Navegación Espacial:** Zoom, Paneo infinito y Mini-mapa.
*   **Gestión de Grupos:** Selección múltiple (`Ctrl+Click`), Selección de Área (`Alt+Drag`) y arrastre de grupos completos.
*   **Diseño Glassmorphism:** Interfaz moderna, oscura y translúcida que reduce la fatiga visual.
*   **Tutorial Interactivo:** Sistema de onboarding inmersivo con detecciones de acción en tiempo real.

### 🔐 3. Motor de Ejecución Seguro
*   **Sandbox de Ejecución:** Cada workflow se ejecuta en un entorno aislado con validación de tipos.
*   **Secure Backend API:** Node.js + Express con encriptación AES-256.
*   **Nativo de Nube:** Supabase para persistencia y logs.
*   **Gestión de Credenciales:** Los tokens de API y contraseñas se manejan con el tipo de campo `credential`, asegurando que nunca se expongan en texto plano en la interfaz.
*   **Validación Estricta:** Campos obligatorios y lógica condicional para prevenir errores de configuración.

### 🔌 6. Interoperabilidad (n8n)
*   **Exportación Nativa:** Tus flujos no están atrapados. Exporta cualquier workflow a formato JSON compatible 100% con **n8n**, permitiendo un camino de migración directo a producción enterprise.

---

## 🧩 Catálogo de Nodos (+60 Integraciones)

AutoFlow Pro ahora cuenta con un catálogo masivo para cubrir todas las necesidades empresariales:

| Categoría | Integraciones Destacadas |
| :--- | :--- |
| **🤖 IA & ML** | Google Gemini (Pro/Flash), OpenAI (GPT-4), Stability AI, LangChain, Pinecone, HuggingFace, Claude |
| **💼 Productividad** | Microsoft To Do, Todoist, Outlook, Google Tasks, Evernote, Slack, Microsoft Teams, Zoom, Notion |
| **📣 Marketing & CRM** | Salesforce, HubSpot, ActiveCampaign, MailerLite, Brevo, ConvertKit, Pipedrive, Customer.io |
| **🛠️ DevOps & Cloud** | Docker 🐳, Kubernetes, AWS (Lambda, S3, SNS, SQS, EventBridge), Jenkins, CircleCI, Sentry, Grafana |
| **🗄️ Datos & CMS** | Snowflake ❄️, MongoDB, MySQL, Postgres, Elasticsearch, Redis, Supabase, WordPress, Strapi |
| **⚡ Core & Utils** | Listas, Webhooks, Cron, Switch, Merge, JSON/HTML Parsers, Ejecución de Comandos Shell |
| **💸 Finanzas** | PayPal, Stripe, Wise, QuickBooks, WooCommerce, Shopify |

---

## 🛠️ Stack Tecnológico

*   **Frontend:** React, TypeScript, Vite.
*   **Estilos:** TailwindCSS, Lucide Icons (Diseño Glassmorphism).
*   **IA:** Google Generative AI SDK, Groq SDK.
*   **Backend/DB:** Supabase (PostgreSQL + Auth).
*   **Compatibilidad:** Capa de interporabilidad con esquemas de n8n v1.

---

## 🚦 Guía de Inicio

### Requisitos Previos
*   Node.js 18+
*   Cuenta de Supabase (Gratuita)
*   API Key de Google Gemini (Gratuita) o Groq

### Instalación

1.  **Clonar repositorio**
    ```bash
    git clone https://github.com/tu-org/autoflow-pro.git
    cd autoflow-pro
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Variables de Entorno**
    Crea un archivo `.env` en la raíz con tus claves:
    ```env
    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
    VITE_SUPABASE_ANON_KEY=tu-clave-anonima
    VITE_GOOGLE_API_KEY=tu-clave-gemini
    VITE_GROQ_API_KEY=tu-clave-groq
    ```

4.  **Correr en Desarrollo**
    ```bash
    npm run dev
    ```

---

## 🎮 Controles del Canvas

| Acción | Gesto / Tecla |
| :--- | :--- |
| **Mover Canvas** | Rueda del mouse (Click central) o Espacio + Drag |
| **Zoom** | Rueda del mouse |
| **Seleccionar** | Click izquierdo |
| **Multi-selección** | `Ctrl` + Click |
| **Selección de Caja** | `Alt` + Arrastrar click izq. |
| **Borrar** | Tecla `Supr` o `Backspace` |
| **Menú Contextual** | Click derecho en el canvas |

---

## 🗺️ Roadmap (Lo que vendrá)

Aunque AutoFlow Pro es poderoso, nuestra visión es ambiciosa. Aquí está lo que estamos construyendo:

### 🔄 Fase 1: Motor de Backend (En Progreso)
Actualmente, la ejecución ocurre en el cliente. Estamos migrando a **Workers de Node.js** para:
*   Ejecución de Cron Jobs 24/7 (sin tener el navegador abierto).
*   Procesamiento de cargas pesadas y webhooks reales.

### 🤝 Fase 2: Colaboración en Tiempo Real
*   Edición multijugador del canvas (estilo Figma) usando WebSockets.
*   Comentarios y anotaciones en nodos.
*   Control de versiones y rollback de workflows.

### 🔒 Fase 3: Características Enterprise (Completadas)
*   ✅ **Backend Vault:** Encriptación AES-256-CBC en reposo para todas las credenciales.
*   ✅ **Webhooks System:** Endpoint dedicado `/hooks/:workflowId/:slug` para recibir eventos externos.
*   ✅ **Gobernanza de Datos:** Trazabilidad de logs y auditoría detallada.

## 🚀 Próximos Pasos (Roadmap)

- [x] **Webhooks System** (Completado)
- [x] **Backend Vault** (Completado)
- [ ] **Marketplace de Plantillas** (Comunidad)
- [ ] **Dashboard de Analítica** con gráficos
- [ ] **Soporte Multi-entorno** (Dev/Staging/Prod)
- [ ] **Nodos Personalizados:** API para crear tus propios nodos con JS/Python.

---

## 📄 Licencia

Este proyecto está licenciado bajo la licencia MIT - siéntete libre de construir sobre él.

<div align="center">
  <br />
  <p>Construido con 💙 para la comunidad Open Source</p>
</div>
