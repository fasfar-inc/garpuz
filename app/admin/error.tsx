"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-[70vh] place-items-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-black">Admin data could not be loaded</h1><p className="mt-2 text-sm leading-6 text-[#6B776F]">Check the Supabase connection and ensure the latest migration has been applied.</p><button onClick={reset} className="mt-5 rounded-lg bg-[#07834A] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div></main>;
}
