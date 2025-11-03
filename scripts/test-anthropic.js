#!/usr/bin/env node
// Test script to verify Anthropic API connectivity from Node.js

import dns from 'node:dns';
import Anthropic from '@anthropic-ai/sdk';
import process from 'node:process';

// Set DNS preference early
try {
  dns.setDefaultResultOrder('ipv4first');
  console.log('✓ DNS configured to prefer IPv4');
} catch (e) {
  console.warn('⚠ Could not set DNS preference:', e.message);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY not set in environment');
  process.exit(1);
}

console.log(`✓ API key found (length: ${apiKey.length})`);

// Test DNS resolution
console.log('\nTesting DNS resolution...');
dns.lookup('api.anthropic.com', { all: true }, (err, addresses) => {
  if (err) {
    console.error('❌ DNS lookup failed:', err.message);
    return;
  }
  console.log('✓ DNS resolved to:', addresses.map(a => `${a.address} (${a.family === 4 ? 'IPv4' : 'IPv6'})`).join(', '));
});

// Test API call
// CLI args: node scripts/test-anthropic.js [model] [--schema] [--scan]
const args = process.argv.slice(2);
const modelArg = args.find(a => !a.startsWith('-')) || 'claude-3-haiku-20240307';
const useSchema = args.includes('--schema');
const doScan = args.includes('--scan');

const client = new Anthropic({ apiKey });

async function callOnce(model, withSchema) {
  const start = Date.now();
  const req = {
    model,
    max_tokens: 64,
    messages: [{ role: 'user', content: withSchema ? 'Return a JSON object meeting the provided schema.' : 'Say hello in 3 words.' }]
  };
  if (withSchema) {
    req.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'hello_obj',
        schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
        strict: true
      }
    };
  }
  try {
    const res = await client.messages.create(req);
    const ms = Date.now() - start;
    const content = res.content?.[0];
    return { ok: true, ms, preview: content?.text || '', status: 200 };
  } catch (e) {
    const ms = Date.now() - start;
    return { ok: false, ms, status: e.status || null, error: e.error || e.message || String(e) };
  }
}

async function scanModels() {
  const candidates = [
    'claude-haiku-4-5-20251015',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307'
  ];
  console.log('\nScanning model access...');
  for (const m of candidates) {
    const r = await callOnce(m, false);
    const status = r.ok ? 'OK' : `DENIED (${r.status || 'n/a'})`;
    console.log(`${m.padEnd(28)} -> ${status} in ${r.ms}ms`);
  }
  console.log('\nScanning structured output support (json_schema)...');
  for (const m of candidates) {
    const r = await callOnce(m, true);
    const status = r.ok ? 'OK' : `DENIED (${r.status || 'n/a'})`;
    console.log(`${m.padEnd(28)} -> ${status} in ${r.ms}ms`);
  }
}

(async () => {
  if (doScan) {
    await scanModels();
    process.exit(0);
  }

  console.log('\nTesting Anthropic API call...');
  console.log(`Model: ${modelArg}`);
  console.log(`Structured output: ${useSchema ? 'ON' : 'OFF'}`);
  const res = await callOnce(modelArg, useSchema);
  if (res.ok) {
    console.log(`✓ API call succeeded in ${res.ms}ms`);
    if (res.preview) console.log('Text:', res.preview);
    process.exit(0);
  } else {
    console.error(`❌ API call failed after ${res.ms}ms`);
    console.error('Status:', res.status);
    console.error('Error:', res.error);
    process.exit(1);
  }
})();

