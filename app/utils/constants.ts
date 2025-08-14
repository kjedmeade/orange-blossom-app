export const CATEGORY_VALUES = [
  "Creative",
  "Relaxing",
  "Mindful",
  "Energizing",
  "Restorative",
  "Social",
  "Financial",
  "Nourishing",
  "Organizing",
  "Learning",
  "Nature-based",
  "Reflective",
  "Playful",
  "Confidence-building",
  "Gratifying"
] as const;

export type CategoryValue = typeof CATEGORY_VALUES[number];

