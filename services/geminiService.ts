import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const evaluateAnswerWithGemini = async (
  question: string,
  answer: string,
  expectedType: string
): Promise<EvaluationResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided. Returning mock evaluation.");
    return mockEvaluation(answer);
  }

  try {
    const prompt = `
      You are an expert neuropsychologist evaluating a cognitive screening test for early dementia.
      
      QUESTION: "${question}"
      EXPECTED ANSWER TYPE: ${expectedType}
      PATIENT'S ANSWER: "${answer}"

      Evaluate the patient's answer based on accuracy, coherence, and confidence.
      Return the result in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 0 to 10 based on accuracy and coherence" },
            accuracy: { type: Type.NUMBER, description: "0.0 to 1.0" },
            coherence: { type: Type.NUMBER, description: "0.0 to 1.0" },
            confidence: { type: Type.NUMBER, description: "0.0 to 1.0 inferred from text" },
            concerns: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of specific cognitive concerns observed"
            },
            analysis: { type: Type.STRING, description: "Brief clinical analysis of the response" }
          },
          required: ["score", "accuracy", "coherence", "confidence", "concerns", "analysis"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as EvaluationResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return mockEvaluation(answer);
  }
};

const mockEvaluation = (answer: string): EvaluationResult => {
  // Fallback if API fails or key is missing
  const isShort = answer.length < 5;
  return {
    score: isShort ? 3 : 8,
    accuracy: isShort ? 0.3 : 0.8,
    coherence: 0.9,
    confidence: 0.7,
    concerns: isShort ? ["Answer too brief"] : [],
    analysis: "Mock analysis: API unavailable."
  };
};
