# LitiDoc Design System

This file is the single source of truth for all design and architecture decisions.
Reference it in every Cursor Composer session with @design-system.md before pasting a section prompt.

---

## Product

LitiDoc is an AI-powered litigation document processor.

It takes large legal PDFs (depositions, financial records, emails) and outputs:
- A sourced chronological timeline
- A formal background section
- Classified damage categories
- An Excel damage schedule

Primary audience: litigation consultants and lawyers.
Secondary audience: SWE recruiters viewing a LinkedIn demo.

---

## Architecture

The app is split into two distinct experiences. Do not mix them.

### Landing Page (/)
- Marketing-focused
- Explains the workflow
- Drives uploads
- Reference feel: Stripe, Ramp, Linear homepage

### Results Workspace (/results/[jobId])
- Product-focused
- High information density
- No marketing copy
- Reference feel: Linear issue view, Ramp ops dashboard, Retool

**The landing page sells the workflow. The workspace delivers the work product.**

---

## Tech Stack

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn/ui (Radix primitives)
- Radix Colors
- Lucide Icons
- Magic UI (Bento Grid)
- Aceternity UI (Grid Background)

---

## Color System

| Token            | Value                       |
|------------------|-----------------------------|
| Page background  | white / slate-50            |
| Primary text     | slate-900                   |
| Secondary text   | slate-500, slate-600        |
| Primary accent   | indigo-600                  |
| Accent hover     | indigo-700                  |
| Card surface     | white                       |
| Card border      | slate-200                   |
| Card shadow      | shadow-sm                   |
| Success          | green-600                   |
| Destructive      | red-600                     |

---

## Typography

- Font: Geist Sans (already installed)
- Max content width: max-w-7xl
- Section padding: px-6

### Section Label Style

Apply this consistently to every section label (e.g. "THE PROBLEM", "THE SOLUTION"):

```
text-xs font-semibold uppercase tracking-[0.2em] text-slate-500
```

### Data & Citations

Use font-mono for:
- File names
- Page and line references
- Dollar amounts in tables
- Agent labels and system output

---

## Visual Direction

References: Stripe, Ramp, Linear, Mercury

Goals:
- Modern SaaS
- Enterprise credibility
- Legal-tech professionalism

### Never use:
- Startup neon
- Glassmorphism
- Glow effects
- AI sparkle animations
- Generic purple gradients
- Dark navbar (use white)

---

## Component Rules

When a prompt specifies a component from shadcn, Magic UI, or Aceternity:

1. Install and import the actual published component
2. Do NOT recreate it manually
3. Do NOT approximate it with custom CSS

Installation commands:
- shadcn: `npx shadcn@latest add [component]`
- Magic UI: magicui.design/docs/components
- Aceternity: ui.aceternity.com/components

---

## Deliverable Preview Rule

This is the most important design rule in this system.

Whenever any section references a deliverable output (Timeline, Background Draft, Damage Schedule, Source Verification), show a realistic software preview — not a feature card.

### Never show:
- An icon with a title and description paragraph
- A marketing card with a feature name and tagline
- Any card that could belong on any other SaaS landing page

### Always show:
- A card that looks like actual generated software output
- Realistic legal data (names, dates, citations, dollar amounts)
- Document-style or spreadsheet-style layout inside the card
- font-mono for citations and data values

Every deliverable preview should make a recruiter think:
"That's what the output actually looks like" — not "that's a feature description."