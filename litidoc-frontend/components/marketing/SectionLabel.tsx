interface SectionLabelProps {
  children: string;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">
      {children}
    </p>
  );
}
