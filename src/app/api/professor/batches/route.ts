import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: batches, error } = await supabaseServer
      .from('batches')
      .select('*')
      .eq('professor_id', session.userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching professor batches:', error);
      return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }

    return NextResponse.json({ batches: batches || [] });
  } catch (error) {
    console.error('Error in professor batches API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
