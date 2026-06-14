import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { objective } = await req.json();

  if (!objective) {
    return NextResponse.json(
      { error: 'Objective is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash-exp';

    const prompt = `You are an expert copywriter specializing in marketing campaigns.
    Based on the following campaign objective, generate 3 distinct and compelling message variants.
    Each message should be:
    - Short and engaging (under 150 characters)
    - Action-oriented with clear value proposition
    - Suitable for SMS/email campaigns
    
    Return only a JSON array of 3 strings, nothing else.

    Objective: "${objective}"`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8, // Add creativity
        maxOutputTokens: 100,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response (should be an array)
    const suggestionsArray = JSON.parse(text);

    // Validate response format
    if (!Array.isArray(suggestionsArray) || suggestionsArray.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    // Return in expected format
    return NextResponse.json({
      suggestions: suggestionsArray.slice(0, 3), // Ensure max 3 suggestions
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);

    // More specific error responses
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
