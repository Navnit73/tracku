import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FinanceTrack - Personal Expense, Income & Investment Tracker",
  description:
    "Full-stack financial tracking & analytics web application built with Next.js, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.",
};

const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f6f5f4] dark:bg-[#191919] text-[#171717] dark:text-[#f7f7f7]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
