import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, code, language, commitMessage } = body;

    if (!batchId || !code || !language) {
      return NextResponse.json(
        { error: 'Batch, code, and language are required' },
        { status: 400 }
      );
    }

    const { data: student } = await supabaseServer
      .from('students')
      .select('id')
      .eq('id', session.userId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: submission, error } = await supabaseServer
      .from('submissions')
      .insert({
        student_id: student.id,
        batch_id: batchId,
        code,
        language,
        commit_message: commitMessage || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    try {
      const evaluationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id, code, language }),
      });

      if (!evaluationResponse.ok) {
        console.error('Failed to trigger evaluation');
      }
    } catch (evalError) {
      console.error('Error triggering evaluation:', evalError);
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const batchId = searchParams.get('batchId');

    if (session.role === 'student') {
      const { data: submissions, error } = await supabaseServer
        .from('submissions')
        .select(`
          *,
          batches!inner(
            name,
            professor_id
          )
        `)
        .eq('student_id', session.userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
      }

      return NextResponse.json({ submissions: submissions || [] });
    }

    if (session.role === 'professor') {
      let query = supabaseServer
        .from('submissions')
        .select(`
          *,
          students!inner(
            prn,
            roll_number,
            users!inner(
              name,
              email
            )
          ),
          batches!inner(
            name,
            professor_id
          )
        `)
        .eq('batches.professor_id', session.userId);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      query = query.order('submitted_at', { ascending: false });

      const { data: submissions, error } = await query;

      if (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
      }

      return NextResponse.json({ submissions: submissions || [] });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
