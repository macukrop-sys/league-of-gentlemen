import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getLeague, isLiveDataSource } from "@/lib/data/provider";

export const metadata: Metadata = {
  title: "The League of Gentlemen | Fantasy Analytics",
  description: "Live analytics, advanced statistics, and a Monte Carlo playoff simulator for The League of Gentlemen fantasy football league.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const league = await getLeague();

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <TooltipProvider delayDuration={150}>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Header leagueName={league.settings.leagueName} week={league.settings.currentWeek} isLive={isLiveDataSource()} />
              <main className="flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
            </div>
          </div>
          <MobileNav />
        </TooltipProvider>
      </body>
    </html>
  );
}
