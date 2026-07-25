import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI Gap Architecture — Skill Gap & Career Bridge Intelligence",
  description: "AI-powered resume gap analysis, missing skill identification, and actionable career roadmap platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${jakarta.variable} antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
