import { Student, User, VideoText } from '../types';
import { ALL_VIDEOS, CONFIG } from '../constants';

const createPDFContent = (student: Student): string => {
    const completedVideos = ALL_VIDEOS.filter(video => student.fase1Progress && student.fase1Progress[video.id]);
    const pendingVideos = ALL_VIDEOS.filter(video => !student.fase1Progress || !student.fase1Progress[video.id]);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Progreso - ${student.name}</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 2em; font-weight: bold; color: #7c3aed; margin-bottom: 10px; }
                .student-info { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
                .progress-section { margin-bottom: 30px; }
                .progress-bar { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
                .progress-fill { height: 100%; background: #7c3aed; }
                .video-list { margin: 20px 0; }
                .video-item { padding: 10px; border-left: 4px solid #28a745; margin: 10px 0; background: #f8f9fa; }
                .video-item.pending { border-left-color: #ffc107; }
                .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
                @media print { body { margin: 20px; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">GESSOF ACADEMY</div>
                <h1>Reporte de Progreso Académico</h1>
                <p>Generado el: ${new Date().toLocaleString('es-CL')}</p>
            </div>

            <div class="student-info">
                <h2>${student.icon || '👨‍🎓'} ${student.name}</h2>
                <p><strong>Rol:</strong> ${student.role}</p>
                <p><strong>Email:</strong> ${student.email}</p>
                ${student.skills && student.skills.length > 0 ? `<p><strong>Habilidades:</strong> ${student.skills.join(', ')}</p>` : ''}
            </div>

            <div class="progress-section">
                <h3>📊 Resumen de Progreso</h3>
                <p><strong>Progreso General:</strong> ${student.progress}%</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${student.progress}%"></div></div>
            </div>

            <div class="progress-section">
                <h3>✅ Clases Completadas (${completedVideos.length})</h3>
                <div class="video-list">
                    ${completedVideos.map(video => `<div class="video-item"><strong>${video.title}</strong></div>`).join('') || '<p>Ninguna</p>'}
                </div>
            </div>

            <div class="progress-section">
                <h3>⏳ Clases Pendientes (${pendingVideos.length})</h3>
                <div class="video-list">
                    ${pendingVideos.map(video => `<div class="video-item pending"><strong>${video.title}</strong></div>`).join('') || '<p>Ninguna</p>'}
                </div>
            </div>

            <div class="footer">
                <p><strong>GESSOF LTDA</strong> - Portal de Adopción de IA Empresarial</p>
            </div>
        </body>
        </html>
    `;
};

export const generateStudentPDF = (student: Student) => {
    const reportContent = createPDFContent(student);
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write(reportContent);
        reportWindow.document.close();
        setTimeout(() => {
            reportWindow.print();
        }, 500);
    }
};

export const loginUser = async (email: string): Promise<{ status: string; user?: User; message?: string }> => {
    const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getUser&email=${encodeURIComponent(email)}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const getAllStudentsFromSheet = async (): Promise<{ status: string; students?: Student[]; message?: string }> => {
    const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getAllStudents`);
    if (!response.ok) {
        throw new Error('Network response was not ok while fetching students.');
    }
    return response.json();
};

export const saveProgressToSheet = async (data: { action: string; email: string; globalProgress: string; fase1Progress: { [key: string]: boolean } }) => {
    const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });
    if (!response.ok) {
        console.error("Failed to save progress", await response.text());
    }
    const result = await response.json();
    if (result.status !== 'success') {
       console.error("Error saving progress to sheet:", result.message);
    }
};

export const getVideoUrlsFromSheet = async (): Promise<{ status: string; urls?: { [key: string]: string }; message?: string }> => {
    const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getVideoUrls`);
    if (!response.ok) {
        throw new Error('Network response was not ok while fetching video URLs.');
    }
    return response.json();
};

export const saveVideoUrlToSheet = async (videoId: string, url: string) => {
    const postData = { action: 'setVideoUrl', videoId, url };
    const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });
    if (!response.ok) throw new Error('Failed to save video URL');
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to save video URL');
};

// --- FILE & TEXT MANAGEMENT ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const uploadFileToDrive = async (file: File): Promise<{ status: string; fileUrl?: string; message?: string }> => {
    try {
        const fileData = await fileToBase64(file);
        const postData = {
            action: 'uploadFile',
            fileName: file.name,
            mimeType: file.type,
            data: fileData
        };

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(postData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        return response.json();

    } catch (error) {
        console.error("Error uploading file:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
        return { status: 'error', message: `Error en la subida: ${errorMessage}` };
    }
};

export const getVideoTextsFromSheet = async (videoId?: string): Promise<{ status: string; texts?: VideoText[]; textsByVideoId?: { [key: string]: VideoText[] }; message?: string }> => {
    const url = videoId 
        ? `${CONFIG.SCRIPT_URL}?action=getVideoTexts&videoId=${encodeURIComponent(videoId)}`
        : `${CONFIG.SCRIPT_URL}?action=getVideoTexts`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok while fetching video texts.');
    }
    return response.json();
};

export const getFileContentFromSheet = async (fileUrl: string): Promise<{ status: string; content?: string; message?: string }> => {
    const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getFileContent&fileUrl=${encodeURIComponent(fileUrl)}`);
    if (!response.ok) {
        throw new Error('Network response was not ok while fetching file content.');
    }
    return response.json();
};

export const addVideoTextToSheet = async (videoId: string, fileName: string, fileUrl: string) => {
    const postData = { action: 'addVideoText', videoId, fileName, fileUrl };
    const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });
    if (!response.ok) throw new Error('Failed to add text record');
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to add text record');
};

export const deleteVideoTextFromSheet = async (videoId: string, fileUrl: string) => {
    const postData = { action: 'deleteVideoText', videoId, fileUrl };
    const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });
    if (!response.ok) throw new Error('Failed to delete text record');
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'No se pudo eliminar el registro del texto.');
    }
};
