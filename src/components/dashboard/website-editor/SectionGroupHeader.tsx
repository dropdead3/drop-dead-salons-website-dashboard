interface SectionGroupHeaderProps {
  title: string;
}

export function SectionGroupHeader({ title }: SectionGroupHeaderProps) {
  return (
    <div className="px-3 py-2 mt-4 first:mt-0">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {title}
      </span>
    </div>
  );
}
