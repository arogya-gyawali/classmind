type ModeBadgeProps = {
  label: string;
  variant?: "primary" | "secondary";
};

export default function ModeBadge({ label, variant = "primary" }: ModeBadgeProps) {
  const base = "px-4 py-1.5 text-sm rounded-full inline-flex items-center gap-2 font-semibold shadow-sm";
  const styles = variant === "primary" ? "bg-blue-600 text-white" : "bg-slate-700 text-white/90";
  return <span className={`${base} ${styles}`}>{label}</span>;
}
