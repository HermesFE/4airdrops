import type { ReactNode } from "react";

/**
 * Passthrough root so `[locale]/layout` and `(root)/layout` can each own
 * `<html>` / `<body>` with the correct `lang` and `dir` at build time.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
