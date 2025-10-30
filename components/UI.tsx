import React from 'react';

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
    <i className={`${name} ${className}`}></i>
);

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-dark to-darker border border-primary/30 rounded-2xl max-w-lg w-full relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-primary/20 flex-shrink-0">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-primary/20 hover:bg-danger/80 flex items-center justify-center transition-colors">
                        <Icon name="fas fa-times" />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export const Notification: React.FC<NotificationProps> = ({ message, type }) => {
    const styles = {
        success: 'from-green-500 to-emerald-500',
        error: 'from-red-500 to-rose-500',
        warning: 'from-yellow-500 to-amber-500',
        info: 'from-blue-500 to-sky-500',
    };
    return (
        <div className={`fixed top-24 right-6 bg-gradient-to-r ${styles[type]} text-white py-3 px-5 rounded-lg shadow-xl z-50 animate-slideInRight`}>
            {message}
        </div>
    );
};