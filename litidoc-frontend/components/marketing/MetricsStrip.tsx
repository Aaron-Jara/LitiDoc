import { cn } from "@/lib/utils";

const stats = [
  { value: "400+", label: "Pages processed" },
  { value: "~2 minutes", label: "Typical runtime" },
  { value: "100%", label: "Source-linked citations" },
];

export default function MetricsStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-6 py-8">
      <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-y-0">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col items-center py-6 text-center md:py-0",
              index < stats.length - 1 && "md:border-r md:border-slate-200",
            )}
          >
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
