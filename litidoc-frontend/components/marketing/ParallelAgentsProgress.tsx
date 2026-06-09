"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const LOOP_MS = 12_000;

const STATIC_VALUES = [
  { label: "Timeline Agent", value: 82 },
  { label: "Background Agent", value: 61 },
  { label: "Damage Agent", value: 91 },
  { label: "Excel Agent", value: 43 },
];

function easeOut(t: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 1.35);
}

function computeAgentValues(timestamp: number) {
  const loopT = (timestamp % LOOP_MS) / LOOP_MS;

  const timeline = Math.round(92 * easeOut(loopT / 0.96));

  const background =
    loopT < 0.05
      ? 0
      : Math.round(74 * easeOut(((loopT - 0.05) / 0.95) * 0.9));

  const damage =
    loopT < 0.08
      ? 0
      : Math.round(69 * easeOut(((loopT - 0.08) / 0.92) * 0.86));

  const excel =
    loopT < 0.2
      ? 0
      : Math.round(43 * easeOut(((loopT - 0.2) / 0.8) * 0.72));

  return [
    { label: "Timeline Agent", value: timeline },
    { label: "Background Agent", value: background },
    { label: "Damage Agent", value: damage },
    { label: "Excel Agent", value: excel },
  ];
}

export default function ParallelAgentsProgress() {
  const prefersReducedMotion = useReducedMotion();
  const [agents, setAgents] = useState(STATIC_VALUES);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAgents(STATIC_VALUES);
      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      setAgents(computeAgentValues(now));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.label}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-slate-700">▶ {agent.label}</p>
            <span className="font-mono text-xs text-slate-500">
              {agent.value}%
            </span>
          </div>
          <Progress
            value={agent.value}
            className="h-2 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-indigo-500"
          />
        </div>
      ))}
    </div>
  );
}
