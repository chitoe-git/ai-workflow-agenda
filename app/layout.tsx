import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Agenda Workflow MVP",
  description: "AI-powered daily scheduler and performance journal"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="screen-stream" aria-hidden="true" />
        <div className="noise-overlay min-h-screen">{children}</div>
      </body>
    </html>
  );
}
