import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: batches, error } = await supabaseServer
      .from('batches')
      .select(`
        id,
        name,
        description,
        professor_id,
        created_at,
        professors!inner(
          users!inner(
            name
          )
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching batches:', error);
      return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }

    const formattedBatches = batches?.map(batch => {
      const professorData = batch.professors as unknown as { users: { name: string } } | null;
      return {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        professor_id: batch.professor_id,
        professor_name: professorData?.users?.name || 'Unknown',
        created_at: batch.created_at,
      };
    }) || [];

    return NextResponse.json({ batches: formattedBatches });
  } catch (error) {
    console.error('Error in batches API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
