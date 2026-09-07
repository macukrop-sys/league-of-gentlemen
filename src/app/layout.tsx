import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getLeague, getDataSourceName } from "@/lib/data/provider";

const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "The League of Gentlemen | Fantasy Analytics",
  description: "Live analytics, advanced statistics, and a Monte Carlo playoff simulator for The League of Gentlemen fantasy football league.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const league = await getLeague();

  return (
    <html lang="en" className={`${publicSans.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        <TooltipProvider delayDuration={150}>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Header leagueName={league.settings.leagueName} week={league.settings.currentWeek} dataSource={getDataSourceName()} />
              <main className="flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
            </div>
          </div>
          <MobileNav />
        </TooltipProvider>
      </body>
    </html>
  );
}
