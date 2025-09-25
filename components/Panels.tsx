
import React from 'react';
import { Student } from '../types';
import { VIDEOS_FASE1_N8N, MODULES_FASE2_VIBE, CONFIG } from '../constants';
import { VideoCard, StudentCard, ResourceCard, VibeModuleCard } from './Cards';

const Section: React.FC<{ title: string; description: string; children?: React.ReactNode }> = ({ title, description, children }) => (
    <div className="module-section mb-12 animate-fadeIn">
        <div className="module-header text-center mb-12">
            <h2 className="font-orbitron text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">{title}</h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">{description}</p>
        </div>
        {children}
    </div>
);

export const OverviewPanel: React.FC = () => (
    <Section title="📚 Programa de Capacitación GESSOF" description="Un programa integral diseñado para transformar profesionales en expertos de automatización e IA empresarial. Aprenderás desde n8n hasta metodologías avanzadas de desarrollo con IA.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <ResourceCard icon="fas fa-cogs" title="Fase 1: n8n" description="Automatización de workflows y creación de chatbots inteligentes" />
            <ResourceCard icon="fas fa-brain" title="Fase 2: Vibe Coding" description="Desarrollo simbiótico con IA como copiloto creativo" />
            <ResourceCard icon="fas fa-chalkboard-teacher" title="Aula Virtual" description="Repositorio GitHub con materiales y tareas" />
        </div>
    </Section>
);

interface PhasePanelProps {
    progress: { [key: string]: boolean };
    onToggleProgress: (videoId: string) => void;
}

export const PhaseOnePanel: React.FC<PhasePanelProps> = ({ progress, onToggleProgress }) => (
    <Section title="🔧 Fase 1: Capacitación n8n" description="Domina la automatización de flujos de trabajo, desde integraciones básicas hasta la creación de agentes y chatbots inteligentes con n8n.">
        <div className="overflow-x-auto p-4 -m-4">
             <div className="flex gap-8 pb-4">
                {VIDEOS_FASE1_N8N.map(video => (
                    <div key={video.id} className="w-80 flex-shrink-0">
                        <VideoCard video={video} phase="n8n" isCompleted={!!progress[video.id]} onToggleProgress={onToggleProgress} />
                    </div>
                ))}
            </div>
        </div>
    </Section>
);

export const PhaseTwoPanel: React.FC<PhasePanelProps> = ({ progress, onToggleProgress }) => (
    <Section title="🧠 Fase 2: Mentoría Vibe Coding" description="Aprende a construir software en simbiosis con la IA, transformándola de una simple herramienta a tu copiloto creativo y arquitecto de soluciones.">
        <div className="space-y-8">
            {MODULES_FASE2_VIBE.map(module => (
                <VibeModuleCard key={module.id} module={module} progress={progress} onToggleProgress={onToggleProgress} />
            ))}
        </div>
    </Section>
);

export const VirtualClassroomPanel: React.FC = () => (
    <Section title="🎓 Aula Virtual GESSOF" description="Accede a todos los materiales de estudio, tareas, entregas de proyectos y recursos complementarios organizados por alumno e instructor.">
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <i className="fab fa-github text-6xl text-slate-300 mb-6"></i>
            <h3 className="text-2xl font-bold mb-2">Repositorio GitHub GESSOF</h3>
            <p className="text-slate-400 mb-6">Nuestro aula virtual está alojada en GitHub, proporcionando un espacio colaborativo y organizado para el aprendizaje y desarrollo de proyectos.</p>
            <a href={CONFIG.githubRepo} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                <i className="fab fa-github mr-2"></i> Acceder al Aula Virtual
            </a>
        </div>
    </Section>
);

interface StudentsPanelProps {
    students: Student[];
    onGeneratePdf: (studentId: string) => void;
    isLoading: boolean;
}

export const StudentsPanel: React.FC<StudentsPanelProps> = ({ students, onGeneratePdf, isLoading }) => (
    <Section title="👥 Estudiantes GESSOF Academy" description="Gestión y seguimiento del progreso de cada estudiante en el programa.">
        {isLoading ? (
            <div className="text-center py-10">
                <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                <p className="mt-4 text-slate-400">Cargando estudiantes...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {students.map(student => (
                    <StudentCard key={student.id} student={student} onGeneratePdf={onGeneratePdf} />
                ))}
            </div>
        )}
    </Section>
);

export const ResourcesPanel: React.FC = () => {
    const resources = [
        { href: "https://meet.google.com/", icon: "fas fa-video", title: "Google Meet", description: "Clases virtuales en vivo" },
        { href: "https://teams.microsoft.com/", icon: "fas fa-users", title: "Microsoft Teams", description: "Colaboración alternativa" },
        { href: CONFIG.githubRepo, icon: "fab fa-github", title: "GitHub GESSOF", description: "Repositorio de código y materiales" },
        { href: "https://n8n.io/", icon: "fas fa-code-branch", title: "n8n", description: "Plataforma de automatización" },
        { href: "https://claude.ai/", icon: "fas fa-robot", title: "Claude AI", description: "Asistente IA avanzado" },
        { href: "https://chat.openai.com/", icon: "fas fa-comments", title: "ChatGPT", description: "IA Conversacional" },
    ];

    return (
        <Section title="📚 Recursos y Herramientas" description="Acceso a todas las plataformas y herramientas necesarias para el programa.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {resources.map(res => (
                    <ResourceCard key={res.title} {...res} href={res.href} />
                ))}
            </div>
        </Section>
    );
};

export const CalendarPanel: React.FC = () => (
    <Section title="📅 Calendario Académico" description="Calendario integrado con clases, reuniones y eventos importantes.">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <i className="fas fa-calendar-alt text-6xl text-primary mb-6"></i>
            <h3 className="text-2xl font-bold mb-2">Función de Calendario</h3>
            <p className="text-slate-400">La vista detallada del calendario estará disponible próximamente.</p>
        </div>
    </Section>
);