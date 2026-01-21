import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, MoreVertical, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/assets/drop-dead-logo.svg";
import LogoIcon from "@/assets/dd-secondary-logo.svg";
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
  { href: "/extensions", label: "Hair Extensions" },
  { href: "/careers", label: "Join The Team" },
  { href: "/gallery", label: "Gallery" },
];

const aboutLinks = [
  { href: "/about", label: "About Us" },
  { href: "/policies", label: "Salon Policies" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const staffMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const location = useLocation();

  // Close staff menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isStaffMenuOpen && staffMenuRef.current && !staffMenuRef.current.contains(event.target as Node)) {
        setIsStaffMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStaffMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setIsScrollingUp(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsScrollingUp(false);
      }
      
      lastScrollY.current = currentScrollY;
      setIsScrolled(currentScrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Section theme detection using data-theme attributes
  useEffect(() => {
    const detectTheme = () => {
      const headerEl = headerRef.current;
      if (!headerEl) return;

      // Get the header's bounding box
      const headerRect = headerEl.getBoundingClientRect();
      
      // Sample Y below the header to hit the content behind it
      // Add extra offset to ensure we're sampling content, not the header itself
      const sampleY = headerRect.bottom + 50;
      
      // Sample at center of viewport
      const sampleX = window.innerWidth / 2;

      const elBehind = document.elementFromPoint(sampleX, sampleY);
      
      // Walk up to find nearest ancestor with data-theme
      let foundDark = false;
      let cur: Element | null = elBehind;
      while (cur && cur !== document.body) {
        if (cur instanceof HTMLElement && cur.hasAttribute("data-theme")) {
          const theme = cur.getAttribute("data-theme");
          if (theme === "dark") {
            foundDark = true;
          }
          break; // Found a theme, stop walking up
        }
        cur = cur.parentElement;
      }

      setIsOverDark(foundDark);
    };

    window.addEventListener("scroll", detectTheme, { passive: true });
    // Run immediately
    detectTheme();
    
    return () => {
      window.removeEventListener("scroll", detectTheme);
    };
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
              : "bg-transparent"
          )}
        >
          <div className={cn(
            "container mx-auto px-6 lg:px-8 transition-colors duration-300",
            isOverDark ? "text-white [&_svg]:text-white" : "text-foreground"
          )}>
            <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo with scroll transition - fixed width container to prevent layout shift */}
            <div className="w-40 lg:w-56 flex items-center">
              <Link
                to="/"
                className="flex items-center hover:opacity-70 transition-opacity relative h-10"
              >
                {/* Primary Logo - shows when not scrolled OR scrolling up */}
                <img
                  src={Logo}
                  alt="Drop Dead"
                  style={{ 
                    opacity: !isScrolled || isScrollingUp ? 1 : 0,
                    transform: !isScrolled || isScrollingUp ? "scale(1)" : "scale(0.95)",
                    transition: "opacity 0.5s ease-out, transform 0.5s ease-out"
                  }}
                  className={cn(
                    "h-10 w-auto",
                    isOverDark && "invert"
                  )}
                />
                {/* Secondary Logo - shows when scrolled AND scrolling down */}
                <img
                  src={LogoIcon}
                  alt="Drop Dead"
                  style={{ 
                    opacity: isScrolled && !isScrollingUp ? 1 : 0,
                    transform: isScrolled && !isScrollingUp ? "scale(1)" : "scale(0.95)",
                    transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s"
                  }}
                  className={cn(
                    "h-6 w-auto absolute left-0",
                    isOverDark && "invert"
                  )}
                />
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <motion.nav 
              className="hidden lg:flex items-center gap-6 xl:gap-10"
              animate={{ 
                opacity: isStaffMenuOpen ? 0 : 1,
                pointerEvents: isStaffMenuOpen ? "none" : "auto"
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Services Link */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.1,
                  ease: [0.25, 0.1, 0.25, 1] 
                }}
              >
                <Link
                  to="/services"
                  className={cn(
                    "group relative flex items-center gap-1 text-sm tracking-wide font-sans font-medium transition-opacity leading-none",
                    location.pathname === "/services"
                      ? "opacity-100"
                      : "opacity-70 hover:opacity-100"
                  )}
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-1">
                    Services
                  </span>
                  <ArrowRight 
                    size={14} 
                    className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" 
                  />
                </Link>
              </motion.div>

              {/* About Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.15,
                  ease: [0.25, 0.1, 0.25, 1] 
                }}
                className="relative"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    className={cn(
                      "flex items-center gap-1 text-sm tracking-wide font-sans font-medium transition-opacity leading-none outline-none",
                      (location.pathname === "/about" || location.pathname === "/policies")
                        ? "opacity-100"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    About
                    <ChevronDown size={14} className="transition-transform duration-200" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="center" 
                    sideOffset={12}
                    className="w-[180px] rounded-lg border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl p-1.5"
                  >
                    {aboutLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link
                          to={link.href}
                          className={cn(
                            "flex items-center gap-3 select-none rounded-md px-3 py-2.5 text-sm font-medium leading-none cursor-pointer transition-all duration-200",
                            location.pathname === link.href 
                              ? "bg-accent text-accent-foreground" 
                              : "text-foreground/80"
                          )}
                        >
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              {/* Remaining Nav Links */}
              {navLinks.slice(1).map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.2 + index * 0.05,
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
            </motion.nav>

            {/* Right Side - Contact & Book */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: isStaffMenuOpen ? 0 : 1, 
                y: 0,
                pointerEvents: isStaffMenuOpen ? "none" : "auto"
              }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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
                        "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium rounded-full border-2 transition-all duration-300 active:scale-[0.98] hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg",
                        isOverDark 
                          ? "bg-transparent border-white text-white hover:bg-white hover:text-black" 
                          : "bg-background border-foreground text-foreground hover:bg-foreground hover:text-background"
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
              
              {/* 3-Dot Menu Button - Hide when staff menu is open */}
              <AnimatePresence>
                {!isStaffMenuOpen && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.7, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsStaffMenuOpen(true)}
                    className="p-2 transition-opacity"
                    aria-label="More options"
                  >
                    <MoreVertical size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Staff Login Expanding Menu */}
            <AnimatePresence>
              {isStaffMenuOpen && (
                <motion.div
                  ref={staffMenuRef}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 overflow-hidden"
                >
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="flex items-center gap-3 pl-4 pr-2"
                  >
                    <Link
                      to="/staff-login"
                      onClick={() => setIsStaffMenuOpen(false)}
                      className={cn(
                        "text-sm font-sans font-medium whitespace-nowrap px-4 py-2 rounded-full border transition-all duration-200",
                        isOverDark 
                          ? "border-white/30 text-white hover:bg-white/10" 
                          : "border-foreground/20 text-foreground hover:bg-foreground/5"
                      )}
                    >
                      Staff Login
                    </Link>
                    <button
                      onClick={() => setIsStaffMenuOpen(false)}
                      className="p-1.5 opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="Close menu"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2"
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
                <Link
                  to="/services"
                  className={cn(
                    "text-lg font-serif tracking-wide transition-opacity",
                    location.pathname === "/services"
                      ? "opacity-100"
                      : "opacity-60"
                  )}
                >
                  Services
                </Link>
                {aboutLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-lg font-serif tracking-wide transition-opacity pl-4",
                      location.pathname === link.href
                        ? "opacity-100"
                        : "opacity-60"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {navLinks.slice(1).map((link) => (
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
