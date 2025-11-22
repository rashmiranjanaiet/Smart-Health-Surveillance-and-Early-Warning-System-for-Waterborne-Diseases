
import { GoogleGenAI, Type } from "@google/genai";
import { StateData } from "../types";

export const generateHealthReport = async (stateData: StateData): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. System is running in simulation mode. (Mock Health Summary: Cases are stable, but monitoring is advised in rural sectors.)";
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
    return "Unable to reach AI service (Free Tier limit may be reached). Please try again in a moment.";
  }
};

export const suggestPreventiveMeasures = async (diseaseName: string): Promise<string[]> => {
    const defaults = ["Wash hands regularly", "Drink boiled water", "Avoid street food"];
    if (!process.env.API_KEY) return defaults;

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
        return defaults;
    } catch (e) {
        console.error(e);
        return defaults;
    }
}

export const getAirQualityAnalysis = async (location: {state: string, city: string, station: string, date: string, time: string}) => {
  if (!process.env.API_KEY) return null;
  // Legacy function kept for compatibility, but logic similar to advanced report recommended
  return null; 
};

export const getWaterQualityAnalysis = async (location: {state: string, city: string, source: string, date: string}) => {
  // Legacy function kept for compatibility
  return null;
};

export const getGroundWaterAnalysis = async (location: {state: string, district: string, block: string, date: string}) => {
  // Legacy function kept for compatibility
  return null;
};

// --- MOCK GENERATOR FOR FREE TIER FALLBACK ---
const getMockAdvancedReport = (reportType: string, location: {city: string}) => {
  const isWater = reportType.toLowerCase().includes('water');
  const isDisease = reportType.toLowerCase().includes('disease') || reportType.toLowerCase().includes('hospital');
  const isMosquito = reportType.toLowerCase().includes('mosquito');
  
  return {
    title: `${reportType} - Simulated Analysis`,
    overall_status: isWater ? "Moderate Risk" : isDisease ? "Elevated" : "Safe",
    score: Math.floor(Math.random() * 40) + 60,
    summary: `This is a simulated report for ${location.city} because the AI service is currently unreachable (likely Free Tier rate limit). Data suggests ${isWater ? 'elevated turbidity levels following recent rainfall' : isDisease ? 'a slight uptick in seasonal viral cases' : 'nominal environmental parameters'}. Local authorities are advised to monitor the situation.`,
    key_metrics: [
      { name: isWater ? "pH Level" : isDisease ? "Daily OPD" : "Larval Density", value: isWater ? "7.4" : isDisease ? "145" : "12", unit: isWater ? "" : isDisease ? "patients" : "per dip", status: "Neutral" },
      { name: isWater ? "Turbidity" : isDisease ? "Viral Fever" : "Fogging Coverage", value: isWater ? "12" : isDisease ? "45" : "85", unit: isWater ? "NTU" : isDisease ? "cases" : "%", status: isWater ? "Bad" : "Neutral" },
      { name: isWater ? "Dissolved Oxygen" : isDisease ? "Bed Occupancy" : "Stagnant Water", value: isWater ? "6.2" : isDisease ? "68" : "Low", unit: isWater ? "mg/L" : isDisease ? "%" : "risk", status: "Good" },
      { name: isWater ? "E. Coli" : isDisease ? "Critical Cases" : "Vector Index", value: isWater ? "4" : isDisease ? "2" : "0.4", unit: isWater ? "CFU" : isDisease ? "cases" : "", status: "Good" }
    ],
    alerts: ["Simulated Alert: Data based on historical averages due to connection issue."],
    recommendations: ["Check internet connection or API quota.", "Verify field data manually before taking action.", "Proceed with standard operating procedures."],
    coordinates: {
      lat: 26.1445, // Default fallback (Guwahati approx)
      lng: 91.7362
    },
    is_simulated: true
  };
};

export const getAdvancedReport = async (
  reportType: string,
  location: { state: string; city: string; date: string; time?: string }
) => {
  // 1. Check Key Existence
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning mock.");
    return getMockAdvancedReport(reportType, location);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a simulated, realistic public health/environmental report.
    
    Report Type: ${reportType}
    Location: ${location.city}, ${location.state}, North East India
    Date: ${location.date} ${location.time ? 'at ' + location.time : ''}

    Context: This is for a dashboard tracking health and environment in NE India.
    
    Return a JSON object with the following structure:
    - title: string (e.g., "High Turbidity Alert")
    - overall_status: string (e.g., "Critical", "Safe", "Moderate")
    - score: number (0-100 scale representation of the metric, if applicable)
    - summary: string (2 sentences explaining the situation)
    - key_metrics: array of objects { name: string, value: string/number, unit: string, status: "Good" | "Bad" | "Neutral" }
      (Provide 4-5 relevant metrics for the ${reportType}. E.g. for Mosquito: Larval Density, Fogging Status. For Hospital: OPD Footfall, Major Complaints.)
    - alerts: array of strings (1-2 critical warnings if any)
    - recommendations: array of strings (2-3 actionable steps)
    - coordinates: object { lat: number, lng: number } (Approximate coordinates for the city)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overall_status: { type: Type.STRING },
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            key_metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  status: { type: Type.STRING }
                }
              }
            },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return { ...result, is_simulated: false };

  } catch (error: any) {
    console.error("Advanced Report Error (likely API limit):", error);
    // 2. Fallback on Error (Rate Limit, Quota, Network)
    return getMockAdvancedReport(reportType, location);
  }
};
