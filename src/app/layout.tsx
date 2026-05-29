import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { CampaignProvider } from "@/context/CampaignContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMZ Analyzer - Simulador Amazon FBA",
  description: "Descubre subnichos de baja competencia y simula rentabilidad en Amazon México",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-[#0B0E14] text-white">
        <CampaignProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {children}
          </main>
        </CampaignProvider>
      </body>
    </html>

  );
}
