export default function AnimatedGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 10%, transparent 75%)",
        }}
      />
    </div>
  );
}
