export type Location = "north-mesa" | "val-vista-lakes";

export interface Stylist {
  id: string;
  name: string;
  instagram: string;
  level: string;
  specialties: string[];
  imageUrl: string;
  locations: Location[]; // Support multiple locations
}

// Helper to get location display name
export const getLocationName = (locationId: Location): string => {
  const locationMap: Record<Location, string> = {
    "north-mesa": "North Mesa",
    "val-vista-lakes": "Val Vista Lakes"
  };
  return locationMap[locationId];
};

export const stylists: Stylist[] = [
  {
    id: "1",
    name: "Kristi D.",
    instagram: "@dropdeadkristi",
    level: "LEVEL 3 STYLIST",
    specialties: ["BLONDING", "CREATIVE COLOR", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1595959183082-7b570b7e1daf?w=600&h=800&fit=crop",
    locations: ["north-mesa", "val-vista-lakes"] // Works at both
  },
  {
    id: "2",
    name: "Sarina L.",
    instagram: "@hairdidbysarina_",
    level: "LEVEL 2 STYLIST",
    specialties: ["EXTENSIONS", "BLONDING", "CREATIVE COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop",
    locations: ["north-mesa"]
  },
  {
    id: "3",
    name: "Hayleigh H.",
    instagram: "@lucky7studios_",
    level: "LEVEL 2 STYLIST",
    specialties: ["BLONDING", "CREATIVE COLOR", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&h=800&fit=crop",
    locations: ["north-mesa"]
  },
  {
    id: "4",
    name: "Gavin E.",
    instagram: "@hairbygavinn",
    level: "LEVEL 2 STYLIST",
    specialties: ["AIRTOUCH", "COLOR BLOCKING", "CREATIVE COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    locations: ["north-mesa"]
  },
  {
    id: "5",
    name: "Maya R.",
    instagram: "@mayahairartist",
    level: "LEVEL 3 STYLIST",
    specialties: ["LAYERED CUTS", "CREATIVE COLOR", "COLOR BLOCKING"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    locations: ["north-mesa"]
  },
  {
    id: "6",
    name: "Jordan T.",
    instagram: "@jordantcuts",
    level: "LEVEL 1 STYLIST",
    specialties: ["BLONDING", "CREATIVE COLOR", "CUSTOM CUTS"],
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    locations: ["north-mesa"]
  }
];

// Get extension specialists sorted by level (highest to lowest)
export const getExtensionSpecialists = (): Stylist[] => {
  const levelOrder: Record<string, number> = {
    "LEVEL 4 STYLIST": 1,
    "LEVEL 3 STYLIST": 2,
    "LEVEL 2 STYLIST": 3,
    "LEVEL 1 STYLIST": 4
  };

  return stylists
    .filter(stylist => stylist.specialties.includes("EXTENSIONS"))
    .sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99));
};

// Check if stylist works at a specific location
export const stylistWorksAtLocation = (stylist: Stylist, location: Location): boolean => {
  return stylist.locations.includes(location);
};

export const locations = [
  { id: "north-mesa" as Location, name: "North Mesa", address: "2036 N Gilbert Rd Ste 1, Mesa, AZ 85203" },
  { id: "val-vista-lakes" as Location, name: "Val Vista Lakes", address: "3641 E Baseline Rd Suite Q-103, Gilbert, AZ 85234" },
];

// Extract all unique specialties - with EXTENSIONS first
export const allSpecialties = Array.from(
  new Set(stylists.flatMap((s) => s.specialties))
).sort((a, b) => {
  if (a === "EXTENSIONS") return -1;
  if (b === "EXTENSIONS") return 1;
  return a.localeCompare(b);
});

// Stylist levels with price indicators
export const stylistLevels = [
  { id: "LEVEL 1 STYLIST", name: "Level 1", price: "$", description: "Rising talent" },
  { id: "LEVEL 2 STYLIST", name: "Level 2", price: "$$", description: "Skilled stylist" },
  { id: "LEVEL 3 STYLIST", name: "Level 3", price: "$$$", description: "Master artist" },
  { id: "LEVEL 4 STYLIST", name: "Level 4", price: "$$$$", description: "Elite specialist" },
];
