import { Link } from "react-router-dom";
import { Instagram, ArrowUpRight, MapPin } from "lucide-react";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
];

const locations = [
  {
    name: "West Hollywood",
    address: "8715 Santa Monica Blvd",
    city: "West Hollywood, CA 90069",
  },
  {
    name: "Studio City",
    address: "12345 Ventura Blvd",
    city: "Studio City, CA 91604",
  }
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link
              to="/"
              className="font-serif text-2xl font-normal tracking-tight text-foreground"
            >
              Drop Dead Salon
            </Link>
            <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed max-w-xs">
              Luxury without compromise. Where artistry lives.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Navigate
            </h4>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-sans font-light text-foreground/80 hover:text-foreground transition-colors link-underline w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Locations */}
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Locations
            </h4>
            <div className="space-y-5">
              {locations.map((location) => (
                <div key={location.name} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-foreground/50 flex-shrink-0 mt-0.5" />
                  <div className="text-sm font-sans font-light text-foreground/80">
                    <p className="font-medium text-foreground">{location.name}</p>
                    <p>{location.address}</p>
                    <p>{location.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Connect
            </h4>
            <div className="space-y-3 text-sm font-sans font-light text-foreground/80">
              <a
                href="mailto:hello@dropdeadsalon.com"
                className="block hover:text-foreground transition-colors"
              >
                hello@dropdeadsalon.com
              </a>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-sans font-light text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
              <span>@dropdeadsalon</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-sans">
            © {new Date().getFullYear()} Drop Dead Salon. All rights reserved.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-sans text-foreground hover:opacity-70 transition-opacity"
          >
            Book Your Experience
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </footer>
  );
}