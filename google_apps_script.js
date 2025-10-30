const USERS_SHEET_NAME = "Usuarios";
const PROGRESS_SHEET_NAME = "Progreso_Estudiantes";
const VIDEO_URLS_SHEET_NAME = "VideoUrls";
const VIDEO_TEXTS_SHEET_NAME = "VideoTexts";

const DRIVE_FOLDER_ID = "1Fs6q1JQP9ibETpvAOPS5AJ2oR8FJ865G"; 

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "getUser") {
      const email = e.parameter.email;
      if (email) return getUserData(email);
      throw new Error("Email no proporcionado");
    }
    
    if (action === "getAllStudents") {
      return getAllStudentsData();
    }

    if (action === "getVideoUrls") {
      return getVideoUrls();
    }

    if (action === "getVideoTexts") {
      const videoId = e.parameter.videoId;
      // Si se provee videoId, devuelve los textos para ese video.
      // Si no, devuelve todos los textos agrupados por videoId.
      return getVideoTexts(videoId);
    }
    
    if (action === "getFileContent") {
      const fileUrl = e.parameter.fileUrl;
      if (fileUrl) return getFileContent(fileUrl);
      throw new Error("fileUrl no proporcionado");
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

    switch (action) {
      case 'updateProgress':
        const { email, globalProgress, fase1Progress } = data;
        if (!email) throw new Error("El email es requerido para guardar el progreso.");
        updateStudentProgress(email, globalProgress, JSON.stringify(fase1Progress));
        return createJsonResponse({ status: "success", message: "Progreso guardado" });

      case 'setVideoUrl':
        if (!data.videoId || typeof data.url === 'undefined') throw new Error("Parámetros 'videoId' y 'url' requeridos.");
        setVideoUrl(data.videoId, data.url);
        return createJsonResponse({ status: "success", message: "URL guardada" });
      
      case 'addVideoText':
        const { videoId, fileName, fileUrl } = data;
        if (!videoId || !fileName || !fileUrl) throw new Error("Parámetros 'videoId', 'fileName', y 'fileUrl' requeridos.");
        addVideoText(videoId, fileName, fileUrl);
        return createJsonResponse({ status: "success", message: "Texto añadido" });

      case 'deleteVideoText':
        if (!data.videoId || !data.fileUrl) throw new Error("Parámetros 'videoId' y 'fileUrl' requeridos.");
        const deletedCount = deleteVideoText(data.videoId, data.fileUrl);
        if (deletedCount > 0) {
          return createJsonResponse({ status: "success", message: "Texto eliminado" });
        } else {
          return createJsonResponse({ status: "not_found", message: "No se encontró el texto para eliminar. Revisa los logs del script." });
        }
      
      case 'uploadFile':
        if (!data.fileName || !data.mimeType || !data.data) throw new Error("Parámetros 'fileName', 'mimeType' y 'data' (base64) requeridos.");
        const uploadedFileUrl = uploadFileToDrive(data.fileName, data.mimeType, data.data);
        return createJsonResponse({ status: "success", fileUrl: uploadedFileUrl });

      default:
        throw new Error("Acción no reconocida o datos incompletos. Asegúrate de haber desplegado la última versión del script.");
    }

  } catch (error) {
    console.error("Error en doPost: " + error.toString() + " | Payload: " + e.postData.contents.substring(0, 500)); 
    return createJsonResponse({ status: "error", message: "Error en el servidor de Google Apps Script: " + error.message });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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
      return createJsonResponse({ status: "success", user: user });
    }
  }
  return createJsonResponse({ status: "not_found", message: "Usuario no registrado" });
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

  return createJsonResponse({ status: "success", students: students });
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
  
  SpreadsheetApp.flush();
}

function getVideoUrls() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_URLS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_URLS_SHEET_NAME}" no fue encontrada.`);
  const data = sheet.getDataRange().getValues();
  const urls = {};
  for (let i = 1; i < data.length; i++) {
    const videoId = data[i][0];
    const url = data[i][1];
    if (videoId) {
      urls[videoId] = url;
    }
  }
  return createJsonResponse({ status: "success", urls: urls });
}

function setVideoUrl(videoId, url) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_URLS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_URLS_SHEET_NAME}" no fue encontrada.`);
  const data = sheet.getDataRange().getValues();
  let videoRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === videoId) {
      videoRow = i + 1;
      break;
    }
  }

  if (videoRow !== -1) {
    sheet.getRange(videoRow, 2).setValue(url);
  } else {
    sheet.appendRow([videoId, url]);
  }
}

function uploadFileToDrive(fileName, mimeType, base64Data) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const standardUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';
    return standardUrl;
  } catch (e) {
    console.error("Error al subir archivo a Drive: " + e.toString());
    throw new Error("No se pudo subir el archivo a Google Drive. Verifica el ID de la carpeta y los permisos.");
  }
}

function getFileContent(fileUrl) {
  try {
    const fileId = getDriveIdFromUrl(fileUrl);
    if (!fileId) {
      throw new Error("No se pudo extraer el ID del archivo de la URL.");
    }
    const file = DriveApp.getFileById(fileId);
    // Intenta obtener el contenido como texto. Funciona para GDocs, TXT, etc.
    // Para otros tipos como PDF, podría requerir lógica adicional o APIs externas.
    const content = file.getBlob().getDataAsString();
    return createJsonResponse({ status: "success", content: content });
  } catch(e) {
    console.error("Error al obtener contenido del archivo: " + e.toString());
    throw new Error("No se pudo leer el archivo de Google Drive. Asegúrate de que es un formato de texto compatible.");
  }
}

function getVideoTexts(videoId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_TEXTS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_TEXTS_SHEET_NAME}" no fue encontrada.`);
  const data = sheet.getDataRange().getValues();
  
  if (videoId) { // Si se pide para un video específico
    const texts = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === videoId) {
        texts.push({
          fileName: data[i][1],
          fileUrl: data[i][2]
        });
      }
    }
    return createJsonResponse({ status: "success", texts: texts });
  } else { // Si se piden todos los textos
    const textsByVideoId = {};
    for (let i = 1; i < data.length; i++) {
      const currentVideoId = data[i][0];
      if (!currentVideoId) continue;
      if (!textsByVideoId[currentVideoId]) {
        textsByVideoId[currentVideoId] = [];
      }
      textsByVideoId[currentVideoId].push({
        fileName: data[i][1],
        fileUrl: data[i][2]
      });
    }
    return createJsonResponse({ status: "success", textsByVideoId: textsByVideoId });
  }
}

function addVideoText(videoId, fileName, fileUrl) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_TEXTS_SHEET_NAME);
  if (!sheet) throw new Error(`La hoja "${VIDEO_TEXTS_SHEET_NAME}" no fue encontrada.`);
  sheet.appendRow([videoId, fileName, fileUrl, new Date().toISOString()]);
}

function getDriveIdFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/(?:(?:\/d\/)|(?:id=))([a-zA-Z0-9_-]{25,})/);
    return (match && match[1]) ? match[1] : null;
  } catch (e) {
    console.error("Error en getDriveIdFromUrl con URL: " + url + " | Error: " + e.toString());
    return null;
  }
}

function deleteVideoText(videoId, fileUrl) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VIDEO_TEXTS_SHEET_NAME);
  if (!sheet) {
    throw new Error(`La hoja "${VIDEO_TEXTS_SHEET_NAME}" no fue encontrada.`);
  }
  
  const targetFileId = getDriveIdFromUrl(fileUrl);
  if (!targetFileId) {
    throw new Error("La URL del archivo a eliminar no parece ser una URL de Google Drive válida.");
  }
  
  const data = sheet.getDataRange().getValues();
  let rowsDeleted = 0;

  for (let i = data.length - 1; i >= 1; i--) {
    const sheetVideoId = (data[i][0] || '').toString().trim();
    const sheetFileUrl = (data[i][2] || '').toString().trim();
    const sheetFileId = getDriveIdFromUrl(sheetFileUrl);

    if (sheetVideoId === videoId.trim() && sheetFileId && sheetFileId === targetFileId) {
      sheet.deleteRow(i + 1);
      rowsDeleted++;
    }
  }
  return rowsDeleted;
}