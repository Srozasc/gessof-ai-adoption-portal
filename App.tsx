import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Student, TabId, VideoText, QuizQuestion } from './types';
import { CONFIG, ALL_VIDEOS, TABS } from './constants';
import { Header, Navigation, Footer, FloatingActions } from './components/Layout';
import { Hero } from './components/Hero';
import { OverviewPanel, PhaseOnePanel, PhaseTwoPanel, VirtualClassroomPanel, StudentsPanel, ResourcesPanel, CalendarPanel } from './components/Panels';
import { Modal, Notification, Icon } from './components/UI';
import { generateStudentPDF, loginUser, saveProgressToSheet, getAllStudentsFromSheet, getVideoUrlsFromSheet, saveVideoUrlToSheet, getVideoTextsFromSheet, addVideoTextToSheet, deleteVideoTextFromSheet, uploadFileToDrive, getFileContentFromSheet } from './services/pdfGenerator';

const VideoUrlForm: React.FC<{ currentUrl: string; onSave: (url: string) => void; onCancel: () => void; }> = ({ currentUrl, onSave, onCancel }) => {
    const [url, setUrl] = useState(currentUrl);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(url);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL del Video de YouTube</label>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-dark/80 border border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                />
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onCancel} className="w-full bg-slate-600/50 hover:bg-slate-600/80 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                    Guardar URL
                </button>
            </div>
        </form>
    );
};

const TextManager: React.FC<{
    videoId: string;
    initialTexts: VideoText[];
    onClose: () => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onTextsUpdated: (videoId: string, newTexts: VideoText[]) => void;
}> = ({ videoId, initialTexts, onClose, showNotification, onTextsUpdated }) => {
    const [texts, setTexts] = useState<VideoText[]>(initialTexts);
    const [newFileName, setNewFileName] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewFile(e.target.files[0]);
            if (!newFileName) {
                setNewFileName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleAddText = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileName || !newFile) {
            showNotification('Nombre de archivo y archivo son requeridos.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            showNotification('Subiendo archivo...', 'info');
            const uploadResult = await uploadFileToDrive(newFile);
            if (uploadResult.status !== 'success' || !uploadResult.fileUrl) {
                 throw new Error(uploadResult.message || 'Error en la subida del archivo.');
            }
            
            const fileUrl = uploadResult.fileUrl;
            showNotification('Archivo subido. Guardando referencia...', 'info');
            await addVideoTextToSheet(videoId, newFileName, fileUrl);
            
            const newTexts = [...texts, { fileName: newFileName, fileUrl: fileUrl }];
            setTexts(newTexts);
            onTextsUpdated(videoId, newTexts);
            setNewFileName('');
            setNewFile(null);
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            showNotification('Texto añadido con éxito.', 'success');
        } catch (error) {
            console.error('Failed to add text:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al añadir el texto.';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteText = async (fileUrl: string) => {
        try {
            await deleteVideoTextFromSheet(videoId, fileUrl);
            const newTexts = texts.filter(text => text.fileUrl !== fileUrl);
            setTexts(newTexts);
            onTextsUpdated(videoId, newTexts);
            showNotification('Texto eliminado.', 'success');
        } catch (error) {
            console.error('Failed to delete text:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el texto.';
            showNotification(errorMessage, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-lg mb-2">Textos Actuales</h4>
                {texts.length > 0 ? (
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {texts.map((text, index) => (
                            <li key={index} className="flex items-center justify-between bg-dark/80 p-2 rounded-lg">
                                <a href={text.fileUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate">
                                    <Icon name="fas fa-file-alt mr-2" />{text.fileName}
                                </a>
                                <button onClick={() => handleDeleteText(text.fileUrl)} className="w-7 h-7 flex-shrink-0 rounded-full bg-red-500/20 hover:bg-red-500/50 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                                    <Icon name="fas fa-trash" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400">No hay textos asociados a este video.</p>
                )}
            </div>
            <form onSubmit={handleAddText} className="space-y-4 border-t border-primary/20 pt-4">
                <h4 className="font-bold text-lg">Añadir Nuevo Texto</h4>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre para mostrar</label>
                    <input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="w-full bg-dark/80 border border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Resumen de la clase" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Archivo (PDF, DOCX, TXT...)</label>
                    <input id="file-upload" type="file" onChange={handleFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/40" required />
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="w-full bg-slate-600/50 hover:bg-slate-600/80 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isSubmitting ? <Icon name="fas fa-spinner fa-spin mr-2" /> : <Icon name="fas fa-upload mr-2" /> }
                        {isSubmitting ? 'Subiendo...' : 'Subir y Guardar'}
                    </button>
                </div>
                 <p className="text-xs text-slate-500 text-center">El archivo se subirá a la carpeta centralizada de Google Drive.</p>
            </form>
        </div>
    );
};

const TextDownloader: React.FC<{ texts: VideoText[] }> = ({ texts }) => (
    <div>
        <h4 className="font-bold text-lg mb-4">Textos Disponibles</h4>
        <ul className="space-y-3">
            {texts.map((text, index) => (
                <li key={index}>
                    <a href={text.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-left bg-primary/20 hover:bg-primary/40 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-3">
                        <Icon name="fas fa-download" />
                        <span>{text.fileName}</span>
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

const QuizComponent: React.FC<{
    questions: QuizQuestion[];
    onSubmit: (answers: { [key: number]: number }) => void;
}> = ({ questions, onSubmit }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});

    const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(selectedAnswers).length === questions.length) {
            onSubmit(selectedAnswers);
        } else {
            alert("Por favor, responde todas las preguntas.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="border-b border-primary/20 pb-4">
                    <p className="font-semibold text-slate-200 mb-3">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, oIndex) => (
                            <label key={oIndex} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-dark/80 hover:bg-primary/20 transition-colors">
                                <input
                                    type="radio"
                                    name={`question-${qIndex}`}
                                    checked={selectedAnswers[qIndex] === oIndex}
                                    onChange={() => handleSelectAnswer(qIndex, oIndex)}
                                    className="w-5 h-5 accent-primary"
                                    required
                                />
                                <span className="text-slate-300">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Verificar Respuestas
            </button>
        </form>
    );
};

const QuizResultComponent: React.FC<{
    questions: QuizQuestion[];
    userAnswers: { [key: number]: number };
    score: number;
    onClose: () => void;
}> = ({ questions, userAnswers, score, onClose }) => {
    const passed = score >= 2;

    return (
        <div className="space-y-6">
            <div className={`text-center p-4 rounded-lg border ${passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <h4 className={`text-xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>{passed ? '¡Aprobado!' : 'Inténtalo de nuevo'}</h4>
                <p className="text-2xl font-orbitron my-2">{score} / {questions.length}</p>
                <p className="text-sm">{passed ? '¡Felicidades! Has completado la lección.' : 'Repasa el material y vuelve a intentarlo.'}</p>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {questions.map((q, qIndex) => {
                    const userAnswer = userAnswers[qIndex];
                    const correctAnswer = q.answer;
                    const isCorrect = userAnswer === correctAnswer;

                    return (
                        <div key={qIndex} className="border-b border-primary/20 pb-3">
                            <p className="font-semibold text-slate-200 mb-2">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-1">
                                {q.options.map((option, oIndex) => {
                                    let optionClass = 'bg-dark/80';
                                    let indicator = '';

                                    if (oIndex === correctAnswer) {
                                        optionClass = 'bg-green-500/20 border border-green-500/30';
                                        indicator = '✅';
                                    }
                                    if (oIndex === userAnswer && !isCorrect) {
                                        optionClass = 'bg-red-500/20 border border-red-500/30';
                                        indicator = '❌';
                                    }

                                    return (
                                        <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${optionClass}`}>
                                            <span className="text-slate-300 flex-1">{option}</span>
                                            <span className="font-bold">{indicator}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
             <button onClick={onClose} className="w-full bg-slate-600/50 hover:bg-slate-600/80 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Cerrar
            </button>
        </div>
    );
};


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
    const [videoUrls, setVideoUrls] = useState<{ [key: string]: string }>({});
    const [videoTexts, setVideoTexts] = useState<{ [key: string]: VideoText[] }>({});
    const [isModalLoading, setIsModalLoading] = useState(false);

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

        const fetchInitialData = async () => {
            try {
                const [urlsResult, textsResult] = await Promise.all([
                    getVideoUrlsFromSheet(),
                    getVideoTextsFromSheet() // Fetch all texts
                ]);

                if (urlsResult.status === 'success' && urlsResult.urls) {
                    setVideoUrls(urlsResult.urls);
                }
                if (textsResult.status === 'success' && textsResult.textsByVideoId) {
                    setVideoTexts(textsResult.textsByVideoId);
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
                showNotification("No se pudieron cargar los datos iniciales.", "error");
            }
        };

        fetchInitialData();

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
        setTimeout(() => setNotification(null), 5000);
    }, []);

    useEffect(() => {
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
    
                const studentsResult = await getAllStudentsFromSheet();
                let userProgress = {};
    
                if (studentsResult.status === 'success' && studentsResult.students) {
                    const currentUserData = studentsResult.students.find(s => s.email === loggedInUser.email);
                    if (currentUserData && currentUserData.fase1Progress) {
                        userProgress = currentUserData.fase1Progress;
                    }
                    if (loggedInUser.role === 'Administrador') {
                        setStudents(studentsResult.students);
                    }
                }
    
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
                    action: 'updateProgress',
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
    
    const handleSaveVideoUrl = async (videoId: string, url: string) => {
        try {
            await saveVideoUrlToSheet(videoId, url);
            setVideoUrls(prev => ({ ...prev, [videoId]: url }));
            showNotification('URL del video actualizada con éxito.', 'success');
            setModalContent(null);
        } catch (error) {
            console.error("Error saving video URL:", error);
            showNotification('Error al guardar la URL del video.', 'error');
        }
    };

    const openVideoUrlModal = (videoId: string) => {
        const currentUrl = videoUrls[videoId] || '';
        const videoTitle = ALL_VIDEOS.find(v => v.id === videoId)?.title || 'video seleccionado';
        setModalTitle(`Editar URL para: ${videoTitle}`);
        setModalContent(
            <VideoUrlForm 
                currentUrl={currentUrl} 
                onSave={(newUrl) => handleSaveVideoUrl(videoId, newUrl)}
                onCancel={() => setModalContent(null)}
            />
        );
    };

    const handleTextsUpdated = (videoId: string, newTexts: VideoText[]) => {
        setVideoTexts(prev => ({...prev, [videoId]: newTexts}));
    }

    const handleManageTexts = async (videoId: string) => {
        const videoTitle = ALL_VIDEOS.find(v => v.id === videoId)?.title || 'video';
        const title = user?.role === 'Administrador' ? `Gestionar Textos: ${videoTitle}` : `Descargar Textos: ${videoTitle}`;
        setModalTitle(title);
        
        const textsForVideo = videoTexts[videoId] || [];
        
        if (user?.role === 'Administrador') {
            setModalContent(
                <TextManager 
                    videoId={videoId}
                    initialTexts={textsForVideo} 
                    onClose={() => setModalContent(null)}
                    showNotification={showNotification}
                    onTextsUpdated={handleTextsUpdated}
                />
            );
        } else {
            if (textsForVideo.length === 0) {
                showNotification('No hay textos disponibles para este video.', 'info');
                return;
            }
            if (textsForVideo.length === 1) {
                 window.open(textsForVideo[0].fileUrl, '_blank');
                 return;
            }
            setModalContent(<TextDownloader texts={textsForVideo} />);
        }
    };
    
    const handleGenerateQuiz = async (videoId: string) => {
        const videoTitle = ALL_VIDEOS.find(v => v.id === videoId)?.title || 'video';
        setModalTitle(`Generando Quiz: ${videoTitle}`);
        setModalContent(null);
        setIsModalLoading(true);

        try {
            const texts = videoTexts[videoId];
            if (!texts || texts.length === 0) {
                throw new Error("No hay textos para generar el quiz.");
            }
            const sourceTextUrl = texts[0].fileUrl; 
            
            showNotification('Obteniendo material de estudio...', 'info');
            const contentResult = await getFileContentFromSheet(sourceTextUrl);

            if (contentResult.status !== 'success' || !contentResult.content) {
                throw new Error(contentResult.message || "No se pudo leer el contenido del archivo.");
            }
            
            showNotification('Creando preguntas con IA...', 'info');
            const prompt = `Eres un asistente educativo experto. A partir del siguiente texto, genera un cuestionario de 3 preguntas de opción múltiple para evaluar la comprensión del contenido. Cada pregunta debe tener 4 opciones. Debes devolver SÓLO un array JSON con 3 objetos. Cada objeto debe tener las claves "question" (string), "options" (array de 4 strings), y "answer" (number, el índice de la respuesta correcta de 0 a 3). Texto: "${contentResult.content.substring(0, 8000)}"`;

            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al comunicarse con el servidor de Vercel.');
            }

            const data = await response.json();
            const quizQuestions: QuizQuestion[] = JSON.parse(data.text);

            if (!quizQuestions || quizQuestions.length < 3) {
                 throw new Error("La IA no generó un quiz válido. Inténtalo de nuevo.");
            }

            const handleQuizSubmit = (userAnswers: { [key: number]: number }) => {
                let score = 0;
                quizQuestions.forEach((q, index) => {
                    if (q.answer === userAnswers[index]) {
                        score++;
                    }
                });

                const passed = score >= 2;
                if (passed) {
                    showNotification('¡Felicidades! Aprobaste el quiz. Clase marcada como completada.', 'success');
                    if (!progress[videoId]) {
                        handleToggleProgress(videoId);
                    }
                } else {
                    showNotification('No has superado el quiz. ¡Repasa el material y vuelve a intentarlo!', 'warning');
                }

                setModalTitle(`Resultado del Quiz: ${videoTitle}`);
                setModalContent(
                    <QuizResultComponent 
                        questions={quizQuestions}
                        userAnswers={userAnswers}
                        score={score}
                        onClose={() => setModalContent(null)}
                    />
                );
            };

            setModalTitle(`Quiz Rápido: ${videoTitle}`);
            setModalContent(
                <QuizComponent 
                    questions={quizQuestions}
                    onSubmit={handleQuizSubmit} 
                />
            );

        } catch (error) {
            console.error("Failed to generate quiz:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            showNotification(`Error al generar quiz: ${errorMessage}`, 'error');
            setModalContent(null);
        } finally {
            setIsModalLoading(false);
        }
    };


    const renderPanel = () => {
        const panelProps = {
            progress,
            user,
            videoUrls,
            videoTexts,
            onEditVideoUrl: openVideoUrlModal,
            onManageTexts: handleManageTexts,
            onGenerateQuiz: handleGenerateQuiz
        };
        switch (activeTab) {
            case 'fase1': return <PhaseOnePanel {...panelProps} />;
            case 'fase2': return <PhaseTwoPanel {...panelProps} />;
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
            
            <Modal title={modalTitle} isOpen={!!modalContent || isModalLoading} onClose={() => { setModalContent(null); setIsModalLoading(false); }}>
                {isModalLoading ? (
                    <div className="text-center p-8"><Icon name="fas fa-spinner fa-spin text-4xl text-primary" /><p className="mt-4 text-slate-300">Generando quiz con IA...</p></div>
                ) : modalContent}
            </Modal>

            {notification && <Notification message={notification.message} type={notification.type} />}
        </div>
    );
};

export default App;