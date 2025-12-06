import { GoogleGenAI, Type } from "@google/genai";
import { SpeedTestResult, AnalysisResponse } from '../types';

export const analyzeNetwork = async (result: SpeedTestResult): Promise<AnalysisResponse | null> => {
  // Vite replaces process.env.API_KEY with the actual key string during build
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key not found. Gemini analysis skipped.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      You are a specialized Network Engineer. Analyze these speed test results:
      - Ping: ${result.ping} ms
      - Download: ${result.download.toFixed(2)} Mbps
      - Upload: ${result.upload.toFixed(2)} Mbps

      Based strictly on these numbers, provide a JSON response evaluating capabilities for:
      1. Overall connection summary (professional tone).
      2. 4K Streaming capability.
      3. Competitive Gaming suitability.
      4. Video Conferencing stability.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: "A 1-2 sentence technical summary of the connection quality." 
            },
            streaming: { 
              type: Type.STRING, 
              description: "Can it handle 4K/8K HDR? Buffer risk?" 
            },
            gaming: { 
              type: Type.STRING, 
              description: "Latency analysis. Good for FPS/MOBA?" 
            },
            videoCalls: { 
              type: Type.STRING, 
              description: "Zoom/Teams quality assessment." 
            },
          },
          required: ["summary", "streaming", "gaming", "videoCalls"],
        }
      }
    });

    // Directly access .text (do not use .text())
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AnalysisResponse;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};