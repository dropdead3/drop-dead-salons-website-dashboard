import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

// Import drink images
import dirtyPeachImg from "@/assets/drinks/dirty-peach.jpg";
import blowOutImg from "@/assets/drinks/blow-out.jpg";
import scaryStoriesImg from "@/assets/drinks/scary-stories.jpg";
import grampsImg from "@/assets/drinks/gramps.jpg";
import zombieImg from "@/assets/drinks/zombie.jpg";
import afterlifeImg from "@/assets/drinks/afterlife.jpg";

const drinks = [
  {
    id: 1,
    name: "Dirty Peach",
    image: dirtyPeachImg,
    ingredients: "Peach, brown sugar, gummy candy, sparkling water",
  },
  {
    id: 2,
    name: "Blow Out",
    image: blowOutImg,
    ingredients: "Strawberry, peach ring, sparkling water, crushed ice",
  },
  {
    id: 3,
    name: "Scary Stories",
    image: scaryStoriesImg,
    ingredients: "Toasted marshmallow, caramel, espresso, oat milk, whipped cream",
  },
  {
    id: 4,
    name: "Gramps",
    image: grampsImg,
    ingredients: "Caramel, butterscotch, espresso, oat milk, whipped cream",
  },
  {
    id: 5,
    name: "Zombie",
    image: zombieImg,
    ingredients: "Cinnamon, espresso, oat milk, whipped cream",
  },
  {
    id: 6,
    name: "Afterlife",
    image: afterlifeImg,
    ingredients: "Strawberry, mango, passion fruit, sparkling water",
  },
];

interface DrinkCardProps {
  drink: typeof drinks[0];
  index?: number;
  isInView?: boolean;
  animated?: boolean;
}

const DrinkCard = ({ drink, index = 0, isInView = true, animated = true }: DrinkCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ingredientsList = drink.ingredients.split(", ");
  const maxVisible = 3;
  const needsTruncation = ingredientsList.length > maxVisible;
  const displayedIngredients = isExpanded || !needsTruncation 
    ? ingredientsList 
    : ingredientsList.slice(0, maxVisible);

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated ? {
    initial: { opacity: 0, y: 30 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay: index * 0.1 },
  } : {};

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative flex flex-col items-center gap-4 px-12 md:px-16 lg:px-20 cursor-pointer"
    >
      {/* Drink image container with tooltip */}
      <div className="relative">
        <div className="w-24 h-32 md:w-28 md:h-36 lg:w-32 lg:h-40 transition-transform duration-300 group-hover:scale-110">
          <img 
            src={drink.image} 
            alt={drink.name}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Hover tooltip - positioned to the right of the icon */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-6 md:ml-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto z-10">
          <motion.div 
            layout
            className="bg-foreground text-background px-5 py-4 text-center shadow-lg w-[180px] min-h-[120px] flex flex-col justify-center"
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-[0.2em] mb-3 text-background/60 font-display">Ingredients</p>
            <motion.ul 
              layout
              className="text-sm leading-relaxed text-left space-y-1"
              style={{ fontFamily: "'Aeonik Pro', sans-serif", fontWeight: 500 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {displayedIngredients.map((ingredient, i) => (
                <li key={i} className="flex items-center gap-2 text-background">
                  <span className="text-background/50">•</span>
                  <span className="capitalize">{ingredient.trim()}</span>
                </li>
              ))}
            </motion.ul>
            {needsTruncation && (
              <motion.button 
                layout
                onClick={handleToggle}
                className="mt-2 text-[10px] uppercase tracking-[0.15em] text-background/70 hover:text-background transition-colors font-sans underline underline-offset-2"
              >
                {isExpanded ? "See less" : "See more"}
              </motion.button>
            )}
          </motion.div>
          {/* Arrow pointing left */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-foreground" />
        </div>
      </div>
      
      <h3 className="font-display text-lg md:text-xl lg:text-2xl text-foreground whitespace-nowrap">
        {drink.name}
      </h3>
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
        <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-display">
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
