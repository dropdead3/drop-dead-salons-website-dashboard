import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
];

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link
              to="/"
              className="font-serif text-2xl font-medium tracking-tight text-foreground"
            >
              Drop Dead Salon
            </Link>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed max-w-xs">
              Luxury without compromise.
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
                  className="text-sm font-sans text-foreground/80 hover:text-foreground transition-colors link-underline w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Connect
            </h4>
            <div className="space-y-3 text-sm font-sans text-foreground/80">
              <p>123 Luxury Lane</p>
              <p>Los Angeles, CA 90001</p>
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
              className="inline-flex items-center gap-2 text-sm font-sans text-foreground/60 hover:text-foreground transition-colors"
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
          <p className="text-xs text-muted-foreground font-sans italic">
            Where artistry lives.
          </p>
        </div>
      </div>
    </footer>
  );
}
