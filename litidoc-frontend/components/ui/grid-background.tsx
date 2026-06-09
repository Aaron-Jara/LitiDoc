import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GridBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function GridBackground({ children, className }: GridBackgroundProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-white", className)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
        )}
        style={{
          maskImage:
            "radial-gradient(ellipse at center, transparent 20%, white 80%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
