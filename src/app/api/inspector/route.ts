import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    const prompt = `
      You are an expert code inspector. You will be given a piece of code and its programming language.
      Your task is to analyze the code and provide a detailed report in the following JSON format:
      {
        "purpose": "A brief summary of what the code is for.",
        "quality": "An analysis of the code quality, including whether it is working, uses proper standardization, and avoids wrong practices.",
        "suggestions": "Suggestions for improvement, if any.",
        "parameters": [
          {"name": "Correctness", "score": <score_out_of_10>},
          {"name": "Efficiency", "score": <score_out_of_10>},
          {"name": "Readability", "score": <score_out_of_10>},
          {"name": "Best Practices", "score": <score_out_of_10>},
          {"name": "Error Handling", "score": <score_out_of_10>},
          {"name": "Code Style", "score": <score_out_of_10>},
          {"name": "Security", "score": <score_out_of_10>},
          {"name": "Scalability", "score": <score_out_of_10>},
          {"name": "Documentation", "score": <score_out_of_10>},
          {"name": "Modularity", "score": <score_out_of_10>}
        ]
      }

      Here is the language: ${language}

      Here is the code:
      \`\`\`${language}
      ${code}
      \`\`\`

      Return the result as raw JSON only, with no code block formatting, no explanation, and no extra text.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const response = await axios.post(
      apiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    let geminiResponse = response.data.candidates[0].content.parts[0].text;
    geminiResponse = geminiResponse.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(geminiResponse);
    return NextResponse.json(jsonResponse);
  } catch (error: unknown) {
    console.error('API execution error:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: `Gemini API Error: ${error.response.status}`, details: error.response.data },
        { status: error.response.status }
      );
    }
    return NextResponse.json(
      { error: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}