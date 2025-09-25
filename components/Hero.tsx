
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Icon } from './UI';

interface LoginFormProps {
    onLogin: (email: string) => void;
    isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && !isLoading) {
            onLogin(email);
        }
    };

    return (
        <div className="bg-primary/5 backdrop-blur-lg border border-primary/20 rounded-2xl p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-center">👤 Acceso de Estudiante</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Correo electrónico</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="w-full bg-dark/80 border border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" 
                        placeholder="tu@email.com" 
                        required 
                        disabled={isLoading}
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? <Icon name="fas fa-spinner fa-spin" /> : <><Icon name="fas fa-sign-in-alt mr-2" /> Ingresar</>}
                </button>
            </form>
        </div>
    );
};

interface CountdownProps {
    targetDate: Date;
    title: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, title }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => (
        <div key={interval} className="text-center">
            <span className="font-orbitron text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{String(value).padStart(2, '0')}</span>
            <span className="block text-xs uppercase text-slate-400 mt-1">{interval}</span>
        </div>
    ));

    return (
        <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-center mb-4">{title}</h3>
            <div className="flex justify-center gap-4 md:gap-8">
                {timerComponents.length ? timerComponents : <span className="text-2xl font-bold">¡El curso ha comenzado!</span>}
            </div>
        </div>
    );
};

interface HeroComposition {
    LoginForm: React.FC<LoginFormProps>;
    Countdown: React.FC<CountdownProps>;
}

export const Hero: React.FC<{ children: React.ReactNode }> & HeroComposition = ({ children }) => {
    return (
        <section className="relative py-16 md:py-24 overflow-hidden">
             <div className="absolute inset-0 bg-grid-primary/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                <h1 className="font-orbitron text-4xl md:text-6xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                    Portal de Adopción de IA Empresarial
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
                    Capacitación integral en n8n y Mentoría Vibe Coding - GESSOF Academy
                </p>
                {children}
            </div>
        </section>
    );
};

Hero.LoginForm = LoginForm;
Hero.Countdown = Countdown;
