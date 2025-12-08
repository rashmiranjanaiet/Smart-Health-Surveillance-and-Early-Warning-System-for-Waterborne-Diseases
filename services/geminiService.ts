import { GoogleGenAI, Type } from "@google/genai";
import { StateData, WaterQualityReport } from "../types";

export const generateHealthReport = async (stateData: StateData): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. System is running in simulation mode.\n\nSummary: Current data indicates stable trends across most districts, though seasonal variations in water-borne diseases are observed. Continued monitoring in rural sectors is advised.\n\nRECOMMENDATION: Deploy mobile health units to high-risk blocks immediately and ensure sufficient stock of ORS and Zinc tablets at community health centers.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze the following disease data for the state of ${stateData.name}:
      Total Affected: ${stateData.totalAffected}
      Disease Breakdown: ${stateData.diseases.map(d => `${d.name}: ${d.affected} (${d.trend})`).join(', ')}

      Please provide a short, professional health executive summary (approx 100 words).
      Structure the response clearly as follows:
      1. A brief analysis paragraph summarizing the current situation.
      2. A distinct line starting exactly with "RECOMMENDATION:" containing one strong, specific actionable step for public health officials.

      Tone should be serious and informative. Return plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error: any) {
    console.warn("Gemini API Error:", error);
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

// --- JAL AI CHATBOT SERVICE ---
export const askJalAssistant = async (
  userQuery: string, 
  contextData: { states: StateData[], reports: WaterQualityReport[] },
  languageCode: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "I am running in offline mode. I can tell you that the safe pH range is 6.5 to 8.5. For specific data, please configure the API key.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare a summarized context to avoid token limits
    const stateSummary = contextData.states.map(s => 
      `${s.name}: ${s.totalAffected} cases (Top: ${s.diseases[0]?.name})`
    ).join('; ');
    
    const reportSummary = contextData.reports.slice(-5).map(r => 
      `Site ${r.siteName} (${r.siteType}): pH ${r.ph}, Turbidity ${r.turbidity} NTU`
    ).join('; ');

    const prompt = `
      You are "Jal AI", an intelligent and friendly assistant for the "Jal Suraksha Kavach" platform.
      
      User Query: "${userQuery}"
      Selected Language Code: ${languageCode}

      PRIORITY 1: REAL-TIME DASHBOARD CONTEXT
      - States Health Overview: ${stateSummary}
      - Recent Water Quality Reports: ${reportSummary || "No recent specific reports available."}

      INSTRUCTIONS:
      1. FIRST, check if the User Query is about the dashboard data (states, diseases, water reports). If yes, use the CONTEXT provided above to answer accurately.
      2. SECOND, if the User Query is GENERAL (e.g., "What is photosynthesis?", "How to purify water at home?", "Write a poem about rain", "Who is the PM of India?"), IGNORE the dashboard context and use your general knowledge to answer helpfully like a smart AI assistant.
      3. Do NOT say "I don't have data" for general questions. Answer them!
      4. Keep the answer spoken-friendly (concise, under 60 words if possible, unless a detailed explanation is asked).
      5. STRICTLY ANSWER IN THE LANGUAGE matching the "Selected Language Code" (e.g., if 'hi-IN', answer in Hindi). If uncertain, answer in English.
      6. Be polite, encouraging, and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Jal AI Error:", error);
    return "I am having trouble connecting to the brain right now. Please try again.";
  }
};


// --- MOCK GENERATOR FOR FREE TIER FALLBACK ---
const getMockAdvancedReport = (reportType: string, location: {city: string}) => {
  const isWater = reportType.toLowerCase().includes('water') || reportType.toLowerCase().includes('groundwater');
  const isDisease = reportType.toLowerCase().includes('disease') || reportType.toLowerCase().includes('hospital');
  
  // Random score logic
  const score = Math.floor(Math.random() * 40) + 50; // 50-90 range
  const isSafe = score > 75;

  let verdict = "Analysis Inconclusive";
  if (isWater) verdict = isSafe ? "Safe for Consumption" : "Requires Filtration";
  else if (isDisease) verdict = isSafe ? "Low Health Risk" : "Elevated Viral Risk";
  else verdict = isSafe ? "Stable Conditions" : "Caution Advised";

  return {
    title: `${reportType} - Simulated Analysis`,
    overall_status: isSafe ? "Safe" : "Caution",
    score: score,
    verdict: verdict,
    summary: `This is a simulated report for ${location.city} because the AI service is currently unreachable (likely Free Tier rate limit). Data suggests ${isWater ? (isSafe ? 'water parameters are within acceptable limits.' : 'turbidity levels are slightly high, boiling advised.') : isDisease ? 'seasonal variations in local health data.' : 'nominal environmental parameters.'}`,
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
    Generate a realistic public health/environmental report analysis.
    
    Report Type: ${reportType}
    Location: ${location.city}, ${location.state}, North East India
    Date: ${location.date} ${location.time ? 'at ' + location.time : ''}

    Context: Dashboard for tracking health and environment in NE India.
    
    Return a JSON object with the following structure:
    - title: string (e.g., "High Turbidity Alert")
    - overall_status: string (e.g., "Critical", "Safe", "Moderate")
    - score: number (0-100 percentage. Higher is better/safer. e.g. 90 = Very Safe, 30 = Hazardous)
    - verdict: string (Short 3-5 word final judgment. e.g. "Safe to Drink" or "Filter Before Use" or "High Disease Risk")
    - summary: string (2 sentences explaining the situation)
    - key_metrics: array of objects { name: string, value: string/number, unit: string, status: "Good" | "Bad" | "Neutral" }
      (Provide 4-5 relevant metrics for the ${reportType}. E.g. for Mosquito: Larval Density, Fogging Status. For Hospital: OPD Footfall, Major Complaints.)
    - alerts: array of strings (1-2 critical warnings if any)
    - recommendations: array of strings (2-3 actionable steps)
    - coordinates: object { lat: number, lng: number } (Approximate coordinates for the city)
  `;

  // Timeout Promise (25 seconds)
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout")), 25000)
  );

  try {
    const apiCall = ai.models.generateContent({
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
            verdict: { type: Type.STRING },
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

    // Race between API and Timeout
    const response: any = await Promise.race([apiCall, timeoutPromise]);

    const result = JSON.parse(response.text || "{}");
    return { ...result, is_simulated: false };

  } catch (error: any) {
    console.warn("Advanced Report: Switching to simulation due to API delay or error:", error.message || error);
    return getMockAdvancedReport(reportType, location);
  }
};