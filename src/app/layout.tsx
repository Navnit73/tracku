import type { Metadata } from "next";
import Script from "next/script";
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
  metadataBase: new URL("https://www.expenseliy.com"),
  title: {
    default: "Expenseliy - Personal Expense, Income & Investment Tracker",
    template: "%s | Expenseliy",
  },
  description:
    "Expenseliy is your smart personal finance, expense tracking, income analytics, and investment management platform.",
  applicationName: "Expenseliy",
  authors: [{ name: "Expenseliy" }],
  creator: "Expenseliy",
  publisher: "Expenseliy",
  keywords: [
    "Expenseliy",
    "expense tracker",
    "finance tracker",
    "budget manager",
    "income analytics",
    "investment tracking",
    "personal ledger",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.expenseliy.com",
    siteName: "Expenseliy",
    title: "Expenseliy - Personal Expense, Income & Investment Tracker",
    description:
      "Track your expenses, manage income, analyze investments, and master your financial future with Expenseliy.",
    images: [
      {
        url: "/asset-management.png",
        width: 512,
        height: 512,
        alt: "Expenseliy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Expenseliy - Personal Expense, Income & Investment Tracker",
    description:
      "Track your expenses, manage income, analyze investments, and master your financial future with Expenseliy.",
    images: ["/asset-management.png"],
  },
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "y7ievvsz6c");
          `}
        </Script>
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
