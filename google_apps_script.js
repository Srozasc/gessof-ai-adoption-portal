
const USERS_SHEET_NAME = "Usuarios";
const PROGRESS_SHEET_NAME = "Progreso_Estudiantes";
const VIDEO_URLS_SHEET_NAME = "VideoUrls";

function doGet(e) {
  try {
    if (e.parameter.action === "getUser") {
      const email = e.parameter.email;
      if (email) {
        return getUserData(email);
      }
      throw new Error("Email no proporcionado");
    }
    
    if (e.parameter.action === "getAllStudents") {
      return getAllStudentsData();
    }

    if (e.parameter.action === "getVideoUrls") {
      return getVideoUrls();
    }

    throw new Error("Acción no válida");

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'setVideoUrl') {
        if (!data.videoId || typeof data.url === 'undefined') {
            throw new Error("Los parámetros 'videoId' y 'url' son requeridos.");
        }
        setVideoUrl(data.videoId, data.url);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "URL del video guardada correctamente" })).setMimeType(ContentService.MimeType.JSON);
    
    } else { // La acción por defecto es 'updateProgress' para mantener compatibilidad
        const { email, globalProgress, fase1Progress } = data;
        if (!email) {
          throw new Error("El email es requerido para guardar el progreso.");
        }
        updateStudentProgress(email, globalProgress, JSON.stringify(fase1Progress));
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Progreso guardado correctamente" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    // Esto es útil para ver los errores en los logs de Apps Script (Executions)
    console.error("Error en doPost: " + error.toString()); 
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Error al procesar la solicitud: " + error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getUserData(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === email.toLowerCase()) {
      const user = {
        email: data[i][0],
        name: data[i][1],
        role: data[i][2]
      };
      return ContentService.createTextOutput(JSON.stringify({ status: "success", user: user })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "not_found", message: "Usuario no registrado" })).setMimeType(ContentService.MimeType.JSON);
}

function getAllStudentsData() {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET_NAME);
  const progressSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROGRESS_SHEET_NAME);

  const usersData = usersSheet.getDataRange().getValues();
  const progressData = progressSheet.getDataRange().getValues();

  const progressMap = new Map();
  for (let i = 1; i < progressData.length; i++) {
    const email = progressData[i][0].toLowerCase();
    const progressPercent = progressData[i][1];
    const progressJsonString = progressData[i][2];
    
    let progressJson = {};
    try {
        if (progressJsonString && typeof progressJsonString === 'string') {
           progressJson = JSON.parse(progressJsonString);
        }
    } catch (e) { /* Ignorar JSON inválido */ }

    let progressValue = 0;
    if (typeof progressPercent === 'number') {
        progressValue = Math.round(progressPercent * 100);
    } else if (typeof progressPercent === 'string' && progressPercent.trim() !== '') {
        progressValue = parseInt(progressPercent.replace('%', '').trim(), 10);
    }
    progressValue = isNaN(progressValue) ? 0 : progressValue;

    progressMap.set(email, {
      progress: progressValue,
      fase1Progress: progressJson,
    });
  }
  
  const students = [];
  for (let i = 1; i < usersData.length; i++) {
    const email = usersData[i][0].toLowerCase();
    const name = usersData[i][1];
    const role = usersData[i][2];
    
    const userProgress = progressMap.get(email) || { progress: 0, fase1Progress: {} };

    students.push({
      id: `student-${email}`,
      email: usersData[i][0],
      name: name,
      role: role,
      progress: userProgress.progress,
      fase1Progress: userProgress.fase1Progress,
      skills: [], 
      icon: '👨‍🎓', 
      fase2Progress: {},
      joinDate: '',
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "success", students: students })).setMimeType(ContentService.MimeType.JSON);
}

function updateStudentProgress(email, progress, progressJson) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROGRESS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  let userRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === email.toLowerCase()) {
      userRow = i + 1;
      break;
    }
  }

  const timestamp = new Date().toISOString();
  if (userRow !== -1) {
    sheet.getRange(userRow, 2).setValue(progress);
    sheet.getRange(userRow, 3).setValue(progressJson);
    sheet.getRange(userRow, 4).setValue(timestamp);
  } else {
    sheet.appendRow([email, progress, progressJson, timestamp]);
  }
}

// --- FUNCIONES PARA URLs DE VIDEOS ---

function getVideoUrls() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_URLS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_URLS_SHEET_NAME}" no fue encontrada.`);
  const data = sheet.getDataRange().getValues();
  const urls = {};
  // Empezar en 1 para saltar el encabezado
  for (let i = 1; i < data.length; i++) {
    const videoId = data[i][0];
    const url = data[i][1];
    if (videoId) {
      urls[videoId] = url;
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", urls: urls })).setMimeType(ContentService.MimeType.JSON);
}

function setVideoUrl(videoId, url) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_URLS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_URLS_SHEET_NAME}" no fue encontrada.`);
  const data = sheet.getDataRange().getValues();
  let videoRow = -1;

  // Empezar en 1 para saltar el encabezado
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === videoId) {
      videoRow = i + 1;
      break;
    }
  }

  if (videoRow !== -1) {
    sheet.getRange(videoRow, 2).setValue(url); // Columna B para la URL
  } else {
    sheet.appendRow([videoId, url]);
  }
}
