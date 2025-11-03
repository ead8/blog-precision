import { NextResponse } from 'next/server';
import { invokeAnthropic } from '@/utils/llm';

export async function POST(request) {
  try {
    const { topic, currentFormData, analysis, locale } = await request.json();
    
    const title = topic?.title || 'Untitled';
    const wordCount = currentFormData?.wordCount || currentFormData?.wordCountPref || '1000-1200 words';
    const audience = currentFormData?.audience || analysis?.audience || 'Intermediate';
    
    const prompt = `Write a comprehensive, SEO-friendly blog article titled "${title}" for a ${audience} audience in ${locale || 'en-US'}. Target length: ${wordCount}. Use clear structure with headings, bullet points where useful, and include an introduction and conclusion. Avoid fluff; be practical and insightful.`;
    
    const articleContent = await invokeAnthropic(prompt);
    
    return NextResponse.json({ articleContent });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

