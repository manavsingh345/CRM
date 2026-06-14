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

    const prompt = `You are an expert in CRM segmentation. Convert the user's natural language objective into a structured segment definition that matches this JSON schema:
{
  "logic": "AND|OR",
  "conditions": [
    { "field": "totalSpending|lastVisit|orderCount", "operator": ">|<|>=|<=|=|!=", "value": number_or_string }
  ]
}

Only use the fields: totalSpending, lastVisit, orderCount. Return only valid JSON and nothing else.

User objective: "${objective}"`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.0,
        maxOutputTokens: 300,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');

    const parsed = JSON.parse(text);

    // Basic validation
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.conditions)) {
      throw new Error('Invalid segment format from AI');
    }

    return NextResponse.json({ segment: parsed });
  } catch (err) {
    console.error('Error generating segment:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Failed to generate segment' }, { status: 500 });
  }
}
