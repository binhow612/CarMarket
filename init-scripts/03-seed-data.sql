-- CarMarket Seed Data
-- This script populates the database with initial metadata and sample data

-- ========================================
-- CAR MAKES DATA
-- ========================================
INSERT INTO car_makes (name, "displayName", "logoUrl", "sortOrder") VALUES
('toyota', 'Toyota', 'https://logos-world.net/wp-content/uploads/2020/05/Toyota-Logo.png', 1),
('honda', 'Honda', 'https://logos-world.net/wp-content/uploads/2020/05/Honda-Logo.png', 2),
('ford', 'Ford', 'https://logos-world.net/wp-content/uploads/2020/05/Ford-Logo.png', 3),
('chevrolet', 'Chevrolet', 'https://logos-world.net/wp-content/uploads/2020/05/Chevrolet-Logo.png', 4),
('bmw', 'BMW', 'https://logos-world.net/wp-content/uploads/2020/05/BMW-Logo.png', 5),
('mercedes-benz', 'Mercedes-Benz', 'https://logos-world.net/wp-content/uploads/2020/05/Mercedes-Benz-Logo.png', 6),
('audi', 'Audi', 'https://logos-world.net/wp-content/uploads/2020/05/Audi-Logo.png', 7),
('nissan', 'Nissan', 'https://logos-world.net/wp-content/uploads/2020/05/Nissan-Logo.png', 8),
('hyundai', 'Hyundai', 'https://logos-world.net/wp-content/uploads/2020/05/Hyundai-Logo.png', 9),
('kia', 'Kia', 'https://logos-world.net/wp-content/uploads/2020/05/Kia-Logo.png', 10),
('mazda', 'Mazda', 'https://logos-world.net/wp-content/uploads/2020/05/Mazda-Logo.png', 11),
('subaru', 'Subaru', 'https://logos-world.net/wp-content/uploads/2020/05/Subaru-Logo.png', 12),
('volkswagen', 'Volkswagen', 'https://logos-world.net/wp-content/uploads/2020/05/Volkswagen-Logo.png', 13),
('lexus', 'Lexus', 'https://logos-world.net/wp-content/uploads/2020/05/Lexus-Logo.png', 14),
('infiniti', 'Infiniti', 'https://logos-world.net/wp-content/uploads/2020/05/Infiniti-Logo.png', 15);

-- ========================================
-- CAR MODELS DATA
-- ========================================
INSERT INTO car_models (name, "displayName", "makeId", "bodyStyles", "defaultBodyStyle", "sortOrder") VALUES
-- Toyota Models
('camry', 'Camry', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['sedan'], 'sedan', 1),
('corolla', 'Corolla', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['sedan', 'hatchback'], 'sedan', 2),
('rav4', 'RAV4', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['suv'], 'suv', 3),
('highlander', 'Highlander', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['suv'], 'suv', 4),
('tacoma', 'Tacoma', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['pickup'], 'pickup', 5),
('prius', 'Prius', (SELECT id FROM car_makes WHERE name = 'toyota'), ARRAY['hatchback'], 'hatchback', 6),

-- Honda Models
('accord', 'Accord', (SELECT id FROM car_makes WHERE name = 'honda'), ARRAY['sedan'], 'sedan', 1),
('civic', 'Civic', (SELECT id FROM car_makes WHERE name = 'honda'), ARRAY['sedan', 'hatchback'], 'sedan', 2),
('cr-v', 'CR-V', (SELECT id FROM car_makes WHERE name = 'honda'), ARRAY['suv'], 'suv', 3),
('pilot', 'Pilot', (SELECT id FROM car_makes WHERE name = 'honda'), ARRAY['suv'], 'suv', 4),
('fit', 'Fit', (SELECT id FROM car_makes WHERE name = 'honda'), ARRAY['hatchback'], 'hatchback', 5),

-- Ford Models
('f-150', 'F-150', (SELECT id FROM car_makes WHERE name = 'ford'), ARRAY['pickup'], 'pickup', 1),
('explorer', 'Explorer', (SELECT id FROM car_makes WHERE name = 'ford'), ARRAY['suv'], 'suv', 2),
('escape', 'Escape', (SELECT id FROM car_makes WHERE name = 'ford'), ARRAY['suv'], 'suv', 3),
('mustang', 'Mustang', (SELECT id FROM car_makes WHERE name = 'ford'), ARRAY['coupe', 'convertible'], 'coupe', 4),
('focus', 'Focus', (SELECT id FROM car_makes WHERE name = 'ford'), ARRAY['sedan', 'hatchback'], 'sedan', 5),

-- BMW Models
('3-series', '3 Series', (SELECT id FROM car_makes WHERE name = 'bmw'), ARRAY['sedan'], 'sedan', 1),
('5-series', '5 Series', (SELECT id FROM car_makes WHERE name = 'bmw'), ARRAY['sedan'], 'sedan', 2),
('x3', 'X3', (SELECT id FROM car_makes WHERE name = 'bmw'), ARRAY['suv'], 'suv', 3),
('x5', 'X5', (SELECT id FROM car_makes WHERE name = 'bmw'), ARRAY['suv'], 'suv', 4),
('i3', 'i3', (SELECT id FROM car_makes WHERE name = 'bmw'), ARRAY['hatchback'], 'hatchback', 5);

-- ========================================
-- CAR METADATA DATA
-- ========================================

-- Fuel Types
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('fuel_type', 'petrol', 'Petrol', 1),
('fuel_type', 'diesel', 'Diesel', 2),
('fuel_type', 'electric', 'Electric', 3),
('fuel_type', 'hybrid', 'Hybrid', 4),
('fuel_type', 'lpg', 'LPG', 5),
('fuel_type', 'cng', 'CNG', 6);

-- Transmission Types
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('transmission_type', 'manual', 'Manual', 1),
('transmission_type', 'automatic', 'Automatic', 2),
('transmission_type', 'cvt', 'CVT', 3),
('transmission_type', 'semi_automatic', 'Semi-Automatic', 4);

-- Body Types
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('body_type', 'sedan', 'Sedan', 1),
('body_type', 'hatchback', 'Hatchback', 2),
('body_type', 'suv', 'SUV', 3),
('body_type', 'coupe', 'Coupe', 4),
('body_type', 'convertible', 'Convertible', 5),
('body_type', 'wagon', 'Wagon', 6),
('body_type', 'pickup', 'Pickup Truck', 7),
('body_type', 'van', 'Van', 8),
('body_type', 'minivan', 'Minivan', 9);

-- Car Conditions
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('condition', 'excellent', 'Excellent', 1),
('condition', 'very_good', 'Very Good', 2),
('condition', 'good', 'Good', 3),
('condition', 'fair', 'Fair', 4),
('condition', 'poor', 'Poor', 5);

-- Price Types
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('price_type', 'fixed', 'Fixed Price', 1),
('price_type', 'negotiable', 'Negotiable', 2),
('price_type', 'auction', 'Auction', 3);

-- Car Features
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('car_feature', 'air_conditioning', 'Air Conditioning', 1),
('car_feature', 'power_steering', 'Power Steering', 2),
('car_feature', 'power_windows', 'Power Windows', 3),
('car_feature', 'power_locks', 'Power Locks', 4),
('car_feature', 'cruise_control', 'Cruise Control', 5),
('car_feature', 'gps_navigation', 'GPS Navigation', 6),
('car_feature', 'bluetooth', 'Bluetooth', 7),
('car_feature', 'usb_port', 'USB Port', 8),
('car_feature', 'aux_input', 'AUX Input', 9),
('car_feature', 'heated_seats', 'Heated Seats', 10),
('car_feature', 'leather_seats', 'Leather Seats', 11),
('car_feature', 'sunroof', 'Sunroof', 12),
('car_feature', 'backup_camera', 'Backup Camera', 13),
('car_feature', 'parking_sensors', 'Parking Sensors', 14),
('car_feature', 'blind_spot_monitor', 'Blind Spot Monitor', 15),
('car_feature', 'lane_departure_warning', 'Lane Departure Warning', 16),
('car_feature', 'adaptive_cruise_control', 'Adaptive Cruise Control', 17),
('car_feature', 'automatic_emergency_braking', 'Automatic Emergency Braking', 18),
('car_feature', 'keyless_entry', 'Keyless Entry', 19),
('car_feature', 'remote_start', 'Remote Start', 20),
('car_feature', 'all_wheel_drive', 'All Wheel Drive', 21),
('car_feature', 'four_wheel_drive', 'Four Wheel Drive', 22),
('car_feature', 'tow_package', 'Tow Package', 23),
('car_feature', 'third_row_seating', 'Third Row Seating', 24),
('car_feature', 'cargo_area', 'Cargo Area', 25);

-- Colors
INSERT INTO car_metadata (type, value, "displayValue", "sortOrder") VALUES
('color', 'white', 'White', 1),
('color', 'black', 'Black', 2),
('color', 'silver', 'Silver', 3),
('color', 'gray', 'Gray', 4),
('color', 'red', 'Red', 5),
('color', 'blue', 'Blue', 6),
('color', 'green', 'Green', 7),
('color', 'brown', 'Brown', 8),
('color', 'beige', 'Beige', 9),
('color', 'gold', 'Gold', 10),
('color', 'yellow', 'Yellow', 11),
('color', 'orange', 'Orange', 12),
('color', 'purple', 'Purple', 13),
('color', 'maroon', 'Maroon', 14),
('color', 'turquoise', 'Turquoise', 15);

-- ========================================
-- SAMPLE USERS (for testing)
-- All passwords: admin123
-- ========================================
INSERT INTO users (email, password, "firstName", "lastName", "phoneNumber", role, "isEmailVerified") VALUES
('admin@carmarket.com', '$2b$12$5HYF4Zel97OFRi5w2BvB9eC.skTB0qCZ5GKaIm26zATcENWGRXThG', 'Admin', 'User', '+1234567890', 'admin', true),
('john.doe@example.com', '$2b$12$5HYF4Zel97OFRi5w2BvB9eC.skTB0qCZ5GKaIm26zATcENWGRXThG', 'John', 'Doe', '+1234567891', 'user', true),
('jane.smith@example.com', '$2b$12$5HYF4Zel97OFRi5w2BvB9eC.skTB0qCZ5GKaIm26zATcENWGRXThG', 'Jane', 'Smith', '+1234567892', 'user', true),
('bob.wilson@example.com', '$2b$12$5HYF4Zel97OFRi5w2BvB9eC.skTB0qCZ5GKaIm26zATcENWGRXThG', 'Bob', 'Wilson', '+1234567893', 'user', true);

-- ========================================
-- SAMPLE CAR DETAILS
-- ========================================
INSERT INTO car_details (make, model, year, "bodyType", "fuelType", transmission, "engineSize", "enginePower", mileage, color, "numberOfDoors", "numberOfSeats", condition, vin, "registrationNumber", "previousOwners", "hasAccidentHistory", "hasServiceHistory", description, features) VALUES
('toyota', 'camry', 2020, 'sedan', 'petrol', 'automatic', 2.5, 203, 25000, 'white', 4, 5, 'excellent', '1HGBH41JXMN109186', 'ABC123', 1, false, true, 'Well-maintained Toyota Camry with full service history. Excellent condition both inside and out.', ARRAY['air_conditioning', 'power_steering', 'power_windows', 'cruise_control', 'gps_navigation', 'bluetooth', 'backup_camera']),
('honda', 'civic', 2019, 'sedan', 'petrol', 'manual', 1.5, 158, 35000, 'black', 4, 5, 'very_good', '2HGBH41JXMN109187', 'DEF456', 2, false, true, 'Reliable Honda Civic with good fuel economy. Some minor wear but mechanically sound.', ARRAY['air_conditioning', 'power_steering', 'power_windows', 'bluetooth', 'usb_port']),
('ford', 'f-150', 2021, 'pickup', 'petrol', 'automatic', 3.5, 400, 15000, 'silver', 4, 5, 'excellent', '3HGBH41JXMN109188', 'GHI789', 1, false, true, 'Powerful Ford F-150 with towing package. Perfect for work or recreation.', ARRAY['air_conditioning', 'power_steering', 'power_windows', 'cruise_control', 'gps_navigation', 'bluetooth', 'backup_camera', 'tow_package', 'four_wheel_drive']),
('bmw', '3-series', 2018, 'sedan', 'petrol', 'automatic', 2.0, 248, 45000, 'blue', 4, 5, 'good', '4HGBH41JXMN109189', 'JKL012', 2, false, true, 'Luxury BMW 3-series with premium features. Well-cared for with regular maintenance.', ARRAY['air_conditioning', 'power_steering', 'power_windows', 'cruise_control', 'gps_navigation', 'bluetooth', 'leather_seats', 'sunroof', 'backup_camera', 'parking_sensors']);

-- ========================================
-- SAMPLE LISTING DETAILS
-- ========================================
INSERT INTO listing_details (title, description, price, "priceType", status, location, city, state, country, "postalCode", "sellerId", "carDetailId", "isFeatured") VALUES
('2020 Toyota Camry - Excellent Condition', 'Beautiful Toyota Camry in excellent condition with full service history. Perfect family car with all modern features.', 25000.00, 'negotiable', 'approved', '123 Main St, Anytown, USA', 'Anytown', 'CA', 'USA', '90210', (SELECT id FROM users WHERE email = 'john.doe@example.com'), (SELECT id FROM car_details WHERE vin = '1HGBH41JXMN109186'), true),
('2019 Honda Civic - Great Value', 'Reliable Honda Civic with excellent fuel economy. Perfect for daily commuting. Well-maintained with service records.', 18500.00, 'fixed', 'approved', '456 Oak Ave, Somewhere, USA', 'Somewhere', 'NY', 'USA', '10001', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), (SELECT id FROM car_details WHERE vin = '2HGBH41JXMN109187'), false),
('2021 Ford F-150 - Work Ready', 'Powerful Ford F-150 with towing package. Perfect for work or recreation. Low mileage and excellent condition.', 42000.00, 'negotiable', 'approved', '789 Pine St, Nowhere, USA', 'Nowhere', 'TX', 'USA', '75001', (SELECT id FROM users WHERE email = 'bob.wilson@example.com'), (SELECT id FROM car_details WHERE vin = '3HGBH41JXMN109188'), true),
('2018 BMW 3-Series - Luxury Sedan', 'Luxury BMW 3-series with premium features. Well-cared for with regular maintenance. Perfect for those who appreciate quality.', 32000.00, 'negotiable', 'pending', '321 Elm St, Everywhere, USA', 'Everywhere', 'FL', 'USA', '33101', (SELECT id FROM users WHERE email = 'john.doe@example.com'), (SELECT id FROM car_details WHERE vin = '4HGBH41JXMN109189'), false);

-- ========================================
-- SAMPLE CAR IMAGES
-- ========================================
INSERT INTO car_images (filename, "originalName", url, type, "sortOrder", "isPrimary", "carDetailId") VALUES
('camry_front.jpg', 'toyota_camry_front.jpg', '/uploads/cars/camry_front.jpg', 'exterior', 1, true, (SELECT id FROM car_details WHERE vin = '1HGBH41JXMN109186')),
('camry_side.jpg', 'toyota_camry_side.jpg', '/uploads/cars/camry_side.jpg', 'exterior', 2, false, (SELECT id FROM car_details WHERE vin = '1HGBH41JXMN109186')),
('camry_interior.jpg', 'toyota_camry_interior.jpg', '/uploads/cars/camry_interior.jpg', 'interior', 3, false, (SELECT id FROM car_details WHERE vin = '1HGBH41JXMN109186')),
('civic_front.jpg', 'honda_civic_front.jpg', '/uploads/cars/civic_front.jpg', 'exterior', 1, true, (SELECT id FROM car_details WHERE vin = '2HGBH41JXMN109187')),
('civic_interior.jpg', 'honda_civic_interior.jpg', '/uploads/cars/civic_interior.jpg', 'interior', 2, false, (SELECT id FROM car_details WHERE vin = '2HGBH41JXMN109187')),
('f150_front.jpg', 'ford_f150_front.jpg', '/uploads/cars/f150_front.jpg', 'exterior', 1, true, (SELECT id FROM car_details WHERE vin = '3HGBH41JXMN109188')),
('f150_bed.jpg', 'ford_f150_bed.jpg', '/uploads/cars/f150_bed.jpg', 'exterior', 2, false, (SELECT id FROM car_details WHERE vin = '3HGBH41JXMN109188')),
('bmw_front.jpg', 'bmw_3series_front.jpg', '/uploads/cars/bmw_front.jpg', 'exterior', 1, true, (SELECT id FROM car_details WHERE vin = '4HGBH41JXMN109189')),
('bmw_interior.jpg', 'bmw_3series_interior.jpg', '/uploads/cars/bmw_interior.jpg', 'interior', 2, false, (SELECT id FROM car_details WHERE vin = '4HGBH41JXMN109189'));

-- ========================================
-- SAMPLE ACTIVITY LOGS
-- ========================================
INSERT INTO activity_logs (level, category, message, description, "userId", "createdAt") VALUES
('info', 'user_action', 'User registered successfully', 'New user account created', (SELECT id FROM users WHERE email = 'john.doe@example.com'), NOW() - INTERVAL '30 days'),
('info', 'listing_action', 'Listing created', 'New car listing posted', (SELECT id FROM users WHERE email = 'john.doe@example.com'), NOW() - INTERVAL '25 days'),
('info', 'admin_action', 'Listing approved', 'Car listing approved by admin', (SELECT id FROM users WHERE email = 'admin@carmarket.com'), NOW() - INTERVAL '24 days'),
('info', 'user_action', 'User registered successfully', 'New user account created', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), NOW() - INTERVAL '20 days'),
('info', 'listing_action', 'Listing created', 'New car listing posted', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), NOW() - INTERVAL '15 days'),
('info', 'admin_action', 'Listing approved', 'Car listing approved by admin', (SELECT id FROM users WHERE email = 'admin@carmarket.com'), NOW() - INTERVAL '14 days'),
('info', 'user_action', 'User registered successfully', 'New user account created', (SELECT id FROM users WHERE email = 'bob.wilson@example.com'), NOW() - INTERVAL '10 days'),
('info', 'listing_action', 'Listing created', 'New car listing posted', (SELECT id FROM users WHERE email = 'bob.wilson@example.com'), NOW() - INTERVAL '8 days'),
('info', 'admin_action', 'Listing approved', 'Car listing approved by admin', (SELECT id FROM users WHERE email = 'admin@carmarket.com'), NOW() - INTERVAL '7 days'),
('info', 'listing_action', 'Listing created', 'New car listing posted', (SELECT id FROM users WHERE email = 'john.doe@example.com'), NOW() - INTERVAL '2 days');

COMMIT;
