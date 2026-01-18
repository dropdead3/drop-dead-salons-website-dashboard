import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/assets/drop-dead-logo.svg";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isOverDark, setIsOverDark] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Check what's behind the header
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        const headerMidY = headerRect.top + headerRect.height / 2;
        const headerMidX = window.innerWidth / 2;
        
        // Temporarily hide header to sample what's behind
        const originalPointerEvents = headerRef.current.style.pointerEvents;
        headerRef.current.style.pointerEvents = 'none';
        
        const elementBehind = document.elementFromPoint(headerMidX, headerMidY);
        headerRef.current.style.pointerEvents = originalPointerEvents;
        
        if (elementBehind) {
          // Check if element or its parents have dark background
          let current: Element | null = elementBehind;
          let isDark = false;
          
          while (current && current !== document.body) {
            const bg = window.getComputedStyle(current).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              // Parse RGB values
              const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const [, r, g, b] = match.map(Number);
                // Calculate relative luminance
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                isDark = luminance < 0.5;
                break;
              }
            }
            current = current.parentElement;
          }
          
          setIsOverDark(isDark);
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
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
            Are you a salon <span className="font-medium">professional</span> looking for our extensions?
          </p>
          <a 
            href="#" 
            className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-sans font-medium text-foreground uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            Shop Our Extensions Here
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header 
        ref={headerRef}
        className={cn(
          "sticky top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-8 transition-[padding] duration-400",
          isScrolled ? "pt-4 md:pt-6 lg:pt-8" : "pt-2"
        )}
      >
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isScrolled 
              ? isOverDark ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.1)" 
              : "transparent",
            backdropFilter: isScrolled ? "blur(24px) saturate(1.5)" : "blur(0px)",
            borderColor: isScrolled 
              ? isOverDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)" 
              : "transparent",
            boxShadow: isScrolled 
              ? "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              : "none",
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            "rounded-2xl border transition-colors duration-300",
            isScrolled 
              ? isOverDark ? "bg-black/20" : "bg-white/10" 
              : "bg-transparent",
            isOverDark && !isScrolled ? "text-white" : ""
          )}
        >
          <div className={cn(
            "container mx-auto px-6 lg:px-8 transition-colors duration-300",
            isOverDark ? "text-white" : "text-foreground"
          )}>
            <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                to="/"
                className="hover:opacity-70 transition-opacity"
              >
                <img 
                  src={Logo} 
                  alt="Drop Dead" 
                  className={cn(
                    "h-4 lg:h-5 w-auto transition-all duration-300",
                    isOverDark ? "invert" : ""
                  )}
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.1 + index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1] 
                  }}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      "group relative flex items-center gap-1 text-sm tracking-wide font-sans font-medium transition-opacity leading-none",
                      location.pathname === link.href
                        ? "opacity-100"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <span className="transition-transform duration-300 group-hover:-translate-x-1">
                      {link.label}
                    </span>
                    <ArrowRight 
                      size={14} 
                      className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" 
                    />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Right Side - Contact & Book */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden md:flex items-center gap-6"
            >
              <Link
                to="/contact"
                className="text-sm tracking-wide font-sans font-medium opacity-70 hover:opacity-100 transition-all duration-300 link-underline"
              >
                Contact Us
              </Link>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/booking"
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium rounded-lg hover:shadow-lg transition-all duration-300 active:scale-[0.98]",
                        isOverDark 
                          ? "bg-white text-black hover:bg-white/90" 
                          : "bg-foreground text-background hover:bg-foreground/90"
                      )}
                    >
                      Book Consult
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[320px] p-5 bg-background text-foreground border border-border shadow-lg">
                    <p className="text-sm text-center leading-relaxed">New-client consultations ($15) are required for all new clients to ensure we match you to your best suited stylist and prepare the best plan to achieve your end goal.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-2 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="More options"
                  >
                    <MoreVertical size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-border">
                  <DropdownMenuItem asChild>
                    <Link to="/staff-login" className="cursor-pointer">
                      Staff Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

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
        </motion.div>

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
                  className="mt-4 w-full text-center inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-sans font-medium bg-foreground text-background"
                >
                  Book consult
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
