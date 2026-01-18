import { Link } from "react-router-dom";
import { Instagram, ArrowUpRight, MapPin, Phone } from "lucide-react";
import Logo from "@/assets/drop-dead-logo.svg";
import { FooterStamp } from "./FooterStamp";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
];

const locations = [
  {
    name: "North Mesa",
    address: "2036 N Gilbert Rd Ste 1",
    city: "Mesa, AZ 85203",
    phone: "(480) 548-1886",
  },
  {
    name: "Val Vista Lakes",
    address: "3641 E Baseline Rd Suite Q-103",
    city: "Gilbert, AZ 85234",
    phone: "(480) 548-1886",
  },
];

const hours = "Tue–Sat: 10am–6pm · Closed Sun & Mon";

export function Footer() {
  return (
    <footer 
      className="bg-secondary text-foreground"
      data-theme="light"
    >
      {/* CTA Section */}
      <div className="py-24 lg:py-32 text-center border-b border-foreground/10">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Eyebrow */}
          <p className="text-foreground/50 text-xs uppercase tracking-[0.2em] font-sans mb-6">
            Ready for Something Different?
          </p>

          {/* Main headline */}
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground mb-6">
            Book Your <span className="italic">Consult</span>
          </h2>

          {/* Description */}
          <p className="text-foreground/60 text-base md:text-lg font-sans font-light max-w-xl mx-auto mb-10">
            Every great transformation begins with a conversation. Let's plan yours.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 px-8 py-4 text-base font-sans font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all duration-300 active:scale-[0.98]"
            >
              <span>Book consult</span>
              <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Phone numbers */}
            <div className="flex items-center gap-2 text-foreground/50">
              <span className="text-sm font-sans">or call</span>
              {locations.map((loc, index) => (
                <span key={loc.name} className="inline-flex items-center">
                  <a
                    href={`tel:${loc.phone.replace(/[^0-9]/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-sm font-sans text-foreground/70 hover:text-foreground transition-colors"
                  >
                    <Phone size={14} />
                    <span className="hidden sm:inline">{loc.name}</span>
                  </a>
                  {index < locations.length - 1 && <span className="mx-2 text-foreground/30">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link
              to="/"
              className="hover:opacity-70 transition-opacity"
            >
              <img 
                src={Logo} 
                alt="Drop Dead" 
                className="h-5 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed max-w-xs">
              Death to bad hair.
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
                  className="text-sm font-sans font-light text-foreground/70 hover:text-foreground transition-colors w-fit"
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
                <div key={location.name} className="space-y-1">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group"
                  >
                    <MapPin className="w-4 h-4 text-foreground/40 group-hover:text-foreground flex-shrink-0 mt-0.5 transition-colors" />
                    <div className="text-sm font-sans font-light text-foreground/70 group-hover:text-foreground transition-colors">
                      <p className="font-medium text-foreground">{location.name}</p>
                      <p>{location.address}</p>
                      <p>{location.city}</p>
                    </div>
                  </a>
                  <a 
                    href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                    className="text-sm font-sans font-light text-foreground/50 hover:text-foreground transition-colors ml-6"
                  >
                    {location.phone}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/40 mt-4">{hours}</p>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Connect
            </h4>
            <div className="space-y-3 text-sm font-sans font-light text-foreground/70">
              <a
                href="mailto:contact@dropdeadsalon.com"
                className="block hover:text-foreground transition-colors"
              >
                contact@dropdeadsalon.com
              </a>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-sans font-light text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
              <span>@dropdeadsalon</span>
            </a>
          </div>

          {/* Stamp */}
          <div className="flex items-start justify-center lg:justify-end">
            <FooterStamp />
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-sans">
            © {new Date().getFullYear()} Drop Dead Salon. All rights reserved.
          </p>
          <div className="flex items-center gap-10 md:gap-12">
            <Link
              to="/stylists#careers"
              className="inline-flex items-center gap-2 text-xs font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              Work at Drop Dead
              <ArrowUpRight size={12} />
            </Link>
            <Link
              to="/gift-cards"
              className="inline-flex items-center gap-2 text-xs font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              Buy a gift card
              <ArrowUpRight size={12} />
            </Link>
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-2 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
