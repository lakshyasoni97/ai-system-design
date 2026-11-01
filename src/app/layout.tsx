import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "@/components/ProgressProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Production AI System Design Study Portal | Lakshya Soni",
  description:
    "Interactive 100x Scale AI System Design Study Portal — Distributed Systems, Production RAG, Multi-Agent Orchestration, High-Throughput NLP, and LLMOps.",
};

const antiFlashScript = `
(function() {
  try {
    var stored = localStorage.getItem('antigravity_theme_v1');
    var isDark = stored === 'dark' || (!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider defaultTheme="system">
          <ProgressProvider>
            <Sidebar>{children}</Sidebar>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
