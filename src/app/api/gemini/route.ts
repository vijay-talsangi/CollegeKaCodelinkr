import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, query } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const prompt = `
      You are an expert programmer and a helpful assistant.
      You will be given a piece of code and a query about it.
      Your task is to provide a summary of what you will do and then provide the new code.
      The code will likely be a data structure or algorithm question.
      ALWAYS provide the response in the following format:
      **Summary:**
      A brief summary of the changes you are proposing.

      **New Code:**
      \`\`\`<language>
      // The new code here
      \`\`\`

      Here is the code:
      \`\`\`
      ${code}
      \`\`\`

      Here is the query:
      ${query}
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

    const geminiResponse = response.data.candidates[0].content.parts[0].text;

    const summaryMatch = geminiResponse.match(/\*\*Summary:\*\*\n([\s\S]*?)\n\*\*New Code:\*\*/);
    const codeMatch = geminiResponse.match(/\*\*New Code:\*\*\n```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);


    const summary = summaryMatch ? summaryMatch[1].trim() : 'Could not extract summary.';
    const newCode = codeMatch ? codeMatch[1].trim() : 'Could not extract code.';


    return NextResponse.json({ summary, newCode });
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