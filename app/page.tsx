import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Index() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center grow w-full px-4">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-zinc-100">
              <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
              <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
            AI Knowledge Base
          </h1>
          <p className="text-zinc-400 text-lg">
            Upload your documents and chat with them using AI. Powered by Supabase and OpenAI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {user ? (
            <>
              <Link
                href="/files"
                className="px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-100 font-medium text-sm"
              >
                Upload Files
              </Link>
              <Link
                href="/chat"
                className="px-6 py-3 rounded-lg bg-zinc-100 hover:bg-white transition-colors text-zinc-900 font-medium text-sm"
              >
                Start Chatting
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-zinc-100 hover:bg-white transition-colors text-zinc-900 font-medium text-sm"
            >
              Get Started
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 text-sm text-zinc-500 pt-4 border-t border-zinc-800 w-full justify-center">
          <span>Semantic search with pgvector</span>
          <span className="hidden sm:block">·</span>
          <span>GPT-powered answers</span>
          <span className="hidden sm:block">·</span>
          <span>Secure per-user storage</span>
        </div>
      </div>
    </div>
  );
}
