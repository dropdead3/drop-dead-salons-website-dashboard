import { useState, useEffect } from "react";
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
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isScrolled
            ? "bg-background/70 backdrop-blur-xl backdrop-saturate-150 border-border/50 shadow-sm"
            : "bg-background border-transparent"
        )}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="hover:opacity-70 transition-opacity"
            >
              <img 
                src={Logo} 
                alt="Drop Dead" 
                className="h-4 lg:h-5 w-auto"
              />
            </Link>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
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
              ))}
            </nav>

            {/* Right Side - Contact & Book */}
            <div className="hidden md:flex items-center gap-6">
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium bg-foreground text-background hover:bg-foreground/90 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
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
                      Team Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
