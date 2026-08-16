import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { BillingProvider } from "@/components/providers/BillingProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FinanceTrack - Personal Expense, Income & Investment Tracker",
  description:
    "Full-stack financial tracking & analytics web application built with Next.js, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.",
  icons: {
    icon: "/asset-management.png",
    shortcut: "/asset-management.png",
    apple: "/asset-management.png",
  },
};

const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
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
        <link rel="icon" href="/asset-management.png" type="image/png" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink">
        <AuthProvider>
          <BillingProvider>
            <CurrencyProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </CurrencyProvider>
          </BillingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
