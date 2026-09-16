import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Mode Sandbox",
  description: "Try different rules for the stock market draft game.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}