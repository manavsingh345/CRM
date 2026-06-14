import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { objective } = await req.json();

  if (!objective) {
    return NextResponse.json({ error: 'Objective is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash-exp';

    const prompt = `You are a marketing AI assistant. Given a business objective, produce a JSON recommendation object with the following structure:
{
  "audience": { "logic": "AND|OR", "conditions": [ { "field": "totalSpending|lastVisit|orderCount", "operator": ">|<|>=|<=|=|!=", "value": number_or_string } ] },
  "channel": "email|sms|whatsapp|rcs",
  "message": "Short campaign message suitable for SMS or email (max 150 chars)",
  "expectedMetrics": { "deliveryRate": 0-1, "openRate": 0-1, "ctr": 0-1, "conversionRate": 0-1 },
  "reasoning": "Short explanation of why this audience and message should work"
}

Return only valid JSON matching the schema above and nothing else. Use only the allowed audience fields: totalSpending, lastVisit, orderCount.

Business objective: "${objective}"`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.0,
        maxOutputTokens: 400,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');

    const parsed = JSON.parse(text);

    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid recommendation format');
    }

    return NextResponse.json({ recommendation: parsed });
  } catch (err) {
    console.error('AI advisor error:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}
