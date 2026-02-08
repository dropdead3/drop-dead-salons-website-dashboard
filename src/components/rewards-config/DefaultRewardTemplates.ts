// Default reward templates for quick setup
export interface RewardTemplate {
  name: string;
  description: string;
  category: 'time_off' | 'recognition' | 'experience' | 'merchandise';
  points_cost: number;
  icon: string;
  is_featured?: boolean;
}

export const DEFAULT_REWARD_TEMPLATES: RewardTemplate[] = [
  // Time Off Category
  {
    name: 'Extra 15-Min Break',
    description: 'Take an additional 15-minute break during your shift',
    category: 'time_off',
    points_cost: 50,
    icon: 'coffee',
    is_featured: true,
  },
  {
    name: 'Leave 30 Min Early',
    description: 'Leave 30 minutes before your shift ends',
    category: 'time_off',
    points_cost: 100,
    icon: 'clock',
  },
  {
    name: 'Extended Lunch Hour',
    description: 'Extend your lunch break to a full hour',
    category: 'time_off',
    points_cost: 75,
    icon: 'utensils',
  },
  {
    name: 'Half Day Off',
    description: 'Take a half day off with pay',
    category: 'time_off',
    points_cost: 500,
    icon: 'sun',
    is_featured: true,
  },

  // Recognition Category
  {
    name: 'Parking Spot of the Week',
    description: 'Get the premium parking spot for one week',
    category: 'recognition',
    points_cost: 150,
    icon: 'car',
  },
  {
    name: 'Team Shoutout',
    description: 'Get featured in team announcements and celebrations',
    category: 'recognition',
    points_cost: 25,
    icon: 'megaphone',
  },
  {
    name: 'Wall of Fame Feature',
    description: 'Get featured on the Wall of Fame for a month',
    category: 'recognition',
    points_cost: 200,
    icon: 'star',
    is_featured: true,
  },

  // Experience Category
  {
    name: 'Lunch with Leadership',
    description: 'Enjoy a lunch outing with a manager of your choice',
    category: 'experience',
    points_cost: 300,
    icon: 'users',
  },
  {
    name: 'Training Choice',
    description: 'Pick your next training topic or course',
    category: 'experience',
    points_cost: 250,
    icon: 'graduation-cap',
  },
  {
    name: 'Priority Scheduling',
    description: 'First choice on schedule requests for one month',
    category: 'experience',
    points_cost: 400,
    icon: 'calendar',
    is_featured: true,
  },
  {
    name: 'VIP Client Assignment',
    description: 'Get assigned to a high-value new client',
    category: 'experience',
    points_cost: 350,
    icon: 'crown',
  },

  // Merchandise Category
  {
    name: 'Company Swag Item',
    description: 'Choose a branded t-shirt, mug, or other swag item',
    category: 'merchandise',
    points_cost: 100,
    icon: 'shirt',
  },
  {
    name: 'Gift Card ($25)',
    description: '$25 gift card to a popular retailer',
    category: 'merchandise',
    points_cost: 500,
    icon: 'credit-card',
    is_featured: true,
  },
  {
    name: 'Premium Product Bundle',
    description: 'A curated bundle of salon products',
    category: 'merchandise',
    points_cost: 750,
    icon: 'package',
  },
  {
    name: 'Tool Upgrade',
    description: 'Upgrade one of your professional tools',
    category: 'merchandise',
    points_cost: 1000,
    icon: 'scissors',
  },
];

export const REWARD_CATEGORIES = [
  { value: 'time_off', label: 'Time Off', icon: 'clock', color: '#22C55E' },
  { value: 'recognition', label: 'Recognition', icon: 'trophy', color: '#EAB308' },
  { value: 'experience', label: 'Experiences', icon: 'sparkles', color: '#8B5CF6' },
  { value: 'merchandise', label: 'Merchandise', icon: 'gift', color: '#3B82F6' },
] as const;

export const REWARD_ICONS = [
  'gift', 'trophy', 'star', 'coffee', 'clock', 'sun', 'car', 'megaphone',
  'users', 'graduation-cap', 'calendar', 'crown', 'shirt', 'credit-card',
  'package', 'scissors', 'heart', 'sparkles', 'zap', 'award', 'medal',
  'utensils', 'music', 'ticket', 'plane', 'home',
] as const;

export type RewardCategory = typeof REWARD_CATEGORIES[number]['value'];
export type RewardIcon = typeof REWARD_ICONS[number];
