
import React from 'react';
import { User, TabId } from '../types';
import { ALL_VIDEOS, TABS } from '../constants';
import { Icon } from './UI';

interface HeaderProps {
    user: User | null;
    progress: { [key: string]: boolean };
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, progress, onLogout }) => {
    const completed = Object.values(progress).filter(Boolean).length;
    const total = ALL_VIDEOS.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <header className="bg-dark/80 backdrop-blur-lg sticky top-0 z-40 border-b border-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                            <Icon name="fas fa-brain" />
                        </div>
                        <h1 className="font-orbitron text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            GESSOF Academy
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="hidden md:flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-full py-2 px-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center font-bold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{user.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-full py-2 px-4">
                            <Icon name="fas fa-chart-line" className="text-success" />
                            <span className="font-bold text-success">{percentage}%</span>
                        </div>
                        {user && (
                             <button onClick={onLogout} title="Cerrar sesión" className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/50 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                                <Icon name="fas fa-sign-out-alt" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

interface NavigationProps {
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
    user: User | null;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, user }) => {
    const visibleTabs = user?.role === 'Administrador'
        ? TABS
        : TABS.filter(tab => tab.id !== 'students');
        
    return (
        <nav className="bg-black/50 backdrop-blur-lg sticky top-20 z-30 border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-2 overflow-x-auto py-3 scrollbar-hide">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                                : 'bg-primary/10 border border-primary/20 text-slate-300 hover:bg-primary/20 hover:text-white'
                                }`}
                        >
                            <Icon name={tab.icon} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export const Footer: React.FC = () => {
    return (
        <footer className="bg-black/80 border-t border-primary/20 mt-16 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
                <div className="font-orbitron text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                    GESSOF
                </div>
                <div className="flex justify-center gap-6 my-8">
                    <a href="https://www.gessof.cl" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Icon name="fas fa-globe" /> Sitio Web</a>
                    <a href="mailto:info@gessof.cl" className="hover:text-primary transition-colors"><Icon name="fas fa-envelope" /> Contacto</a>
                    <a href={process.env.REACT_APP_GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Icon name="fab fa-github" /> GitHub</a>
                </div>
                <p>&copy; {new Date().getFullYear()} GESSOF LTDA - Programa de Adopción de IA Empresarial</p>
            </div>
        </footer>
    );
};


interface FloatingActionsProps {
    onExport: () => void;
    user: User | null;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onExport, user }) => {
    if (user?.role !== 'Administrador') {
        return null;
    }
    
    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
            <button
                onClick={onExport}
                title="Exportar progreso global"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-xl flex items-center justify-center text-xl transition-transform hover:scale-110"
            >
                <Icon name="fas fa-download" />
            </button>
        </div>
    );
};
