
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Student, TabId } from './types';
import { CONFIG, ALL_VIDEOS, TABS } from './constants';
import { Header, Navigation, Footer, FloatingActions } from './components/Layout';
import { Hero } from './components/Hero';
import { OverviewPanel, PhaseOnePanel, PhaseTwoPanel, VirtualClassroomPanel, StudentsPanel, ResourcesPanel, CalendarPanel } from './components/Panels';
import { Modal, Notification } from './components/UI';
import { generateStudentPDF, loginUser, saveProgressToSheet, getAllStudentsFromSheet } from './services/pdfGenerator';

const App: React.FC = () => {
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        try {
            const storedUser = window.localStorage.getItem('gessof_user');
            if (storedUser) {
                const loggedInUser: User = JSON.parse(storedUser);
                setUser(loggedInUser);
                const storedProgress = window.localStorage.getItem(`gessof_progress_${loggedInUser.email}`);
                if (storedProgress) {
                    setProgress(JSON.parse(storedProgress));
                }
            }
        } catch (error) {
            console.error("Failed to load user from local storage", error);
        }

        const handleHashChange = () => {
            const hash = window.location.hash.substring(1) as TabId;
            if (TABS.some(tab => tab.id === hash)) {
                setActiveTab(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        const timer = setTimeout(() => setIsAppLoading(false), 2000);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            clearTimeout(timer);
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);
    
    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    useEffect(() => {
        // Redirect non-admins trying to access the students tab via URL hash
        if (activeTab === 'students' && user && user.role !== 'Administrador') {
            setActiveTab('overview');
            window.location.hash = 'overview';
            showNotification('Acceso restringido a administradores.', 'warning');
        }
    }, [activeTab, user, showNotification]);
    
    useEffect(() => {
        const fetchStudents = async () => {
            if (activeTab === 'students' && user?.role === 'Administrador' && students.length === 0) {
                setIsLoadingStudents(true);
                try {
                    const result = await getAllStudentsFromSheet();
                    if (result.status === 'success' && result.students) {
                        setStudents(result.students);
                    } else {
                        showNotification(result.message || 'No se pudo cargar a los estudiantes.', 'error');
                    }
                } catch (error) {
                    console.error("Failed to fetch students:", error);
                    showNotification('Error de conexión al buscar estudiantes.', 'error');
                } finally {
                    setIsLoadingStudents(false);
                }
            }
        };

        fetchStudents();
    }, [activeTab, user, students.length, showNotification]);


    const handleLogin = async (email: string) => {
        setIsLoggingIn(true);
        try {
            const loginResult = await loginUser(email.trim());
    
            if (loginResult.status === 'success' && loginResult.user) {
                const loggedInUser = loginResult.user;
                setUser(loggedInUser);
                window.localStorage.setItem('gessof_user', JSON.stringify(loggedInUser));
    
                // Fetch all students data to get the detailed progress for the logged-in user
                const studentsResult = await getAllStudentsFromSheet();
                let userProgress = {};
    
                if (studentsResult.status === 'success' && studentsResult.students) {
                    const currentUserData = studentsResult.students.find(s => s.email === loggedInUser.email);
                    if (currentUserData && currentUserData.fase1Progress) {
                        userProgress = currentUserData.fase1Progress;
                    }
                    // If the user is an admin, pre-populate the students list
                    if (loggedInUser.role === 'Administrador') {
                        setStudents(studentsResult.students);
                    }
                }
    
                // Fallback to local storage if fetching all students fails or user not found in list
                if (Object.keys(userProgress).length === 0) {
                    const storedProgress = window.localStorage.getItem(`gessof_progress_${loggedInUser.email}`);
                    if (storedProgress) {
                        try {
                           userProgress = JSON.parse(storedProgress);
                        } catch(e) {
                           console.error("Failed to parse progress from local storage", e);
                           userProgress = {};
                        }
                    }
                }
    
                setProgress(userProgress);
                window.localStorage.setItem(`gessof_progress_${loggedInUser.email}`, JSON.stringify(userProgress));
                
                showNotification(`¡Bienvenido ${loggedInUser.name}!`, 'success');
    
            } else if (loginResult.status === 'not_found') {
                showNotification('Usuario no encontrado. Revisa tu email.', 'warning');
            } else {
                showNotification(loginResult.message || 'Ocurrió un error al iniciar sesión.', 'error');
            }
        } catch (error) {
            console.error("Login failed:", error);
            showNotification('Error de conexión. Inténtalo de nuevo.', 'error');
        } finally {
            setIsLoggingIn(false);
        }
    };
    
    const handleLogout = () => {
        setUser(null);
        setProgress({});
        setActiveTab('overview');
        window.location.hash = 'overview';
        window.localStorage.removeItem('gessof_user');
        showNotification('Has cerrado sesión.', 'info');
    };

    const debouncedSave = useCallback((email: string, currentProgress: { [key: string]: boolean }) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = window.setTimeout(async () => {
            const completed = Object.values(currentProgress).filter(Boolean).length;
            const total = ALL_VIDEOS.length;
            const globalProgress = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';

            try {
                await saveProgressToSheet({
                    email,
                    globalProgress,
                    fase1Progress: currentProgress,
                });
                 console.log("Progress saved to Google Sheet.");
            } catch (error) {
                console.error("Failed to save progress to sheet:", error);
                showNotification('Error al guardar progreso en la nube.', 'error');
            }
        }, 2000);
    }, [showNotification]);

    const handleToggleProgress = (videoId: string) => {
        if (!user) {
            showNotification('Debes iniciar sesión para guardar tu progreso.', 'warning');
            return;
        }
        const newProgress = { ...progress, [videoId]: !progress[videoId] };
        setProgress(newProgress);
        window.localStorage.setItem(`gessof_progress_${user.email}`, JSON.stringify(newProgress));

        setStudents(prevStudents => prevStudents.map(student => {
            if (student.email === user.email) {
                const completed = Object.values(newProgress).filter(Boolean).length;
                const total = ALL_VIDEOS.length;
                return { ...student, progress: Math.round((completed / total) * 100), fase1Progress: newProgress };
            }
            return student;
        }));
        
        debouncedSave(user.email, newProgress);
    };

    const handleExportProgress = () => {
        const data = {
            students,
            exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gessof_progress_global_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Progreso global exportado', 'success');
    };
    
    const handleGeneratePdf = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            generateStudentPDF(student);
        }
    };


    const renderPanel = () => {
        switch (activeTab) {
            case 'fase1': return <PhaseOnePanel progress={progress} onToggleProgress={handleToggleProgress} />;
            case 'fase2': return <PhaseTwoPanel progress={progress} onToggleProgress={handleToggleProgress} />;
            case 'aula-virtual': return <VirtualClassroomPanel />;
            case 'students': 
                return user?.role === 'Administrador' 
                    ? <StudentsPanel students={students} onGeneratePdf={handleGeneratePdf} isLoading={isLoadingStudents} /> 
                    : <OverviewPanel />;
            case 'resources': return <ResourcesPanel />;
            case 'calendar': return <CalendarPanel />;
            case 'overview':
            default:
                return <OverviewPanel />;
        }
    };
    
    if (isAppLoading) {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-darker to-dark z-50 flex flex-col items-center justify-center">
                <div className="font-orbitron text-6xl font-black bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent mb-8 animate-pulse">GESSOF</div>
                <div className="w-[300px] h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full animate-[loading_2s_ease-in-out]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-darker text-light font-sans min-h-screen">
            <Header user={user} progress={progress} onLogout={handleLogout} />
            <Hero>
                {!user ? 
                    <Hero.LoginForm onLogin={handleLogin} isLoading={isLoggingIn} /> :
                    <Hero.Countdown targetDate={CONFIG.startDateFase1} title="🚀 Inicio Fase 1 (n8n): Lunes 29 de Septiembre 2024" />
                }
            </Hero>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPanel()}
            </main>

            <Footer />
            <FloatingActions onExport={handleExportProgress} user={user} />
            
            <Modal title={modalTitle} isOpen={!!modalContent} onClose={() => setModalContent(null)}>
                {modalContent}
            </Modal>

            {notification && <Notification message={notification.message} type={notification.type} />}
        </div>
    );
};

export default App;
