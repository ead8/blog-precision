export async function invokeAnthropic({
  prompt,
  system = 'You are an expert content strategist and SEO analyst.',
  response_json_schema,
  model,
  max_tokens
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const selectedModel = model || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251015';
  const maxTokens = typeof max_tokens === 'number' ? max_tokens : 4000;
  
  if (selectedModel.includes('gpt-') || selectedModel.includes('openai')) {
    throw new Error(`Invalid model "${selectedModel}". Anthropic API only supports Claude models`);
  }

  try {
    const requestBody = {
      model: selectedModel,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    };

    if (system) {
      requestBody.system = system;
    }

    // NOTE: Do not send response_format to avoid model validation errors across versions.

    console.log(`[LLM] Calling Anthropic API with model: ${selectedModel}, max_tokens: ${maxTokens}`);
    
    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch {
        errorData = { error: { message: errorBody } };
      }
      // If the error is about response_format, retry once without it
      const msg = (errorData?.error?.message || '').toLowerCase();
      const hasResponseFormat = Object.prototype.hasOwnProperty.call(requestBody, 'response_format');
      if (hasResponseFormat && (msg.includes('response_format') || msg.includes('extra inputs'))) {
        const retryBody = { ...requestBody };
        delete retryBody.response_format;
        console.warn('[LLM] Retrying without response_format due to validation error.');
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify(retryBody)
        });
        if (!response.ok) {
          const retryText = await response.text();
          let retryData; try { retryData = JSON.parse(retryText); } catch { retryData = { error: { message: retryText } }; }
          const err = new Error(retryData.error?.message || 'Request failed');
          err.status = response.status;
          err.error = retryData.error;
          throw err;
        }
      } else {
      const error = new Error(errorData.error?.message || 'Request failed');
      error.status = response.status;
      error.error = errorData.error;
      throw error;
      }
    }

    const data = await response.json();
    const contentPart = data?.content?.[0];
    const text = contentPart?.text || '';

    let parsed = null;
    if (text && text.trim().startsWith('{')) {
      try { 
        parsed = JSON.parse(text); 
      } catch (parseError) {
        console.warn('[LLM] Failed to parse JSON response:', parseError.message);
      }
    }

    return parsed ? { json: parsed, text } : { text };
  } catch (error) {
    console.error('[LLM] Anthropic API error:', error.message);
    console.error('[LLM] Error details:', error);
    
    const statusCode = error.status;
    let errorMessage = 'Unknown error';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      const messageStr = error.message;
      const jsonMatch = messageStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          errorMessage = parsed.error?.message || messageStr;
        } catch {
          errorMessage = messageStr.replace(/^\d+\s*/, '');
        }
      } else {
        errorMessage = messageStr.replace(/^\d+\s*/, '');
      }
    }
    
    if (statusCode === 403) {
      throw new Error(`Anthropic API access forbidden: ${errorMessage}. Please check your API key and ensure it has the necessary permissions.`);
    }
    
    if (statusCode === 401) {
      throw new Error(`Anthropic API authentication failed: ${errorMessage}. Please verify your API key is correct.`);
    }
    
    if (error.message?.includes('Connection')) {
      throw new Error(`Anthropic API connection failed. Check your network/proxy settings. Original: ${error.message}`);
    }
    
    throw new Error(`Anthropic API error: ${errorMessage}`);
  }
}


