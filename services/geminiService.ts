
import { GoogleGenAI } from "@google/genai";
import { StateData } from "../types";

export const generateHealthReport = async (stateData: StateData): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found. Returning mock response.");
    return "API Key is missing. Please configure the environment variable to generate real insights.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze the following disease data for the state of ${stateData.name}:
      Total Affected: ${stateData.totalAffected}
      Disease Breakdown: ${stateData.diseases.map(d => `${d.name}: ${d.affected} (${d.trend})`).join(', ')}

      Please provide a short, professional health executive summary (approx 100 words).
      Include:
      1. Key concern (which disease is spiking).
      2. One actionable recommendation for public health officials.
      3. Tone should be serious and informative.
      Return plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 'INTERNAL' || error?.code === 500) {
        return "Service is temporarily unavailable. Please try again in a moment.";
    }
    return "Unable to generate report at this time due to technical difficulties.";
  }
};

export const suggestPreventiveMeasures = async (diseaseName: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
        return ["Wash hands regularly", "Drink boiled water", "Avoid street food"];
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give me 3 distinct, short bullet points for preventing ${diseaseName} in a rural Indian context. Return ONLY the 3 points as a JSON array of strings.`,
             config: {
                responseMimeType: "application/json",
             }
        });
        
        const text = response.text;
        if(text) {
            return JSON.parse(text);
        }
        return ["Consult a doctor immediately"];
    } catch (e) {
        console.error(e);
        return ["Maintain hygiene", "Sanitize water", "Vaccinate if available"];
    }
}
