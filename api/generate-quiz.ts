// Vercel detecta automáticamente este archivo como una función serverless.
// Se ejecutará en un entorno Node.js en el servidor.

// En Vercel, puedes usar `import type` para obtener tipos sin afectar el bundle.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Solo permitir peticiones POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Vercel parsea automáticamente el body si el Content-Type es application/json
    const { prompt } = request.body;

    if (!prompt) {
      return response.status(400).json({ message: 'El "prompt" es requerido en el cuerpo de la petición.' });
    }

    // La API Key se obtiene de las variables de entorno configuradas en Vercel.
    // ¡NUNCA llega al navegador!
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        throw new Error("La API Key de Gemini no está configurada en el servidor.");
    }

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY;

    // Replicamos la configuración que usaba la librería @google/genai, pero para la API REST
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                answer: { type: "INTEGER" }
              },
              required: ["question", "options", "answer"]
            }
          }
        }
    };

    const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error('Error desde la API de Gemini:', errorData);
        const errorMessage = errorData?.error?.message || 'La respuesta de la API de Gemini no fue exitosa.';
        throw new Error(errorMessage);
    }

    const data = await geminiResponse.json();
    
    // Extraemos el texto de la respuesta de la API REST
    const text = data.candidates[0].content.parts[0].text;

    // Enviar la respuesta de vuelta al frontend
    response.status(200).json({ text });

  } catch (error) {
    console.error('Error en la función serverless (api/generate-quiz):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    response.status(500).json({ message: errorMessage });
  }
}
