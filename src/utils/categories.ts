
export const ITEM_CATEGORIES = [
  "Internet Services",
  "Phone Services", 
  "TV Services",
  "Security Services",
  "Equipment",
  "Installation",
  "Support & Maintenance",
  "Business Services",
  "Managed Services",
  "Other"
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
