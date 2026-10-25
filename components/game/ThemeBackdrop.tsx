"use client";

import type { VisualTheme } from "@/lib/engine/themes";

/** Pełnoekranowe tło motywu na paski tabletu — bez drugiej pętli canvas. */
export function ThemeBackdrop({ theme }: { theme: VisualTheme }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: theme.ink }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${theme.sky.a}, ${theme.sky.b} 42%, ${theme.sky.c} 72%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 18% 78%, ${theme.tide.a}, transparent 48%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 84% 14%, ${theme.ember.a}, transparent 42%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 28%, rgba(0,0,0,0.45) 72%)",
        }}
      />
    </div>
  );
}
