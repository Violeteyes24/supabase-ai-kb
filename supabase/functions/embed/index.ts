// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../_lib/database.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

Deno.serve(async (req) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const authorization = req.headers.get('Authorization');
  const useServiceRole = !authorization && Boolean(supabaseServiceRoleKey);

  if (!authorization && !useServiceRole) {
    console.warn(
      'No authorization header and no service role key. Updates may fail due to RLS.'
    );
  }

  const supabase = createClient<Database>(
    supabaseUrl,
    useServiceRole ? supabaseServiceRoleKey! : supabaseAnonKey,
    {
      global: {
        headers: authorization ? { authorization } : {},
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const { ids, table, contentColumn, embeddingColumn } = await req.json();

  const { data: rows, error: selectError } = await supabase
    .from(table)
    .select(`id, ${contentColumn}` as '*')
    .in('id', ids)
    .is(embeddingColumn, null);

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const row of rows) {
    const { id, [contentColumn]: content } = row;

    if (!content) {
      console.error(`No content available in column '${contentColumn}'`);
      continue;
    }

    const embeddingVector = await generateEmbedding(content);
    const embedding = JSON.stringify(embeddingVector);

    const { error } = await supabase
      .from(table)
      .update({
        [embeddingColumn]: embedding,
      })
      .eq('id', id);

    if (error) {
      console.error(
        `Failed to save embedding on '${table}' table with id ${id}`
      );
    }

    console.log(
      `Generated embedding ${JSON.stringify({
        table,
        id,
        contentColumn,
        embeddingColumn,
      })}`
    );
  }

  return new Response(null, {
    status: 204,
    headers: { 'Content-Type': 'application/json' },
  });
});

async function generateEmbedding(content: string): Promise<number[]> {
  const supabaseAi = (globalThis as unknown as { Supabase?: { ai?: { Session: new (model: string) => { run: (input: string, options: { mean_pool: boolean; normalize: boolean }) => Promise<number[]> } } } }).Supabase?.ai;

  if (supabaseAi) {
    const model = new supabaseAi.Session('gte-small');
    return await model.run(content, {
      mean_pool: true,
      normalize: true,
    });
  }

  if (!openai) {
    console.warn('Supabase.ai unavailable and OPENAI_API_KEY not set. Using zero embeddings.');
    return new Array(384).fill(0);
  }

  console.warn('Supabase.ai unavailable. Falling back to OpenAI embeddings (downsampled).');

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });

  const raw = response.data?.[0]?.embedding ?? [];
  return downsampleEmbedding(raw, 384);
}

function downsampleEmbedding(values: number[], targetLength: number): number[] {
  if (values.length === targetLength) {
    return values;
  }

  if (values.length === 0) {
    return new Array(targetLength).fill(0);
  }

  const stride = Math.max(1, Math.floor(values.length / targetLength));
  const output: number[] = new Array(targetLength).fill(0);

  for (let i = 0; i < targetLength; i += 1) {
    const start = i * stride;
    const end = Math.min(start + stride, values.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += values[j];
    }
    output[i] = sum / (end - start || 1);
  }

  return normalizeVector(output);
}

function normalizeVector(values: number[]): number[] {
  let sumSquares = 0;
  for (const value of values) {
    sumSquares += value * value;
  }

  const norm = Math.sqrt(sumSquares);
  if (!norm) {
    return values;
  }

  return values.map((value) => value / norm);
}
