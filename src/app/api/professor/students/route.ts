import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const { data: batch } = await supabaseServer
      .from('batches')
      .select('professor_id')
      .eq('id', batchId)
      .single();

    if (!batch || batch.professor_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: submissions, error } = await supabaseServer
      .from('submissions')
      .select(`
        student_id,
        students!inner(
          id,
          prn,
          roll_number,
          users!inner(
            name,
            email
          )
        )
      `)
      .eq('batch_id', batchId);

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    const uniqueStudents = Array.from(
      new Map(
        submissions?.map(sub => {
          const studentData = sub.students as unknown as {
            id: string;
            prn: string;
            roll_number: string;
            users: { name: string; email: string };
          };
          return [
            sub.student_id,
            {
              id: sub.student_id,
              prn: studentData.prn,
              roll_number: studentData.roll_number,
              name: studentData.users.name,
              email: studentData.users.email,
            },
          ];
        }) || []
      ).values()
    );

    return NextResponse.json({ students: uniqueStudents });
  } catch (error) {
    console.error('Error in professor students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
