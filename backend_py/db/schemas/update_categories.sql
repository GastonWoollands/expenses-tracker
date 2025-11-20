-- =============================================
-- Update Categories with All 65 Categories
-- =============================================
-- This script updates the categories table with all 65 comprehensive categories
-- Run this in your Supabase SQL Editor

-- First, clear existing categories (if you want to start fresh)
-- DELETE FROM categories;

-- Insert all 65 categories with proper sort order
-- Core categories (default selected) - sort_order 1-13
-- Additional categories (unselected by default) - sort_order 14+
INSERT INTO categories (key, name, description, icon, color, sort_order) VALUES
-- === CORE CATEGORIES (DEFAULT SELECTED) ===
('food', 'Food', 'groceries, supermarket, etc.', 'food', '#FF6B6B', 1),
('subscription', 'Subscription', 'Netflix, Cursor, etc.', 'subscription', '#4ECDC4', 2),
('transport', 'Transport', 'Uber, train, bus, Bike, Bicing, etc.', 'transport', '#45B7D1', 3),
('housing', 'Housing', 'rent, mortgage, etc.', 'housing', '#96CEB4', 4),
('services', 'Services', 'electricity, water, internet, etc.', 'services', '#FFEAA7', 5),
('health', 'Health', 'gym, yoga, pharmacy, etc.', 'health', '#DDA0DD', 6),
('education', 'Education', 'courses, etc.', 'education', '#98D8C8', 7),
('technology', 'Technology', 'expenses in technology, etc.', 'technology', '#F7DC6F', 8),
('shopping', 'Shopping', 'Amazon, clothes, accessories, etc.', 'shopping', '#BB8FCE', 9),
('travel', 'Travel', 'flights, hotels, etc.', 'travel', '#85C1E9', 10),
('bar_restaurant', 'Bar and restaurant', 'bars, restaurants, cafes, etc.', 'restaurant', '#F8C471', 11),
('hobby', 'Hobby', 'hobbies, socials, etc.', 'hobby', '#82E0AA', 12),
('other', 'Other', 'other expenses', 'other', '#D5DBDB', 13),

-- === ADDITIONAL CATEGORIES (UNSELECTED BY DEFAULT) ===
-- Personal Care & Beauty
('personal_care', 'Personal Care', 'haircuts, skincare, cosmetics, spa, etc.', 'user', '#FFB6C1', 14),
('beauty', 'Beauty', 'makeup, skincare products, salon visits, etc.', 'sparkles', '#FF69B4', 15),

-- Financial & Insurance
('insurance', 'Insurance', 'health, car, home, life insurance, etc.', 'shield', '#32CD32', 16),
('banking', 'Banking', 'bank fees, ATM fees, wire transfers, etc.', 'credit-card', '#4169E1', 17),
('investments', 'Investments', 'stocks, bonds, crypto, investment fees, etc.', 'trending-up', '#00CED1', 18),
('taxes', 'Taxes', 'income tax, property tax, business tax, etc.', 'file-text', '#DC143C', 19),

-- Transportation (Detailed)
('fuel', 'Fuel', 'gas, diesel, electric charging, etc.', 'fuel', '#FFD700', 20),
('vehicle_maintenance', 'Vehicle Maintenance', 'car repairs, oil changes, tires, etc.', 'wrench', '#8B4513', 21),
('parking', 'Parking', 'parking fees, garage, street parking, etc.', 'square', '#696969', 22),
('public_transport', 'Public Transport', 'metro, bus, tram, ferry, etc.', 'bus', '#1E90FF', 23),

-- Home & Living
('furniture', 'Furniture', 'sofas, tables, chairs, home decor, etc.', 'home', '#DEB887', 24),
('appliances', 'Appliances', 'refrigerator, washing machine, TV, etc.', 'tv', '#A0522D', 25),
('home_improvement', 'Home Improvement', 'renovations, repairs, tools, etc.', 'hammer', '#CD853F', 26),
('cleaning', 'Cleaning', 'cleaning supplies, housekeeping, laundry, etc.', 'spray', '#F0E68C', 27),
('garden', 'Garden', 'plants, gardening tools, landscaping, etc.', 'leaf', '#90EE90', 28),

-- Entertainment & Media
('entertainment', 'Entertainment', 'movies, concerts, shows, events, etc.', 'film', '#FF1493', 29),
('gaming', 'Gaming', 'video games, gaming equipment, subscriptions, etc.', 'gamepad2', '#9370DB', 30),
('books', 'Books', 'books, e-books, magazines, newspapers, etc.', 'book', '#8B008B', 31),
('music', 'Music', 'music streaming, concerts, instruments, etc.', 'music', '#FF4500', 32),
('sports', 'Sports', 'sports equipment, gym memberships, sports events, etc.', 'trophy', '#FF6347', 33),

-- Work & Business
('office', 'Office', 'office supplies, equipment, workspace, etc.', 'briefcase', '#2E8B57', 34),
('business', 'Business', 'business expenses, professional services, etc.', 'building', '#4682B4', 35),
('communication', 'Communication', 'phone bills, internet, postage, etc.', 'phone', '#20B2AA', 36),
('software', 'Software', 'software licenses, apps, productivity tools, etc.', 'code', '#6A5ACD', 37),

-- Family & Relationships
('childcare', 'Childcare', 'babysitting, daycare, school supplies, etc.', 'baby', '#FFB6C1', 38),
('pets', 'Pets', 'pet food, vet bills, pet supplies, grooming, etc.', 'heart', '#FF69B4', 39),
('gifts', 'Gifts', 'birthday gifts, holiday gifts, donations, etc.', 'gift', '#FFD700', 40),
('charity', 'Charity', 'donations, charity events, fundraising, etc.', 'heart-handshake', '#DC143C', 41),

-- Health & Wellness (Detailed)
('medical', 'Medical', 'doctor visits, medical tests, prescriptions, etc.', 'stethoscope', '#FF0000', 42),
('dental', 'Dental', 'dental checkups, treatments, orthodontics, etc.', 'smile', '#FFFFFF', 43),
('vision', 'Vision', 'eye exams, glasses, contact lenses, etc.', 'eye', '#0000FF', 44),
('mental_health', 'Mental Health', 'therapy, counseling, mental health apps, etc.', 'brain', '#800080', 45),
('fitness', 'Fitness', 'gym memberships, personal training, fitness classes, etc.', 'dumbbell', '#00FF00', 46),

-- Food & Dining (Detailed)
('groceries', 'Groceries', 'supermarket shopping, food delivery, etc.', 'shopping-cart', '#32CD32', 47),
('dining_out', 'Dining Out', 'restaurants, cafes, food trucks, etc.', 'utensils', '#FF8C00', 48),
('coffee', 'Coffee', 'coffee shops, coffee beans, coffee equipment, etc.', 'coffee', '#8B4513', 49),
('alcohol', 'Alcohol', 'wine, beer, spirits, bars, etc.', 'wine', '#800000', 50),

-- Travel & Leisure (Detailed)
('accommodation', 'Accommodation', 'hotels, Airbnb, hostels, etc.', 'bed', '#4169E1', 51),
('flights', 'Flights', 'airline tickets, baggage fees, etc.', 'plane', '#87CEEB', 52),
('car_rental', 'Car Rental', 'rental cars, car sharing, etc.', 'car', '#B0C4DE', 53),
('activities', 'Activities', 'tours, attractions, adventure activities, etc.', 'map', '#FFA500', 54),

-- Utilities & Services (Detailed)
('electricity', 'Electricity', 'electric bills, power consumption, etc.', 'zap', '#FFFF00', 55),
('water', 'Water', 'water bills, water delivery, etc.', 'droplet', '#00BFFF', 56),
('gas', 'Gas', 'natural gas, propane, heating, etc.', 'flame', '#FF4500', 57),
('internet', 'Internet', 'internet service, WiFi, data plans, etc.', 'wifi', '#0000FF', 58),
('phone', 'Phone', 'mobile phone bills, landline, etc.', 'phone', '#32CD32', 59),
('cable', 'Cable', 'cable TV, satellite, streaming services, etc.', 'tv', '#696969', 60),

-- Miscellaneous
('legal', 'Legal', 'lawyer fees, legal documents, notary, etc.', 'scale', '#800080', 61),
('emergency', 'Emergency', 'emergency expenses, urgent repairs, etc.', 'alert-triangle', '#FF0000', 62),
('fees', 'Fees', 'service fees, processing fees, late fees, etc.', 'receipt', '#808080', 63),
('memberships', 'Memberships', 'club memberships, professional associations, etc.', 'users', '#4B0082', 64),
('subscriptions_other', 'Other Subscriptions', 'newsletters, premium content, etc.', 'mail', '#FF1493', 65)

-- Handle conflicts by updating existing records
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- =============================================
-- Verification
-- =============================================

-- Check that all categories are inserted
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN sort_order <= 13 THEN 1 END) as core_categories,
    COUNT(CASE WHEN sort_order > 13 THEN 1 END) as additional_categories
FROM categories 
WHERE is_active = true;

-- Show all categories ordered by sort_order
SELECT 
    sort_order,
    key,
    name,
    description,
    CASE 
        WHEN sort_order <= 13 THEN 'Core (Default Selected)'
        ELSE 'Additional (Unselected by Default)'
    END as category_type
FROM categories 
WHERE is_active = true
ORDER BY sort_order;
