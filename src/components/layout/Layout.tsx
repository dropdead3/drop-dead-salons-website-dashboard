import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyFooterBar } from "./StickyFooterBar";
import { PageTransition } from "./PageTransition";
import { FooterCTASection } from "@/components/home/FooterCTASection";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <FooterCTASection />
      <Footer />
      <StickyFooterBar />
    </div>
  );
}
