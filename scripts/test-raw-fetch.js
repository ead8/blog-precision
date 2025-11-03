#!/usr/bin/env node

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

console.log('✓ API key found (length:', apiKey.length, ')');
console.log('\nTesting raw fetch (no SDK) with claude-haiku-4-5-20251015...');

const start = Date.now();
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251015",
    max_tokens: 64,
    messages: [
      {"role": "user", "content": "Say hello in 3 words"}
    ]
  })
})
.then(async res => {
  const ms = Date.now() - start;
  const body = await res.text();
  
  if (res.ok) {
    console.log(`✓ SUCCESS in ${ms}ms`);
    console.log('Status:', res.status);
    console.log('Response:', body);
    process.exit(0);
  } else {
    console.error(`❌ FAILED in ${ms}ms`);
    console.error('Status:', res.status);
    console.error('Response:', body);
    process.exit(1);
  }
})
.catch(err => {
  const ms = Date.now() - start;
  console.error(`❌ ERROR after ${ms}ms:`, err.message);
  process.exit(1);
});

