# Supabase AI Knowledge Base

A production-ready web app for uploading documents and chatting with them using AI. Built with Next.js, Supabase, and OpenAI.

## Features

- **AI Chat:** Ask questions about your uploaded documents using retrieval-augmented generation (RAG) powered by OpenAI GPT and `pgvector` semantic search.
- **Document Upload:** Securely upload and store documents. Text is automatically chunked and embedded for search.
- **Authentication:** Email/password login with Supabase Auth and row-level security — each user only sees their own documents.
- **Edge Functions:** Embedding generation and chat completion run as Supabase Edge Functions (Deno).

## Tech Stack

- **Frontend:** Next.js 13 (App Router), Tailwind CSS
- **Backend:** Supabase (Postgres + pgvector, Auth, Storage, Edge Functions)
- **AI:** OpenAI `text-embedding-3-small` for embeddings, `gpt-3.5-turbo` for chat

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- An OpenAI API key

### Local development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Start the local Supabase stack:
   ```bash
   supabase start
   ```

3. Create `.env.local` from the example and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```

4. Create `supabase/functions/.env` with your OpenAI key and service role key:
   ```
   OPENAI_API_KEY=...
   SERVICE_ROLE_KEY=...
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. In a separate terminal, serve the edge functions:
   ```bash
   npm run functions:serve
   ```
