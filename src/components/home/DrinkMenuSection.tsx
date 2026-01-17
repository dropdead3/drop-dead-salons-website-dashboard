import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const drinks = [
  {
    id: 1,
    name: "Tropical Death",
    colors: "from-purple-400 via-pink-400 to-purple-600",
    ingredients: "Passion fruit, butterfly pea, lychee, sparkling water",
  },
  {
    id: 2,
    name: "Creme De Dead",
    colors: "from-yellow-300 via-teal-400 to-cyan-500",
    ingredients: "Mango, blue curaçao, coconut cream, pineapple",
  },
  {
    id: 3,
    name: "Scary Stories",
    colors: "from-cyan-400 via-blue-500 to-purple-500",
    ingredients: "Blueberry, lavender, vanilla, oat milk",
  },
  {
    id: 4,
    name: "Stay Awhile",
    colors: "from-pink-300 via-rose-400 to-red-400",
    ingredients: "Strawberry, rose water, hibiscus, honey",
  },
  {
    id: 5,
    name: "Drop Dead Gorgeous",
    colors: "from-emerald-300 via-teal-400 to-cyan-500",
    ingredients: "Matcha, mint, cucumber, lime, agave",
  },
  {
    id: 6,
    name: "Sweet Dreams",
    colors: "from-violet-400 via-purple-500 to-indigo-500",
    ingredients: "Grape, elderflower, chamomile, sparkling water",
  },
];

const DrinkIcon = ({ colors }: { colors: string }) => (
  <div className="relative w-20 h-28 md:w-24 md:h-32 transition-transform duration-300 group-hover:scale-110">
    {/* Cup */}
    <div 
      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-24 md:w-20 md:h-28 rounded-b-lg bg-gradient-to-b ${colors} opacity-90`}
      style={{
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
      }}
    />
    {/* Ice cubes effect */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 md:w-14 flex flex-wrap gap-1 justify-center">
      <div className="w-3 h-3 bg-white/40 rounded-sm rotate-12" />
      <div className="w-2.5 h-2.5 bg-white/30 rounded-sm -rotate-6" />
      <div className="w-2 h-2 bg-white/20 rounded-sm rotate-45" />
    </div>
    {/* Garnish */}
    <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-green-500" />
    <div className="absolute -top-2 right-1 w-1.5 h-4 bg-green-600 rotate-45 rounded-full" />
  </div>
);

interface DrinkCardProps {
  drink: typeof drinks[0];
  index?: number;
  isInView?: boolean;
  animated?: boolean;
}

const DrinkCard = ({ drink, index = 0, isInView = true, animated = true }: DrinkCardProps) => {
  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated ? {
    initial: { opacity: 0, y: 30 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay: index * 0.1 },
  } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative flex flex-col items-center gap-4 px-16 md:px-24 lg:px-32 cursor-pointer"
    >
      <DrinkIcon colors={drink.colors} />
      <h3 className="font-serif text-lg md:text-xl lg:text-2xl text-foreground whitespace-nowrap">
        {drink.name}
      </h3>
      
      {/* Hover tooltip - positioned to the right, centered in gap */}
      <div className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
        <div className="bg-foreground text-background px-4 py-3 text-center shadow-lg">
          <p className="text-xs uppercase tracking-wider mb-1 text-background/70">Ingredients</p>
          <p className="text-sm font-light max-w-[160px] whitespace-normal">
            {drink.ingredients}
          </p>
        </div>
        {/* Arrow pointing left */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-foreground" />
      </div>
    </Wrapper>
  );
};

export function DrinkMenuSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 overflow-hidden bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 text-center mb-12"
      >
        <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
          Drinks on us. We have an exclusive menu of{" "}
          <span className="underline underline-offset-4">complimentary</span>{" "}
          options for your appointment.
        </p>
      </motion.div>

      {/* Scrolling Drinks */}
      <div 
        className="flex animate-drink-scroll"
        style={{ width: 'fit-content' }}
      >
        {/* First set */}
        {drinks.map((drink, index) => (
          <DrinkCard 
            key={drink.id} 
            drink={drink} 
            index={index} 
            isInView={isInView} 
            animated={true}
          />
        ))}
        
        {/* Duplicate set for seamless loop */}
        {drinks.map((drink) => (
          <DrinkCard 
            key={`dup-${drink.id}`} 
            drink={drink} 
            animated={false}
          />
        ))}
      </div>
    </section>
  );
}
