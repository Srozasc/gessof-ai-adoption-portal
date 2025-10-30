import React from 'react';
import { Video, Student, Module, User, VideoText } from '../types';
import { Icon } from './UI';

interface VideoCardProps {
    video: Video;
    phase: 'n8n' | 'vibe';
    isCompleted: boolean;
    url?: string;
    texts: VideoText[];
    user: User | null;
    onEditUrl: (videoId: string) => void;
    onManageTexts: (videoId: string) => void;
    onGenerateQuiz: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, phase, isCompleted, url, texts, user, onEditUrl, onManageTexts, onGenerateQuiz }) => {
    const phaseStyles = {
        n8n: {
            bg: 'from-violet-500 to-indigo-500',
            hoverBorder: 'hover:border-violet-500'
        },
        vibe: {
            bg: 'from-cyan-500 to-sky-500',
            hoverBorder: 'hover:border-cyan-500'
        }
    };
    const hasUrl = url && url.trim() !== '';
    const hasTexts = texts && texts.length > 0;

    return (
        <div className={`bg-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 border ${isCompleted ? 'border-green-500 shadow-lg shadow-green-500/10' : `border-slate-700 ${phaseStyles[phase].hoverBorder}`}`}>
            <div className={`h-40 bg-gradient-to-br ${phaseStyles[phase].bg} flex items-center justify-center text-5xl text-white/80 relative`}>
                <span>{video.icon}</span>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{video.duration}</div>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{video.date}</div>
                <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-lg ${isCompleted ? 'bg-success text-white' : 'bg-slate-600/50'}`}>
                    <Icon name={isCompleted ? 'fas fa-check' : 'fas fa-circle'} />
                </div>
            </div>
            <div className="p-5">
                <h4 className="font-bold text-lg mb-1">{video.title}</h4>
                {user?.role === 'Administrador' && (
                    <button onClick={() => onEditUrl(video.id)} className="text-xs text-cyan-400 hover:text-cyan-300 mb-2 p-1 rounded hover:bg-cyan-400/10">
                        <Icon name="fas fa-edit" /> Editar link del video
                    </button>
                )}
                <p className="text-sm text-slate-400 mb-4 h-10">{video.description}</p>
                 <div className="flex gap-2 mb-4">
                    <a
                        href={hasUrl ? url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !hasUrl && e.preventDefault()}
                        aria-disabled={!hasUrl}
                        className={`flex-1 text-sm bg-primary/20 hover:bg-primary/40 text-white font-semibold py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${!hasUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon name="fas fa-play" /> Ver
                    </a>
                    <button
                        onClick={() => hasTexts && onGenerateQuiz(video.id)}
                        disabled={!hasTexts}
                        title={!hasTexts ? "Añade un texto para generar el quiz" : "Generar quiz con IA"}
                        className={`flex-1 text-sm bg-cyan-500/20 hover:bg-cyan-500/40 text-white font-semibold py-2 px-2 rounded-lg transition-colors ${!hasTexts ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Icon name="fas fa-question" /> Quiz
                    </button>
                    <button onClick={() => onManageTexts(video.id)} className="flex-1 text-sm bg-pink-500/20 hover:bg-pink-500/40 text-white font-semibold py-2 px-2 rounded-lg transition-colors"><Icon name="fas fa-file-alt" /> Texto</button>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg cursor-default transition-colors ${isCompleted ? 'bg-green-500/10' : 'bg-slate-700/50'}`}>
                    <input type="checkbox" checked={isCompleted} disabled className="w-5 h-5 accent-success" />
                    <span className={`text-sm font-medium ${isCompleted ? 'text-green-300' : 'text-slate-400'}`}>{isCompleted ? 'Completado' : 'Pendiente'}</span>
                </div>
            </div>
        </div>
    );
};


interface StudentCardProps {
    student: Student;
    onGeneratePdf: (studentId: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onGeneratePdf }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center text-5xl border-4 border-slate-700">{student.icon || '👨‍🎓'}</div>
        <h3 className="text-xl font-bold">{student.name}</h3>
        <p className="text-slate-400 mb-4">{student.role}</p>
        {student.skills && student.skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
                {student.skills.map(skill => <span key={skill} className="bg-primary/20 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>)}
            </div>
        )}
        <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
                <span>Progreso General:</span>
                <span className="font-bold">{student.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full" style={{ width: `${student.progress}%` }}></div>
            </div>
        </div>
        <button onClick={() => onGeneratePdf(student.id)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            <Icon name="fas fa-file-pdf" /> Generar Reporte
        </button>
    </div>
);


interface ResourceCardProps {
    icon: string;
    title: string;
    description: string;
    href?: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ icon, title, description, href }) => {
    const content = (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1 h-full flex flex-col items-center justify-center">
            <Icon name={icon} className="text-4xl text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-slate-400">{description}</p>
        </div>
    );
    return href ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a> : <div>{content}</div>;
};


interface VibeModuleCardProps {
    module: Module;
    progress: { [key: string]: boolean };
    user: User | null;
    videoUrls: { [key: string]: string };
    videoTexts: { [key: string]: VideoText[] };
    onEditUrl: (videoId: string) => void;
    onManageTexts: (videoId: string) => void;
    onGenerateQuiz: (videoId: string) => void;
}

export const VibeModuleCard: React.FC<VibeModuleCardProps> = ({ module, progress, user, videoUrls, videoTexts, onEditUrl, onManageTexts, onGenerateQuiz }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-sky-500 p-6 text-center">
            <h3 className="text-xl font-bold">{module.title}</h3>
            <p className="text-slate-200">Objetivo: {module.objective}</p>
        </div>
        <div className="p-6">
            <p className="text-slate-400 mb-6">{module.description}</p>
            <div className="flex gap-8">
                {module.videos.map(video => (
                     <div key={video.id} className="w-80 flex-shrink-0">
                        <VideoCard 
                            video={video} 
                            phase="vibe" 
                            isCompleted={!!progress[video.id]} 
                            url={videoUrls[video.id]}
                            texts={videoTexts[video.id] || []}
                            user={user}
                            onEditUrl={onEditUrl}
                            onManageTexts={onManageTexts}
                            onGenerateQuiz={onGenerateQuiz}
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
);