import { Sparkles } from "lucide-react";

type NoticeBarProps = {
  children: string;
};

export function NoticeBar({ children }: NoticeBarProps) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-3 text-xs text-neutral-400">
      <Sparkles className="text-neutral-500" size={14} />
      {children}
    </div>
  );
}
