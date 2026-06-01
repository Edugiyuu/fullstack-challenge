import { Sparkles } from "lucide-react";

type NoticeBarProps = {
  children: string;
};

export function NoticeBar({ children }: NoticeBarProps) {
  return (
    <div className="notice">
      <Sparkles size={14} />
      {children}
    </div>
  );
}
