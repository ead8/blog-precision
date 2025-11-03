import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { invokeAnthropic } from '@/utils/llm';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      analysisId, 
      writingRequestId, 
      topic, 
      wordCount = '1000-1200 words', 
      locale = 'en-US' 
    } = body;

    if (!topic?.title) {
      return NextResponse.json({ error: 'topic.title is required' }, { status: 400 });
    }

    const prompt = `Write an SEO-friendly blog article titled "${topic.title}". Target length: ${wordCount}. Locale: ${locale}. Use clear headings and actionable content.`;
    const articleContent = await invokeAnthropic(prompt);

    const { data, error } = await supabaseAdmin
      .from('generated_articles')
      .insert({
        writing_request_id: writingRequestId || null,
        analysis_id: analysisId || null,
        topic_title: topic.title,
        article_content: articleContent,
        meta_description: null,
        target_keywords: topic.target_keywords || [],
        requested_word_count: parseInt(String(wordCount).match(/\d+/)?.[0] || '1000', 10),
        status: 'generated'
      })
      .select('*')
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({ article: data });
  } catch (e) {
    return NextResponse.json(
      { error: 'Article generation failed', details: e.message },
      { status: 500 }
    );
  }
}

