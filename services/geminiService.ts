import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

// Initialize the client only if the key is available
try {
  if (process.env.API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API Key missing. AI features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing Gemini client", error);
}

export const createTutorChat = (context: string): Chat | null => {
  if (!aiClient) return null;

  const systemPrompt = `You are an expert AI Tutor embedded in a Learning Management System. 
  Your goal is to help students understand the current lesson material.
  
  Current Lesson Context:
  ${context}
  
  Guidelines:
  - Answer the student's question concisely and encouragingly.
  - If the context is a QUIZ, do NOT provide the direct answer (A, B, C, or D). Instead, provide a hint or explain the concept to help the student figure it out.
  - If you use the Google Search tool, ensure you incorporate the findings into your response.
  - Always maintain a helpful and friendly tone.
  `;

  return aiClient.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }], // Enable Search Grounding
    },
  });
};

export const generateCourseCurriculum = async (topic: string, level: string) => {
  if (!aiClient) {
    throw new Error("AI Client not initialized");
  }

  const prompt = `Create a comprehensive course curriculum for a course about "${topic}" designed for "${level}" students.
  
  The output must be a valid JSON object matching the schema provided.
  - Create 3-5 distinct sections.
  - Each section should have 2-4 lessons.
  - Lesson types should be one of: "VIDEO", "TEXT", "QUIZ".
  - For "VIDEO" lessons, provide a relevant YouTube search URL as content (e.g., "https://www.youtube.com/results?search_query=python+intro").
  - For "TEXT" lessons, provide a brief 2-paragraph markdown summary as content.
  - For "QUIZ" lessons, provide a JSON stringified object with 'passingScore' (number) and 'questions' (array of objects with id, question, options, correctAnswerIndex).
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING },
                        content: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating course:", error);
    throw new Error("Failed to generate course content");
  }
};

export const generateLessonContent = async (lessonTitle: string, courseTitle: string) => {
  if (!aiClient) throw new Error("AI Client not initialized");

  const prompt = `Write comprehensive educational content for a lesson titled "${lessonTitle}" which is part of the course "${courseTitle}".
  
  Format the output as clean Markdown.
  - Include headers (##).
  - Include bullet points where appropriate.
  - Explain concepts clearly with examples.
  - Keep it engaging and approximately 300-500 words.
  `;

  const response = await aiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text;
};

export const generateQuizQuestions = async (topic: string, difficulty: string) => {
  if (!aiClient) throw new Error("AI Client not initialized");

  const prompt = `Generate 5 multiple-choice quiz questions about "${topic}" at a "${difficulty}" level.
  
  Return ONLY raw JSON. Structure:
  {
    "questions": [
      {
        "id": 1,
        "question": "Question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswerIndex": 0
      }
    ]
  }
  `;

  const response = await aiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateLessonAudio = async (text: string): Promise<ArrayBuffer | null> => {
  if (!aiClient) return null;

  try {
    // Truncate if too long to prevent latency issues for this demo
    const safeText = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: safeText }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode base64 string to ArrayBuffer
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Audio generation failed", error);
    return null;
  }
};

export const generateCourseImage = async (prompt: string): Promise<string | null> => {
  if (!aiClient) return null;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high quality, modern, educational course thumbnail image for a course titled: ${prompt}. Minimalist, professional, vector art style.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
};