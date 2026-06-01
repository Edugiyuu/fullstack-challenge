import { Sparkles } from "lucide-react";

type NoticeBarProps = {
  children: string;
  tone?: "default" | "error";
};

export function NoticeBar({ children, tone = "default" }: NoticeBarProps) {
  const toneClass =
    tone === "error"
      ? "border border-red-500/70 bg-red-950/70 text-red-100 shadow-[0_0_28px_rgba(239,68,68,0.18)]"
      : "bg-neutral-900 text-neutral-400";
  const iconClass = tone === "error" ? "text-red-300" : "text-neutral-500";

  return (
    <div className={`mt-4 flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold ${toneClass}`}>
      <Sparkles className={iconClass} size={16} />
      {children}
    </div>
  );
}
