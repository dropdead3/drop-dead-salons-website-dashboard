import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/extensions", label: "Hair Extensions" },
  { href: "/careers", label: "Join The Team" },
  { href: "/gallery", label: "Gallery" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-secondary py-2.5 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <p className="text-xs md:text-sm text-foreground/80">
            Are you a salon <em>professional</em> looking for our extensions?
          </p>
          <a 
            href="#" 
            className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-foreground uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            Shop Our Extensions Here
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-border shadow-sm"
            : "bg-background border-transparent"
        )}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="font-serif text-xl lg:text-2xl font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity uppercase"
            >
              Drop Dead
            </Link>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm tracking-wide font-sans font-normal link-underline transition-opacity",
                    location.pathname === link.href
                      ? "opacity-100"
                      : "opacity-70 hover:opacity-100"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side - Contact & Book */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/contact"
                className="text-sm tracking-wide font-sans font-normal opacity-70 hover:opacity-100 transition-all duration-300 link-underline"
              >
                Contact Us
              </Link>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/booking"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium bg-foreground text-background hover:bg-foreground/90 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                    >
                      Book Consult
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] p-3 bg-background text-foreground border border-border">
                    <p className="text-xs text-center">Every new client starts with a free consultation to ensure the perfect match</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-background border-t border-border overflow-hidden"
            >
              <nav className="container mx-auto px-6 py-8 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-lg font-serif tracking-wide transition-opacity",
                      location.pathname === link.href
                        ? "opacity-100"
                        : "opacity-60"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/contact"
                  className="text-lg font-serif tracking-wide opacity-60"
                >
                  Contact Us
                </Link>
                <Link
                  to="/booking"
                  className="mt-4 w-full text-center inline-flex items-center justify-center gap-2 px-6 py-4 text-sm uppercase tracking-[0.15em] font-sans font-medium bg-foreground text-background"
                >
                  Book Consult
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
