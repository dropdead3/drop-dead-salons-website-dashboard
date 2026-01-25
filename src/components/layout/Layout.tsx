import { ReactNode, useEffect, useState, useRef } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FooterCTA } from "./FooterCTA";
import { StickyFooterBar } from "./StickyFooterBar";
import { PageTransition } from "./PageTransition";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };

    // Initial measurement after a brief delay to ensure content renders
    const initialTimeout = setTimeout(updateFooterHeight, 100);
    
    // Use ResizeObserver for accurate dynamic measurements
    const resizeObserver = new ResizeObserver(updateFooterHeight);
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    window.addEventListener("resize", updateFooterHeight);
    
    // Also update after fonts load
    document.fonts?.ready.then(updateFooterHeight);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFooterHeight);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed footer that reveals as content scrolls */}
      <div 
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-0"
      >
        <Footer />
      </div>

      {/* Main content that scrolls over the footer */}
      <div 
        className="relative z-10 flex flex-col min-h-screen bg-background rounded-b-[2rem] md:rounded-b-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ marginBottom: footerHeight }}
      >
        <Header />
        <main className="flex-1 bg-background">
          <PageTransition>{children}</PageTransition>
        </main>
        
        {/* CTA - part of scrolling content, NOT fixed footer */}
        <FooterCTA />
        
        {/* Bottom fade/blur edge for parallax reveal transition */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 md:h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.5) 40%, hsl(var(--background)) 100%)',
            backdropFilter: 'blur(2px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
          }}
        />
      </div>

      <StickyFooterBar />
    </div>
  );
}
