const icon = "size-[28px] sm:size-[38px]";

// Solid glyphs to match the design; drawn inline because the icon set only has outlines.
const ICONS = [
  <svg key="store" viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true"><path d="M4.2 3h15.6l1.7 5.1a3.1 3.1 0 0 1-5.4 2.3 3.1 3.1 0 0 1-4.6 0 3.1 3.1 0 0 1-4.6 0A3.1 3.1 0 0 1 2.5 8.1L4.2 3Z" /><path d="M4 12.4a4.6 4.6 0 0 0 4.2-.7 4.6 4.6 0 0 0 7.6 0 4.6 4.6 0 0 0 4.2.7V20a1 1 0 0 1-1 1h-4.6v-5.2H9.6V21H5a1 1 0 0 1-1-1v-7.6Z" /></svg>,
  <svg key="tag" viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true"><path fillRule="evenodd" d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2c0 .5.2 1 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4l-8.7-8.7ZM7.5 5.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Z" /></svg>,
  <svg key="zap" viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true"><path d="M13.6 1.8 4.3 13.2a.8.8 0 0 0 .6 1.3H11l-1.1 7.7c-.1.7.8 1.1 1.3.5l9.3-11.4a.8.8 0 0 0-.6-1.3H14l1.1-7.7c.1-.7-.8-1.1-1.3-.5Z" /></svg>,
];

export function Benefits({ items }: { items: readonly { title: string; body: string }[] }) {
  return <ul className="mt-8 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6 sm:px-4 lg:px-7">
    {items.map((item, i) => <li key={item.title} className="flex items-center gap-4 sm:gap-5">
      <span aria-hidden="true" className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[#E2F2E8] text-[#07834A] sm:size-[72px]">{ICONS[i]}</span>
      <div>
        <h3 className="text-[15px] font-semibold text-[#17211B] sm:text-[19px]">{item.title}</h3>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B776F] sm:mt-1 sm:max-w-[200px] sm:text-[16px]">{item.body}</p>
      </div>
    </li>)}
  </ul>;
}
