/**
 * Default expense categories for UX, analytics, and LLM context
 */

export type ExpenseCategory = {
  key: string;
  id: string;
  label: string;
  description: string;
};

// Core categories (default selected) - cat_001 to cat_013
export const CORE_CATEGORIES: ExpenseCategory[] = [
  { key: 'food', id: 'cat_001', label: 'Food', description: 'groceries, dining out, coffee, alcohol, etc.' },
  { key: 'subscription', id: 'cat_002', label: 'Subscription', description: 'Netflix, software, apps, etc.' },
  { key: 'transport', id: 'cat_003', label: 'Transport', description: 'Uber, fuel, parking, public transport, etc.' },
  { key: 'housing', id: 'cat_004', label: 'Housing', description: 'rent, mortgage, utilities, etc.' },
  { key: 'services', id: 'cat_005', label: 'Services', description: 'electricity, water, internet, phone, etc.' },
  { key: 'health', id: 'cat_006', label: 'Health', description: 'medical, dental, vision, fitness, pharmacy, etc.' },
  { key: 'education', id: 'cat_007', label: 'Education', description: 'courses, books, training, etc.' },
  { key: 'technology', id: 'cat_008', label: 'Technology', description: 'electronics, software, gadgets, etc.' },
  { key: 'shopping', id: 'cat_009', label: 'Shopping', description: 'clothes, accessories, general purchases, etc.' },
  { key: 'travel', id: 'cat_010', label: 'Travel', description: 'flights, hotels, activities, car rental, etc.' },
  { key: 'bar_restaurant', id: 'cat_011', label: 'Bar and restaurant', description: 'bars, restaurants, cafes, etc.' },
  { key: 'hobby', id: 'cat_012', label: 'Hobby', description: 'hobbies, entertainment, sports, gaming, etc.' },
  { key: 'other', id: 'cat_013', label: 'Other', description: 'other expenses' },
];

// Additional categories (unselected by default) - cat_014 onwards
export const ADDITIONAL_CATEGORIES: ExpenseCategory[] = [
  // Personal Care & Beauty (merged)
  { key: 'personal_care', id: 'cat_014', label: 'Personal Care', description: 'haircuts, skincare, beauty, spa, etc.' },
  
  // Financial & Insurance (merged)
  { key: 'insurance', id: 'cat_015', label: 'Insurance', description: 'health, car, home, life insurance, etc.' },
  { key: 'banking', id: 'cat_016', label: 'Banking', description: 'bank fees, ATM fees, investments, taxes, etc.' },
  
  // Transportation (merged into transport - keeping for backward compatibility)
  { key: 'vehicle_maintenance', id: 'cat_017', label: 'Vehicle Maintenance', description: 'car repairs, maintenance, etc.' },
  
  // Home & Living (merged)
  { key: 'home_improvement', id: 'cat_018', label: 'Home Improvement', description: 'furniture, appliances, renovations, cleaning, garden, etc.' },
  
  // Entertainment & Media (merged)
  { key: 'entertainment', id: 'cat_019', label: 'Entertainment', description: 'movies, concerts, shows, gaming, books, music, etc.' },
  
  // Work & Business (merged)
  { key: 'business', id: 'cat_020', label: 'Business', description: 'office supplies, business expenses, communication, software, etc.' },
  
  // Family & Relationships (merged)
  { key: 'family', id: 'cat_021', label: 'Family', description: 'childcare, pets, gifts, charity, etc.' },
  
  // Health & Wellness (merged into health - keeping for backward compatibility)
  { key: 'medical', id: 'cat_022', label: 'Medical', description: 'doctor visits, medical tests, prescriptions, etc.' },
  { key: 'fitness', id: 'cat_023', label: 'Fitness', description: 'gym memberships, personal training, fitness classes, etc.' },
  
  // Miscellaneous (merged)
  { key: 'legal', id: 'cat_024', label: 'Legal', description: 'lawyer fees, legal documents, notary, etc.' },
  { key: 'emergency', id: 'cat_025', label: 'Emergency', description: 'emergency expenses, urgent repairs, etc.' },
  { key: 'fees', id: 'cat_026', label: 'Fees', description: 'service fees, processing fees, late fees, etc.' },
  { key: 'memberships', id: 'cat_027', label: 'Memberships', description: 'club memberships, professional associations, etc.' },
];

// All categories combined
export const ALL_CATEGORIES: ExpenseCategory[] = [...CORE_CATEGORIES, ...ADDITIONAL_CATEGORIES];

// Default categories (core categories for backward compatibility)
export const DEFAULT_CATEGORIES: ExpenseCategory[] = CORE_CATEGORIES;

export const CATEGORY_KEYS = DEFAULT_CATEGORIES.map(c => c.key);
export const CATEGORY_IDS = DEFAULT_CATEGORIES.map(c => c.id);


