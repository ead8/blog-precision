import { NextResponse } from 'next/server';
import { invokeAnthropic } from '@/utils/llm';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      prompt,
      system,
      response_json_schema,
      model,
      max_tokens
    } = body || {};
    
    const result = await invokeAnthropic({
      prompt,
      system,
      response_json_schema,
      model,
      max_tokens
    });
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

