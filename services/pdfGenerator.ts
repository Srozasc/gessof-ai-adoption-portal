
import { Student, User } from '../types';
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

export const saveProgressToSheet = async (data: { email: string; globalProgress: string; fase1Progress: { [key: string]: boolean } }) => {
    await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        // Using 'text/plain' for the body's Content-Type can help avoid CORS preflight issues with simple Apps Script POST requests.
        // The script itself will parse the JSON string from the postData contents.
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        mode: 'no-cors' // Apps Script doPost often requires this mode from web apps. The response cannot be read but the request is sent.
    });
};