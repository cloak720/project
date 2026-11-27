import React from "react";
import {
  Apple,
  BookOpen,
  Car,
  CircleDot,
  Coffee,
  HeartHandshake,
  Leaf,
  Pill,
  ShoppingBasket,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const CATEGORY_ICONS = {
  Groceries: ShoppingBasket,
  Medical: Pill,
  Transport: Car,
  Household: Wrench,
  Companionship: Coffee,
  Community: Users,
  Environment: Leaf,
  Education: BookOpen,
  "Elderly care": HeartHandshake,
  "Food drive": Apple,
};

/** Icon for a request or opportunity category; unknown categories get a neutral dot. */
export const categoryIcon = (category) => CATEGORY_ICONS[category] || (category ? CircleDot : Sparkles);

export const CategoryTag = ({ category }) => {
  const Icon = categoryIcon(category);
  return (
    <span className="badge">
      <Icon size={12} aria-hidden="true" />
      {category || "General"}
    </span>
  );
};
