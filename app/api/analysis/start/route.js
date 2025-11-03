import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { discoverUrlsForSite } from '@/utils/scrape';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      clientUrl, 
      competitorUrl, 
      competitorUrl2, // ADDED: Second competitor URL (optional)
      leaderUrl, 
      keywords = [], 
      targetAudience = 'general_public', 
      targetLocation = 'global', 
      userId = 'demo-user' 
    } = body;

    if (!clientUrl || !competitorUrl || !leaderUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: clientUrl, competitorUrl, leaderUrl' },
        { status: 400 }
      );
    }

    const insertData = {
      created_by: userId,
      client_url: clientUrl,
      competitor_url: competitorUrl,
      industry_leader_url: leaderUrl,
      status: 'discovering',
      keywords,
      target_audience: targetAudience,
      target_location: targetLocation
    };
    
    // ADDED: Include competitor_url_2 if provided
    if (competitorUrl2) {
      insertData.competitor_url_2 = competitorUrl2;
    }

    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    // Kick off discovery non-blocking
    processDiscovery(analysis.id, clientUrl, competitorUrl, leaderUrl);

    return NextResponse.json({ 
      message: 'Analysis started successfully', 
      analysisId: analysis.id, 
      status: 'discovering' 
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to start analysis', details: e.message },
      { status: 500 }
    );
  }
}

async function processDiscovery(analysisId, clientUrl, competitorUrl, leaderUrl) {
  try {
    const [client, competitor, leader] = await Promise.all([
      discoverUrlsForSite(clientUrl, 200),
      discoverUrlsForSite(competitorUrl, 200),
      discoverUrlsForSite(leaderUrl, 200)
    ]);

    await supabaseAdmin
      .from('analyses')
      .update({
        status: 'analyzing',
        progress: 60,
        analysis_results: {
          discovered: {
            clientCount: client.length,
            competitorCount: competitor.length,
            leaderCount: leader.length
          },
          sample: {
            client: client.slice(0, 20),
            competitor: competitor.slice(0, 20),
            leader: leader.slice(0, 20)
          }
        }
      })
      .eq('id', analysisId);

    const recommendations = [
      { title: 'Comparison Guide', description: 'Produce a detailed comparison against competitor topics', priority_rank: 8 },
      { title: 'How-To Tutorial', description: 'Target practical how-to for core keyword cluster', priority_rank: 7 }
    ];
    
    for (const rec of recommendations) {
      await supabaseAdmin.from('recommendations').insert({
        analysis_id: analysisId,
        title: rec.title,
        description: rec.description,
        priority_rank: rec.priority_rank
      });
    }

    await supabaseAdmin
      .from('analyses')
      .update({ status: 'completed', progress: 100 })
      .eq('id', analysisId);
  } catch (e) {
    await supabaseAdmin
      .from('analyses')
      .update({ status: 'failed' })
      .eq('id', analysisId);
  }
}

