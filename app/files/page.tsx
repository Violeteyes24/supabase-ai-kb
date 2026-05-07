'use client';

import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/supabase/functions/_lib/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function FilesPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const { data: documents } = useQuery(['files'], async () => {
    const { data, error } = await supabase
      .from('documents_with_storage_path')
      .select();

    if (error) {
      toast({ variant: 'destructive', description: 'Failed to fetch documents' });
      throw error;
    }

    return data;
  });

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-10 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-zinc-100">Your Files</h2>
        <p className="text-sm text-zinc-400">Upload a document to make it searchable in chat.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-700 rounded-xl p-10 hover:border-zinc-500 transition-colors">
        <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-zinc-500">
          <path d="m82 31.199c0.10156-0.60156-0.10156-1.1992-0.60156-1.6992l-24-24c-0.39844-0.39844-1-0.5-1.5977-0.5h-0.19922-31c-3.6016 0-6.6016 3-6.6016 6.6992v76.5c0 3.6992 3 6.6992 6.6016 6.6992h50.801c3.6992 0 6.6016-3 6.6016-6.6992l-0.003906-56.699v-0.30078zm-48-7.1992h10c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2h-10c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2zm32 52h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm-8-15v-17.199l17.199 17.199z" />
        </svg>
        <p className="text-sm text-zinc-400">Click to upload a file</p>
        <Input
          type="file"
          name="file"
          className="cursor-pointer w-full max-w-xs bg-zinc-900 border-zinc-700 text-zinc-300 file:text-zinc-400 file:bg-transparent file:border-0 file:text-sm"
          onChange={async (e) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;

            const { error } = await supabase.storage
              .from('files')
              .upload(`${crypto.randomUUID()}/${selectedFile.name}`, selectedFile);

            if (error) {
              toast({ variant: 'destructive', description: 'There was an error uploading the file. Please try again.' });
              return;
            }

            router.push('/chat');
          }}
        />
      </div>

      {documents && documents.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Uploaded</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-2 items-center border border-zinc-800 rounded-xl p-4 text-center overflow-hidden cursor-pointer hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                onClick={async () => {
                  if (!document.storage_object_path) {
                    toast({ variant: 'destructive', description: 'Failed to download file, please try again.' });
                    return;
                  }

                  const { data, error } = await supabase.storage
                    .from('files')
                    .createSignedUrl(document.storage_object_path, 60);

                  if (error) {
                    toast({ variant: 'destructive', description: 'Failed to download file. Please try again.' });
                    return;
                  }

                  window.location.href = data.signedUrl;
                }}
              >
                <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-zinc-400">
                  <path d="m82 31.199c0.10156-0.60156-0.10156-1.1992-0.60156-1.6992l-24-24c-0.39844-0.39844-1-0.5-1.5977-0.5h-0.19922-31c-3.6016 0-6.6016 3-6.6016 6.6992v76.5c0 3.6992 3 6.6992 6.6016 6.6992h50.801c3.6992 0 6.6016-3 6.6016-6.6992l-0.003906-56.699v-0.30078zm-48-7.1992h10c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2h-10c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2zm32 52h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm-8-15v-17.199l17.199 17.199z" />
                </svg>
                <span className="text-xs text-zinc-300 truncate w-full">{document.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
