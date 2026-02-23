type ModeBadgeProps = {
  label: string;
  variant?: "primary" | "secondary";
};

export default function ModeBadge({ label, variant = "primary" }: ModeBadgeProps) {
  const base = "px-3 py-1 text-sm rounded-full inline-flex items-center gap-2";
  const styles = variant === "primary" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700";
  return <span className={`${base} ${styles}`}>{label}</span>;
}
