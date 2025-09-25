
import { Video, Module, Student } from './types';

export const CONFIG = {
  startDateFase1: new Date('2024-09-29T11:00:00'),
  startDateFase2: new Date('2024-11-03T11:00:00'),
  githubRepo: 'https://github.com/GESSOF/IA_PORTAL_GESSOF',
  textosIA: 'https://github.com/GESSOF/IA_PORTAL_GESSOF/tree/main/TEXTOS_IA',
  quizIA: 'https://github.com/GESSOF/IA_PORTAL_GESSOF/tree/main/QUIZ_IA',
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxQwnnn54WbgNS09TMSC-URz89iIej7PTuvMFRdo-WEE138OqdhOXJBX83AmtGn88CuCw/exec',
};

export const TABS: { id: any; icon: string; label: string }[] = [
    { id: 'overview', icon: 'fas fa-home', label: 'Resumen' },
    { id: 'fase1', icon: 'fas fa-cogs', label: 'Fase 1: n8n' },
    { id: 'fase2', icon: 'fas fa-brain', label: 'Fase 2: Vibe Coding' },
    { id: 'aula-virtual', icon: 'fas fa-chalkboard-teacher', label: 'Aula Virtual' },
    { id: 'students', icon: 'fas fa-users', label: 'Estudiantes' },
    { id: 'resources', icon: 'fas fa-book', label: 'Recursos' },
    { id: 'calendar', icon: 'fas fa-calendar', label: 'Calendario' },
];

export const VIDEOS_FASE1_N8N: Video[] = [
    { id: 'n8n-01', title: 'Introducción y Fundamentos', description: 'Bienvenida, Roadmap y exploración de la interfaz n8n', duration: '60 min', date: '29 Sep', icon: '🚀', url: '', topics: ['Interfaz n8n', 'Conceptos básicos', 'Triggers', 'Primer workflow'] },
    { id: 'n8n-02', title: 'Integraciones Esenciales', description: 'Formularios Web, Calendarios y Email de confirmación', duration: '60 min', date: '30 Sep', icon: '🔗', url: '', topics: ['Formularios Web', 'Cal.com', 'Email automation'] },
    { id: 'n8n-03', title: 'CRM y Primeros Pasos con IA', description: 'Google Sheets como CRM e introducción a nodos de IA', duration: '60 min', date: '1 Oct', icon: '📊', url: '', topics: ['Google Sheets CRM', 'API Keys', 'Prompting básico'] },
    { id: 'n8n-04', title: 'Manejo de Datos para IA', description: 'JSON, tipos de datos y manipulación para IA', duration: '60 min', date: '2 Oct', icon: '🗃️', url: '', topics: ['JSON', 'Tipos de datos', 'Manipulación de datos'] },
    { id: 'n8n-05', title: 'Creación de tu Primer Chatbot', description: 'Nodos de chatbot y construcción para Telegram', duration: '60 min', date: '3 Oct', icon: '🤖', url: '', topics: ['Nodos de chatbot', 'Telegram integration', 'Conversational AI'] },
    { id: 'n8n-06', title: 'Chatbots Web y Web Scraping', description: 'Implementar chatbot en web y técnicas de scraping', duration: '60 min', date: '6 Oct', icon: '🌐', url: '', topics: ['Chatbot web', 'Web scraping', 'Data extraction'] },
    { id: 'n8n-07', title: 'Funcionalidad Avanzada (Código y RAG)', description: 'JavaScript en n8n y Retrieval-Augmented Generation', duration: '60 min', date: '7 Oct', icon: '💻', url: '', topics: ['JavaScript functions', 'RAG implementation', 'Advanced workflows'] },
    { id: 'n8n-08', title: 'Despliegue y Conexiones Pro', description: 'Webhooks y autohospedaje en VPS', duration: '60 min', date: '8 Oct', icon: '🚀', url: '', topics: ['Webhooks', 'VPS deployment', 'Production setup'] },
    { id: 'n8n-09', title: 'Integración Profunda con WhatsApp', description: 'API de WhatsApp con Evolution API', duration: '60 min', date: '9 Oct', icon: '💬', url: '', topics: ['WhatsApp API', 'Evolution API', 'Messaging automation'] },
    { id: 'n8n-10', title: 'Estrategia de Negocio y Cierre', description: 'Costos, limitaciones y casos de uso empresariales', duration: '60 min', date: '10 Oct', icon: '📈', url: '', topics: ['Business strategy', 'Cost analysis', 'Sales automation'] }
];

export const MODULES_FASE2_VIBE: Module[] = [
    { id: 'vibe-module-1', title: 'Módulo 0: La Nueva Mentalidad', objective: 'Cambiar el Mindset', description: 'Introducción al Vibe Coding y colaboración creativa con IA', videos: [{ id: 'vibe-01', title: '¿Qué es el "Vibe Coding"?', description: 'Hacia una colaboración creativa con IA', duration: '45 min', date: '3 Nov', icon: '🧠', url: '', topics: [] }] },
    { id: 'vibe-module-2', title: 'Módulo 1: El Entorno Simbiótico', objective: 'Integrar la IA en el IDE', description: 'Configuración y uso de herramientas de IA en desarrollo', videos: [{ id: 'vibe-02', title: 'Dominando tu Copiloto', description: 'GitHub Copilot, Tabnine y herramientas similares', duration: '50 min', date: '10 Nov', icon: ' symbiotic', url: '', topics: [] }] },
    { id: 'vibe-module-3', title: 'Módulo 2: Vibe Planning', objective: 'Acelerar diseño y prototipado', description: 'Ingeniería de prompts para arquitectura de software', videos: [{ id: 'vibe-03', title: 'Ingeniería de Prompts para Diseño', description: 'Arquitectura de software con IA', duration: '55 min', date: '17 Nov', icon: '📝', url: '', topics: [] }] },
    { id: 'vibe-module-4', title: 'Módulo 3: El Flujo del Código', objective: 'Construir a gran velocidad', description: 'Generación de código y debugging conversacional', videos: [{ id: 'vibe-04', title: 'Generación de Código Repetitivo', description: 'APIs, CRUDs y Boilerplate con IA', duration: '60 min', date: '24 Nov', icon: '⚡', url: '', topics: [] }] },
    { id: 'vibe-module-5', title: 'Módulo 4: Calidad y Seguridad Asistida', objective: 'Entregar software más robusto', description: 'Code reviews automatizados y testing con IA', videos: [{ id: 'vibe-05', title: 'Code Reviews Automatizados', description: 'Pull requests y análisis de calidad', duration: '50 min', date: '1 Dec', icon: '🛡️', url: '', topics: [] }] }
];

export const ALL_VIDEOS = [...VIDEOS_FASE1_N8N, ...MODULES_FASE2_VIBE.flatMap(m => m.videos)];