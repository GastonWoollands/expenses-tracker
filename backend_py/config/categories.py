"""
Category configuration with IDs for robust data management
"""

from typing import Dict, List, NamedTuple

class CategoryInfo(NamedTuple):
    id: str
    name: str
    description: str

# Simplified category mapping - merged similar categories for better UX
# Core categories (default selected) - cat_001 to cat_013
# Additional categories (unselected by default) - cat_014 onwards
CATEGORIES: Dict[str, CategoryInfo] = {
    # === CORE CATEGORIES (DEFAULT SELECTED) ===
    "food": CategoryInfo("cat_001", "Food", "groceries, dining out, coffee, alcohol, etc."),
    "subscription": CategoryInfo("cat_002", "Subscription", "Netflix, software, apps, etc."),
    "transport": CategoryInfo("cat_003", "Transport", "Uber, fuel, parking, public transport, etc."),
    "housing": CategoryInfo("cat_004", "Housing", "rent, mortgage, utilities, etc."),
    "services": CategoryInfo("cat_005", "Services", "electricity, water, internet, phone, etc."),
    "health": CategoryInfo("cat_006", "Health", "medical, dental, vision, fitness, pharmacy, etc."),
    "education": CategoryInfo("cat_007", "Education", "courses, books, training, etc."),
    "technology": CategoryInfo("cat_008", "Technology", "electronics, software, gadgets, etc."),
    "shopping": CategoryInfo("cat_009", "Shopping", "clothes, accessories, general purchases, etc."),
    "travel": CategoryInfo("cat_010", "Travel", "flights, hotels, activities, car rental, etc."),
    "bar_restaurant": CategoryInfo("cat_011", "Bar and restaurant", "bars, restaurants, cafes, etc."),
    "hobby": CategoryInfo("cat_012", "Hobby", "hobbies, entertainment, sports, gaming, etc."),
    "other": CategoryInfo("cat_013", "Other", "other expenses"),
    
    # === ADDITIONAL CATEGORIES (UNSELECTED BY DEFAULT) ===
    
    # Personal Care & Beauty (merged)
    "personal_care": CategoryInfo("cat_014", "Personal Care", "haircuts, skincare, beauty, spa, etc."),
    
    # Financial & Insurance (merged)
    "insurance": CategoryInfo("cat_015", "Insurance", "health, car, home, life insurance, etc."),
    "banking": CategoryInfo("cat_016", "Banking", "bank fees, ATM fees, investments, taxes, etc."),
    
    # Transportation (merged into transport - keeping for backward compatibility)
    "vehicle_maintenance": CategoryInfo("cat_017", "Vehicle Maintenance", "car repairs, maintenance, etc."),
    
    # Home & Living (merged)
    "home_improvement": CategoryInfo("cat_018", "Home Improvement", "furniture, appliances, renovations, cleaning, garden, etc."),
    
    # Entertainment & Media (merged)
    "entertainment": CategoryInfo("cat_019", "Entertainment", "movies, concerts, shows, gaming, books, music, etc."),
    
    # Work & Business (merged)
    "business": CategoryInfo("cat_020", "Business", "office supplies, business expenses, communication, software, etc."),
    
    # Family & Relationships (merged)
    "family": CategoryInfo("cat_021", "Family", "childcare, pets, gifts, charity, etc."),
    
    # Health & Wellness (merged into health - keeping for backward compatibility)
    "medical": CategoryInfo("cat_022", "Medical", "doctor visits, medical tests, prescriptions, etc."),
    "fitness": CategoryInfo("cat_023", "Fitness", "gym memberships, personal training, fitness classes, etc."),
    
    # Miscellaneous (merged)
    "legal": CategoryInfo("cat_024", "Legal", "lawyer fees, legal documents, notary, etc."),
    "emergency": CategoryInfo("cat_025", "Emergency", "emergency expenses, urgent repairs, etc."),
    "fees": CategoryInfo("cat_026", "Fees", "service fees, processing fees, late fees, etc."),
    "memberships": CategoryInfo("cat_027", "Memberships", "club memberships, professional associations, etc."),
}

def get_category_by_key(key: str) -> CategoryInfo:
    """Get category info by key"""
    return CATEGORIES.get(key, CATEGORIES["other"])

def get_category_by_id(category_id: str) -> CategoryInfo:
    """Get category info by ID"""
    for cat in CATEGORIES.values():
        if cat.id == category_id:
            return cat
    return CATEGORIES["other"]

def get_category_by_name(name: str) -> CategoryInfo:
    """Get category info by name"""
    for cat in CATEGORIES.values():
        if cat.name == name:
            return cat
    return CATEGORIES["other"]

def get_all_categories() -> List[CategoryInfo]:
    """Get all categories as list"""
    return list(CATEGORIES.values())

def get_category_keys() -> List[str]:
    """Get all category keys"""
    return list(CATEGORIES.keys())

def get_category_names() -> List[str]:
    """Get all category names"""
    return [cat.name for cat in CATEGORIES.values()]

def get_category_ids() -> List[str]:
    """Get all category IDs"""
    return [cat.id for cat in CATEGORIES.values()]

def get_core_categories() -> List[CategoryInfo]:
    """Get core categories (default selected) - cat_001 to cat_013"""
    return [cat for cat in CATEGORIES.values() if cat.id.startswith("cat_0") and int(cat.id.split("_")[1]) <= 13]

def get_additional_categories() -> List[CategoryInfo]:
    """Get additional categories (unselected by default) - cat_014 onwards"""
    return [cat for cat in CATEGORIES.values() if cat.id.startswith("cat_0") and int(cat.id.split("_")[1]) > 13]

def get_core_category_keys() -> List[str]:
    """Get core category keys (default selected)"""
    return [key for key, cat in CATEGORIES.items() if cat.id.startswith("cat_0") and int(cat.id.split("_")[1]) <= 13]

def get_additional_category_keys() -> List[str]:
    """Get additional category keys (unselected by default)"""
    return [key for key, cat in CATEGORIES.items() if cat.id.startswith("cat_0") and int(cat.id.split("_")[1]) > 13]
