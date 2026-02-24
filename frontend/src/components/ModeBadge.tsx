type ModeBadgeProps = {
  label: string;
  variant?: "primary" | "secondary";
};

export default function ModeBadge({ label, variant = "primary" }: ModeBadgeProps) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm md:px-4 md:text-sm";
  const styles = variant === "primary" ? "bg-[var(--brand)] text-white" : "bg-[var(--accent)] text-white";
  return <span className={`${base} ${styles}`}>{label}</span>;
}
