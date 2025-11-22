
import { GoogleGenAI, Type } from "@google/genai";
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

export const getAirQualityAnalysis = async (location: {state: string, city: string, station: string, date: string, time: string}) => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a detailed Air Quality Index (AQI) report for:
    Location: ${location.station || 'City Center'}, ${location.city}, ${location.state}, India
    Time: ${location.date} at ${location.time}

    Provide realistic values typical for this region and season.
    Return a JSON object with:
    - aqi (number 0-500)
    - status (Good, Satisfactory, Moderate, Poor, Very Poor, Severe)
    - primary_pollutant (string)
    - pollutants: object with pm25, pm10, no2, so2, co, o3 (values in µg/m3)
    - health_advice (string)
    - weather: object with temp (celsius), humidity (%), wind_speed (km/h)
    - coordinates: object with lat, lng (approximate for the city/station)
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
               aqi: { type: Type.INTEGER },
               status: { type: Type.STRING },
               primary_pollutant: { type: Type.STRING },
               pollutants: {
                 type: Type.OBJECT,
                 properties: {
                    pm25: { type: Type.NUMBER },
                    pm10: { type: Type.NUMBER },
                    no2: { type: Type.NUMBER },
                    so2: { type: Type.NUMBER },
                    co: { type: Type.NUMBER },
                    o3: { type: Type.NUMBER }
                 }
               },
               health_advice: { type: Type.STRING },
               weather: {
                 type: Type.OBJECT,
                 properties: {
                    temp: { type: Type.NUMBER },
                    humidity: { type: Type.INTEGER },
                    wind_speed: { type: Type.NUMBER }
                 }
               },
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
      
      return JSON.parse(response.text || "{}");
  } catch (error) {
      console.error("Error fetching AQI:", error);
      return null;
  }
};

export const getWaterQualityAnalysis = async (location: {state: string, city: string, source: string, date: string}) => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a Surface Water Quality report for:
    Location: ${location.city}, ${location.state}, India
    Source Type: ${location.source}
    Date: ${location.date}

    Provide realistic values.
    Return JSON:
    - wqi (Water Quality Index 0-100)
    - status (Excellent, Good, Poor, Very Poor, Unfit for consumption)
    - parameters: ph (6-9), turbidity (NTU), tds (mg/L), do (Dissolved Oxygen mg/L), bod (mg/L), ecoli (CFU/100ml)
    - health_advice (string)
    - coordinates: lat, lng
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
               wqi: { type: Type.INTEGER },
               status: { type: Type.STRING },
               parameters: {
                 type: Type.OBJECT,
                 properties: {
                    ph: { type: Type.NUMBER },
                    turbidity: { type: Type.NUMBER },
                    tds: { type: Type.NUMBER },
                    do: { type: Type.NUMBER },
                    bod: { type: Type.NUMBER },
                    ecoli: { type: Type.NUMBER }
                 }
               },
               health_advice: { type: Type.STRING },
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getGroundWaterAnalysis = async (location: {state: string, district: string, block: string, date: string}) => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a Ground Water Quality & Level report for:
    Location: ${location.block} Block, ${location.district}, ${location.state}, India
    Date: ${location.date}

    Provide realistic data for rural/urban India context.
    Return JSON:
    - level_status (Safe, Semi-Critical, Critical, Over-exploited)
    - depth_to_water_level (meters below ground level)
    - parameters: ph, fluoride (mg/L), arsenic (mg/L), nitrate (mg/L), iron (mg/L), salinity (mg/L)
    - health_advice (string)
    - coordinates: lat, lng
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
               level_status: { type: Type.STRING },
               depth_to_water_level: { type: Type.NUMBER },
               parameters: {
                 type: Type.OBJECT,
                 properties: {
                    ph: { type: Type.NUMBER },
                    fluoride: { type: Type.NUMBER },
                    arsenic: { type: Type.NUMBER },
                    nitrate: { type: Type.NUMBER },
                    iron: { type: Type.NUMBER },
                    salinity: { type: Type.NUMBER }
                 }
               },
               health_advice: { type: Type.STRING },
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getAdvancedReport = async (
  reportType: string,
  location: { state: string; city: string; date: string; time?: string }
) => {
  if (!process.env.API_KEY) return null;

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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Advanced Report Error:", error);
    return null;
  }
};
