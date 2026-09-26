import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in server environment.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { action, prompt, imageBase64, mimeType, plotDetails } = body;

    // 1. Vasthu Shastra Consultation & Analysis
    if (action === 'vasthu_consultation') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the chief Vasthu Shastra & Architectural consultant at VASTHUSILPY, Keralassery (Palakkad, Kerala).
Analyze the following architectural request or floor plan requirements according to traditional Kerala Vasthu principles (Manushyalaya Chandrika, Thachu Shastra, Padavinyasam):

Client Plot & Building Details:
${JSON.stringify(plotDetails || prompt, null, 2)}

Please provide a structured, professional Vasthu assessment containing:
1. **Plot Orientation & Main Entrance (Dwara Sthanam)**: Recommended auspicious zones (e.g. East, North-East).
2. **Room Allocation Matrix**:
   - Master Bedroom (Nirrithi / South-West zone)
   - Kitchen & Cooking Zone (Agni / South-East corner with East-facing stove)
   - Pooja / Meditation Room (Ishanya / North-East zone)
   - Living & Dining (North / East)
   - Staircase & Heavy Storage (South or West)
   - Water Source / Well / Sump (Ishanya North-East quadrant)
   - Septic Tank / Waste Drainage (Vayu / North-West zone)
3. **Brahmasthanam**: Core energy center preservation guidelines.
4. **Vasthu Remedies & Practical Architectural Adjustments** for maximum positive energy, daylight, and natural cross ventilation in Kerala climate.
5. **Vasthu Harmony Score (out of 100%)** with key highlights.`,
      });

      return NextResponse.json({ result: response.text });
    }

    // 2. Blueprint / Architectural Elevation Image Analysis
    if (action === 'analyze_blueprint' && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this architectural drawing/blueprint or 3D elevation for VASTHUSILPY Keralassery.
Evaluate:
1. **Design Typology & Style**: Modern, Contemporary, Traditional Kerala Nalukettu, or Minimalist.
2. **Spatial Layout & Flow**: Circulation efficiency, room sizing, cross-ventilation, and natural light ingress.
3. **Vasthu Compliance Review**: Key directional zones, kitchen, entrance, and core alignment.
4. **Structural & Aesthetic Suggestions**: Materials (stone cladding, teak louvers, glass railings, tile roofing), color palettes, and landscape integration.
5. **Permit / KMBR Readiness Assessment**: Quick checklist for municipal/panchayat approvals.`
          }
        ]
      });

      return NextResponse.json({ result: response.text });
    }

    // 3. General Architectural Query
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt || 'Provide modern architectural tips for Kerala villa construction.',
    });

    return NextResponse.json({ result: response.text });

  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
