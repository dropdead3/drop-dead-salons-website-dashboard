import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyBookButton } from "./StickyBookButton";
import { StickyPhoneSidebar } from "./StickyPhoneSidebar";
import { PageTransition } from "./PageTransition";

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
      <Footer />
      <StickyBookButton />
      <StickyPhoneSidebar />
    </div>
  );
}
