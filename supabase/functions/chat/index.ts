import { createClient } from '@supabase/supabase-js';
import { codeBlock } from 'common-tags';
import OpenAI from 'openai';
import { Database } from '../_lib/database.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// These are automatically injected
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
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
  const isAnonAuth = authorization === `Bearer ${supabaseAnonKey}`;
  const useServiceRole = (!authorization || isAnonAuth) && Boolean(supabaseServiceRoleKey);

  if (!authorization && !useServiceRole) {
    console.warn(
      'No authorization header and no service role key. RLS may block access.'
    );
  }

  const supabase = createClient<Database>(
    supabaseUrl,
    useServiceRole ? supabaseServiceRoleKey! : supabaseAnonKey,
    {
      global: {
        headers: !useServiceRole && authorization ? { authorization } : {},
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const url = new URL(req.url);
  const { messages, debug: bodyDebug } = await req.json();
  const debug = bodyDebug === true || url.searchParams.get('debug') === '1';

  const lastUserMessage = Array.isArray(messages)
    ? messages.filter((message) => message?.role === 'user').slice(-1)[0]
    : null;
  const inputText = typeof lastUserMessage?.content === 'string'
    ? lastUserMessage.content
    : '';

  if (!inputText) {
    return new Response(
      JSON.stringify({ error: 'Missing user message.' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const embeddingArray = await generateQueryEmbedding(inputText);
  const embedding = JSON.stringify(embeddingArray);

  const { data: documents, error: matchError } = await supabase
    .rpc('match_document_sections', {
      embedding,
      match_threshold: 0.1,
    })
    .select('content')
    .limit(5);

  if (matchError) {
    console.error(matchError);

    return new Response(
      JSON.stringify({
        error: 'There was an error reading your documents, please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (debug) {
    const queryVector = embeddingArray
      ? normalizeVector(embeddingArray)
      : null;

    if (!queryVector) {
      return new Response(
        JSON.stringify({ error: 'Unable to parse embedding for debug.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const debugMatches = await getDebugMatches(supabase, queryVector, 50, 10);

    return new Response(
      JSON.stringify({
        rpc_count: documents?.length ?? 0,
        matches: debugMatches,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const injectedDocs =
    documents && documents.length > 0
      ? documents.map(({ content }) => content).join('\n\n')
      : 'No documents found';

  console.log(injectedDocs);

  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      {
        role: 'user',
        content: codeBlock`
        You're an AI assistant who answers questions about documents.

        You're a chat bot, so keep your replies succinct.

        You're only allowed to use the documents below to answer the question.

        If the question isn't related to these documents, say:
        "Sorry, I couldn't find any information on that."

        If the information isn't available in the below documents, say:
        "Sorry, I couldn't find any information on that."

        Do not go off topic.

        Documents:
        ${injectedDocs}
      `,
      },
      ...messages,
    ];

  let completionStream;
  try {
    completionStream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: completionMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    });
  } catch (err) {
    console.error('OpenAI completion error:', err);
    return new Response(
      JSON.stringify({ error: 'OpenAI request failed.', detail: String(err) }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const body = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of completionStream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          // ai@4 data stream protocol: 0:"<escaped text>"\n
          controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
        }
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Experimental-Stream-Data': 'true',
    },
  });
});

async function generateQueryEmbedding(input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });
  const full = response.data?.[0]?.embedding ?? [];
  return downsampleEmbedding(full, 384);
}

function downsampleEmbedding(values: number[], targetLength: number): number[] {
  if (values.length === targetLength) return values;
  if (values.length === 0) return new Array(targetLength).fill(0);

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
  if (!norm) return values;
  return values.map((value) => value / norm);
}

function dotProduct(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function parseEmbeddingArray(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    return raw.map(Number).filter((v) => Number.isFinite(v));
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter((v) => Number.isFinite(v));
      }
    } catch {
      // not valid JSON
    }
  }
  return null;
}

async function getDebugMatches(
  supabase: ReturnType<typeof createClient<Database>>,
  queryVector: number[],
  sampleSize: number,
  limit: number
): Promise<Array<{ id: number; score: number; preview: string }>> {
  type SectionRow = { id: number; content: string; embedding: string | null };
  const query = supabase
    .from('document_sections')
    .select('id, content, embedding')
    .limit(sampleSize) as unknown as PromiseLike<{ data: SectionRow[] | null; error: unknown }>;
  const { data: rows, error } = await query;

  if (error || !rows) {
    console.error('Debug match query failed', error);
    return [];
  }

  return rows
    .map((row) => {
      const vector = parseEmbeddingArray(row.embedding);
      if (!vector || vector.length === 0) return null;
      const score = dotProduct(queryVector, normalizeVector(vector));
      const preview = typeof row.content === 'string' ? row.content.slice(0, 160) : '';
      return { id: Number(row.id), score, preview };
    })
    .filter((result): result is { id: number; score: number; preview: string } =>
      Boolean(result)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
