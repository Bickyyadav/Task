import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// const inter = Inter({
//   variable: "--font-sans",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "ProjectHub — Project Management",
  description:
    "A modern project management tool with kanban boards, team collaboration, and real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
