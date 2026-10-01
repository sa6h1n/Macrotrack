export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss-600">{eyebrow}</p>}<h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-xl text-sm text-[#657468] dark:text-[#aebbb0]">{description}</p>}</div>{action}</header>;
}
