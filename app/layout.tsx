import LogoutButton from '@/components/LogoutButton';
import { Toaster } from '@/components/ui/toaster';
import Providers from '@/lib/providers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { PropsWithChildren } from 'react';
import 'three-dots/dist/three-dots.css';
import './globals.css';

export const metadata = {
  title: 'Supabase AI Knowledge Base',
  description: 'Chat with your documents using AI',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-zinc-950 text-zinc-100">
        <Providers>
          <div className="flex flex-col items-center h-full">
            <nav className="w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-1">
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors font-semibold text-zinc-100"
                  >
                    <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                      <g>
                        <path d="m11.906 46.43c-1.7852 1.4883-4.168 0.89453-5.0586-1.1914-1.1914-2.082-0.59375-4.7617 1.1914-5.9531l40.18-30.355c1.1914-0.89453 2.6797-0.89453 3.8672 0l40.18 30.355c1.4883 1.1914 2.082 3.8672 0.89453 5.9531-0.89453 2.082-3.2734 2.6797-5.0586 1.1914l-38.094-28.867-38.094 28.867z" />
                        <path d="m83.633 48.809v37.5c0 2.9766-2.3828 5.6562-5.6562 5.6562h-15.773v-28.57c0-2.9766-2.3828-5.0586-5.0586-5.0586h-13.988c-2.9766 0-5.0586 2.082-5.0586 5.0586v28.57h-16.07c-2.9766 0-5.6562-2.6797-5.6562-5.6562v-37.5l33.633-25.297 33.633 25.297z" fillRule="evenodd" />
                      </g>
                    </svg>
                    KB
                  </Link>
                  {user && (
                    <>
                      <Link href="/files" className="px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-sm text-zinc-300 hover:text-zinc-100">
                        Files
                      </Link>
                      <Link href="/chat" className="px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-sm text-zinc-300 hover:text-zinc-100">
                        Chat
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {user ? (
                    <>
                      <span className="hidden sm:block text-sm text-zinc-400">{user.email}</span>
                      <LogoutButton />
                    </>
                  ) : (
                    <Link href="/login" className="px-4 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors">
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </nav>
            <main className="w-full grow flex flex-col items-center">
              {children}
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
