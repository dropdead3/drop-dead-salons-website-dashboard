import { Link } from "react-router-dom";
import { Instagram, ArrowUpRight, MapPin, Phone, AlertCircle } from "lucide-react";
import Logo from "@/assets/drop-dead-logo.svg";
import { useActiveLocations, formatHoursForDisplay, isClosedForHoliday, isClosedToday } from "@/hooks/useLocations";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
];

export function Footer() {
  const { data: locations = [] } = useActiveLocations();
  
  // Get hours from the first location for display
  const hours = locations.length > 0 ? formatHoursForDisplay(locations[0].hours_json) : '';

  return (
    <footer
      className="bg-secondary text-foreground"
      data-theme="light"
    >
      <div className="container mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-4 md:space-y-6">
            <Link
              to="/"
              className="hover:opacity-70 transition-opacity inline-block"
            >
              <img 
                src={Logo} 
                alt="Drop Dead" 
                className="h-5 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed">
              Death to bad hair.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4 md:space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Navigate
            </h4>
            <nav className="flex flex-row md:flex-col gap-6 md:gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-sans font-light text-foreground/70 hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Locations */}
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Locations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
              {locations.map((location) => {
                const holidayClosure = isClosedForHoliday(location.holiday_closures);
                const closedToday = isClosedToday(location.hours_json);
                const showClosedNotice = holidayClosure || closedToday;
                
                return (
                  <div key={location.name} className="space-y-2">
                    {/* Closed Notice */}
                    {showClosedNotice && (
                      <div className="inline-flex items-center gap-1.5 text-amber-600 px-2 py-0.5 bg-amber-600/10 rounded-full w-fit">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {holidayClosure 
                            ? `Closed – ${holidayClosure.name}`
                            : 'Closed today'
                          }
                        </span>
                      </div>
                    )}
                    <a 
                      href={location.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-foreground/40 group-hover:text-foreground flex-shrink-0 mt-0.5 transition-colors" />
                      <div className="text-sm font-sans font-light text-foreground/70 group-hover:text-foreground transition-colors">
                        <p className="font-medium text-foreground">{location.name}</p>
                        <p className="text-foreground/60">{location.address}</p>
                        <p className="text-foreground/60">{location.city}</p>
                      </div>
                    </a>
                    <div className="pl-[26px] space-y-0.5">
                      <a 
                        href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                        className="flex items-center gap-1.5 text-sm font-sans font-light text-foreground/50 hover:text-foreground transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {location.phone}
                      </a>
                      <p className="text-xs text-foreground/40">
                        {formatHoursForDisplay(location.hours_json)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 md:space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Connect
            </h4>
            <div className="space-y-4">
              <a
                href="mailto:contact@dropdeadsalon.com"
                className="block text-sm font-sans font-light text-foreground/70 hover:text-foreground transition-colors"
              >
                contact@dropdeadsalon.com
              </a>
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
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-foreground/10 flex flex-col gap-6 md:gap-4">
          <p className="text-xs text-muted-foreground font-sans text-center md:text-left order-1 md:order-none">
            © {new Date().getFullYear()} Drop Dead Salon. All rights reserved.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 md:gap-x-10">
            <Link
              to="/stylists#careers"
              className="inline-flex items-center gap-1.5 text-xs font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              Work at Drop Dead
              <ArrowUpRight size={12} />
            </Link>
            <Link
              to="/gift-cards"
              className="inline-flex items-center gap-1.5 text-xs font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              Buy a gift card
              <ArrowUpRight size={12} />
            </Link>
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Staff Login
            </Link>
          </div>
          
          {/* Powered By */}
          <p className="text-xs text-muted-foreground/60 font-sans text-center md:text-left mt-2 md:mt-0">
            Powered by Drop Dead Salon Software
          </p>
        </div>
      </div>
    </footer>
  );
}
