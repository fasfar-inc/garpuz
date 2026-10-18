export default function AdminLoading() {
  return <main className="animate-pulse"><div className="h-28 border-b border-[#E4E9E6] bg-white" /><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 rounded-2xl border border-[#E2E7E4] bg-white" />)}</div></main>;
}
