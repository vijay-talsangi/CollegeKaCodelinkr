import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session || session.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { professorMarks, remarks, status } = body;

    const { data: submission } = await supabaseServer
      .from('submissions')
      .select(`
        *,
        batches!inner(professor_id)
      `)
      .eq('id', id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const batchData = submission.batches as { professor_id: string };
    if (batchData.professor_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates: Record<string, string | number> = {};

    if (professorMarks !== undefined) {
      updates.professor_marks = professorMarks;
    }

    if (remarks !== undefined) {
      updates.remarks = remarks;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (Object.keys(updates).length > 0) {
      updates.reviewed_at = new Date().toISOString();
    }

    const { data: updatedSubmission, error } = await supabaseServer
      .from('submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error('Error in submission update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
