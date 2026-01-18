export function FooterStamp() {
  return (
    <div 
      className="w-[120px] h-[120px] relative"
      title="Drop Dead Exclusively Professional"
    >
      <div className="relative w-full h-full">
        {/* Rotating outer ring with text */}
        <svg 
          viewBox="0 0 468 468" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute inset-0 w-full h-full animate-spin-slow"
        >
          <path 
            d="M230.234 1.13428L229.619 4.52051L197.24 3.00293L192.566 8.97461L193.566 3.46191L230.234 1.13428Z" 
            fill="currentColor"
            className="text-foreground"
          />
        </svg>
        
        {/* Center logo */}
        <svg 
          viewBox="0 0 284 136" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42%]"
        >
          <path 
            d="M284 68C284 105.555 220.469 136 142 136C63.5309 136 0 105.555 0 68C0 30.4446 63.5309 0 142 0C220.469 0 284 30.4446 284 68Z" 
            fill="none"
          />
          <text 
            x="142" 
            y="58" 
            textAnchor="middle" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            fontSize="50" 
            fontWeight="900" 
            fill="currentColor"
            className="text-foreground"
          >
            DROP
          </text>
          <text 
            x="142" 
            y="110" 
            textAnchor="middle" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            fontSize="50" 
            fontWeight="900" 
            fill="currentColor"
            className="text-foreground"
          >
            DEAD
          </text>
        </svg>
        
        {/* Circular text path */}
        <svg 
          viewBox="0 0 120 120" 
          className="absolute inset-0 w-full h-full animate-spin-slow"
        >
          <defs>
            <path
              id="footerStampCircle"
              d="M 60,60 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
              fill="none"
            />
          </defs>
          <text
            fill="currentColor"
            className="text-foreground"
            fontSize="10"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
            letterSpacing="0.15em"
          >
            <textPath href="#footerStampCircle" startOffset="0%">
              EXCLUSIVELY • PROFESSIONAL • EXCLUSIVELY • PROFESSIONAL •
            </textPath>
          </text>
        </svg>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
