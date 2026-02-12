import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Copilot MVP",
  description: "Mass prompt generation with locked core, QC, history, and export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
