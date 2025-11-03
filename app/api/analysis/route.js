import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Support both userId (old) and created_by (new) for filtering
    const userId = searchParams.get('userId') || searchParams.get('created_by') || 'demo-user';
    const sortBy = searchParams.get('sortBy');
    const limit = searchParams.get('limit');
    const page = Number(searchParams.get('page') || 1);
    
    let query = supabaseAdmin.from('analyses').select('*', { count: 'exact' });
    
    // Filter by user
    query = query.eq('created_by', userId);
    
    // Handle sorting
    if (sortBy) {
      const ascending = !sortBy.startsWith('-');
      const field = sortBy.replace('-', '');
      query = query.order(field, { ascending });
    } else {
      query = query.order('created_date', { ascending: false });
    }
    
    // Handle pagination (if page is specified) or limit
    if (limit) {
      const limitNum = Number(limit);
      if (page > 1) {
        const from = (page - 1) * limitNum;
        const to = from + limitNum - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(limitNum);
      }
    }
    
    const { data, error, count } = await query;
      
    if (error) throw error;
    
    // Return format compatible with both old and new usage
    // If page is specified, return paginated format, otherwise return array directly
    if (searchParams.has('page')) {
      return NextResponse.json({ 
        analyses: data || [], 
        pagination: { 
          page, 
          limit: limit ? Number(limit) : (data?.length || 0), 
          total: count || 0, 
          pages: Math.ceil((count || 0) / (limit ? Number(limit) : 1)) 
        } 
      });
    }
    
    // Return as array for filter() method compatibility
    return NextResponse.json(data || []);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch analyses', details: e.message },
      { status: 500 }
    );
  }
}

