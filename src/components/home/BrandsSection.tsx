const brandLogos = [
  { name: "Kevin Murphy", text: "KEVIN.MURPHY" },
  { name: "AIIR", text: "AIIR" },
  { name: "Nutrafol", text: "NUTRAFOL" },
  { name: "Drop Dead Professional", text: "DROP DEAD PROFESSIONAL" },
  { name: "Danger Jones", text: "DANGER JONES" },
];

export function BrandsSection() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto" style={{ paddingLeft: 'calc(1.5rem - 15px)', paddingRight: 'calc(1.5rem - 15px)' }}>
        <div className="flex items-center">
          {/* Left side text with divider */}
          <div className="flex-shrink-0 pr-6 md:pr-10 flex items-center">
            <div className="max-w-[180px] md:max-w-[200px]">
              <p 
                className="text-xs md:text-sm tracking-[0.02em] text-foreground/80 leading-relaxed"
                style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
              >
                Our favorite brands
                <br />
                we love to use in the
                <br />
                salon
              </p>
            </div>
            {/* Vertical divider */}
            <div className="ml-6 md:ml-10 h-16 md:h-20 w-px bg-foreground/30" />
          </div>

          {/* Scrolling logos container with mask */}
          <div 
            className="flex-1 overflow-hidden relative"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
            }}
          >
            <div className="flex animate-brand-scroll">
              {/* First set */}
              <div className="flex items-center gap-16 md:gap-28 lg:gap-36 pr-16 md:pr-28 lg:pr-36">
                {brandLogos.map((brand, index) => (
                  <span
                    key={index}
                    className="text-lg md:text-xl lg:text-2xl font-medium tracking-[0.1em] text-foreground whitespace-nowrap uppercase"
                    style={{ fontFamily: "'Termina', sans-serif" }}
                  >
                    {brand.text}
                  </span>
                ))}
              </div>
              {/* Duplicate set for seamless loop */}
              <div className="flex items-center gap-16 md:gap-28 lg:gap-36 pr-16 md:pr-28 lg:pr-36" aria-hidden="true">
                {brandLogos.map((brand, index) => (
                  <span
                    key={`dup-${index}`}
                    className="text-lg md:text-xl lg:text-2xl font-medium tracking-[0.1em] text-foreground whitespace-nowrap uppercase"
                    style={{ fontFamily: "'Termina', sans-serif" }}
                  >
                    {brand.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
