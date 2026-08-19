import React from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  Apple,
  Milk,
  Carrot,
  Beef,
  Fish,
  Coffee,
  Egg,
  Utensils,
  Store,
  Package,
  Home,
  Sparkles,
  Heart,
  Star,
  Layers,
  Folder,
  Sun,
  Flame,
  Salad,
  Wine,
  CupSoda,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  apple: Apple,
  milk: Milk,
  carrot: Carrot,
  beef: Beef,
  fish: Fish,
  coffee: Coffee,
  egg: Egg,
  salad: Salad,
  utensils: Utensils,
  store: Store,
  package: Package,
  home: Home,
  sparkles: Sparkles,
  flame: Flame,
  wine: Wine,
  soda: CupSoda,
  heart: Heart,
  star: Star,
  layers: Layers,
  folder: Folder,
  sun: Sun,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const AVAILABLE_COLORS = [
  '#10b981', // Emerald (Produce/Green)
  '#06b6d4', // Cyan (Dairy/Fresh)
  '#f59e0b', // Amber (Bakery/Grains)
  '#f43f5e', // Rose (Meat/Seafood)
  '#f97316', // Orange (Pantry/Spices)
  '#8b5cf6', // Violet (Frozen/Desserts)
  '#3b82f6', // Blue (Beverages/Water)
  '#ec4899', // Pink (Snacks/Treats)
  '#6366f1', // Indigo (Household/Cleaners)
  '#14b8a6', // Teal (Deli & Prepared)
  '#ef4444', // Red (Specials/Urgent)
  '#64748b', // Slate (General)
];

interface IconRendererProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', style }) => {
  const IconComponent = ICON_MAP[name] || ShoppingCart;
  return <IconComponent className={className} style={style} />;
};
