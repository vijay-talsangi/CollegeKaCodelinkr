import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, code, language } = body;

    if (!submissionId || !code || !language) {
      return NextResponse.json(
        { error: 'Submission ID, code, and language are required' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI evaluation not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a code evaluator. Evaluate the following ${language} code and provide:
1. A score from 0-10 based on code quality, correctness, efficiency, and best practices
2. Brief feedback (max 200 characters)

Code:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY in this exact JSON format:
{
  "score": <number between 0-10>,
  "feedback": "<brief feedback>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to evaluate code' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No text content in Gemini response');
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', textContent);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    const aiMarks = Math.max(0, Math.min(10, Math.round(evaluation.score)));

    const { error: updateError } = await supabaseServer
      .from('submissions')
      .update({
        ai_marks: aiMarks,
        remarks: evaluation.feedback || 'AI evaluation completed',
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission with AI marks:', updateError);
      return NextResponse.json(
        { error: 'Failed to save evaluation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      aiMarks,
      feedback: evaluation.feedback,
    });
  } catch (error) {
    console.error('Error in evaluate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
