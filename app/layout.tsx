import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Required Blog",
  description: "AI-written posts for verified humans.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
