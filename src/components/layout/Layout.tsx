import { ReactNode, useEffect, useState, useRef } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
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

    updateFooterHeight();
    window.addEventListener("resize", updateFooterHeight);
    
    // Also update after fonts load
    document.fonts?.ready.then(updateFooterHeight);

    return () => window.removeEventListener("resize", updateFooterHeight);
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
        className="relative z-10 bg-background flex flex-col min-h-screen"
        style={{ marginBottom: footerHeight }}
      >
        <Header />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        {/* Shadow to create depth as content reveals footer */}
        <div 
          className="h-8 bg-gradient-to-b from-background to-transparent pointer-events-none"
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'translateY(100%)',
            boxShadow: '0 -20px 40px -10px rgba(0,0,0,0.15)'
          }}
        />
      </div>

      <StickyFooterBar />
    </div>
  );
}
