import { Rocket } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3 text-lg font-bold text-white">
      <Rocket className="text-green-500" size={32} strokeWidth={1.8} />
      <span>Crash Game</span>
    </div>
  );
}
