'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Database } from '@/supabase/functions/_lib/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Message, useChat } from 'ai/react';

export default function ChatPage() {
  const supabase = createClientComponentClient<Database>();

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authHeader = accessToken
      ? `Bearer ${accessToken}`
      : anonKey
        ? `Bearer ${anonKey}`
        : undefined;

    handleSubmit(e, {
      headers: authHeader ? { authorization: authHeader } : {},
    });
  }

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col grow overflow-hidden px-4 py-6 gap-4">
        <div className="flex flex-col grow gap-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex grow items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-zinc-400">
                    <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
                    <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm">Ask a question about your uploaded documents</p>
              </div>
            </div>
          )}

          {messages.map(({ id, role, content }: Message) => (
            <div
              key={id}
              className={cn(
                'flex',
                role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed',
                  role === 'user'
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-100'
                )}
              >
                {content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                <div className="dot-pulse" />
              </div>
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-zinc-800 pt-4"
          onSubmit={onSubmit}
        >
          <Input
            type="text"
            autoFocus
            placeholder="Ask about your documents…"
            value={input}
            onChange={handleInputChange}
            className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-zinc-600"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium shrink-0"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
