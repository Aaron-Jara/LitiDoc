"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarketingNavProps {
  onStartClick: () => void;
}

export default function MarketingNav({ onStartClick }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200 bg-white transition-colors",
        scrolled && "bg-white/90 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-900">LitiDoc</span>
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500 sm:flex">
            Source-linked outputs
          </span>
        </div>

        <div />

        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={onStartClick}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Start Processing
          </Button>
        </div>
      </div>
    </header>
  );
}
