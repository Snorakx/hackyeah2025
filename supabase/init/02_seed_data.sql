-- Seed data for products (Polish food database)
INSERT INTO public.products (name, brand, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sodium_per_100g, unit, is_global) VALUES
-- Dairy products
('Twaróg półtłusty', 'Mlekovita', 133, 18.7, 4.7, 3.1, 0, 0.1, 'g', true),
('Ser żółty Gouda', 'Mlekovita', 356, 25.0, 27.0, 2.2, 0, 1.2, 'g', true),
('Mleko 2%', 'Mlekovita', 50, 3.4, 2.0, 4.8, 0, 0.05, 'ml', true),
('Jogurt naturalny', 'Danone', 59, 4.0, 3.3, 3.6, 0, 0.04, 'g', true),
('Serki wiejskie', 'Danone', 98, 11.0, 4.0, 3.0, 0, 0.08, 'g', true),

-- Meat products
('Kurczak pierś', 'Indykpol', 165, 31.0, 3.6, 0, 0, 0.07, 'g', true),
('Parówki', 'Krakus', 290, 12.0, 26.0, 2.0, 0, 1.1, 'g', true),
('Wołowina mielona', 'Mięsny', 250, 26.0, 15.0, 0, 0, 0.08, 'g', true),
('Łosoś', 'Morski', 208, 25.0, 12.0, 0, 0, 0.09, 'g', true),
('Jajko', 'Ferma', 155, 13.0, 11.0, 1.1, 0, 0.12, 'piece', true),

-- Grains and pasta
('Makaron spaghetti', 'Lubella', 371, 13.0, 1.5, 75.0, 3.0, 0.003, 'g', true),
('Ryż biały', 'Kupiec', 360, 7.0, 0.7, 79.0, 2.8, 0.001, 'g', true),
('Owsianka', 'Kupiec', 389, 16.9, 6.9, 66.3, 10.6, 0.002, 'g', true),
('Chleb żytni', 'Piekarnia', 259, 8.5, 3.2, 48.0, 5.8, 0.49, 'g', true),
('Bułka pszenna', 'Piekarnia', 265, 9.0, 3.2, 49.0, 2.7, 0.49, 'g', true),

-- Vegetables
('Pomidor', 'Warzywniak', 18, 0.9, 0.2, 3.9, 1.2, 0.005, 'g', true),
('Ogórek', 'Warzywniak', 16, 0.7, 0.1, 3.6, 0.5, 0.002, 'g', true),
('Marchew', 'Warzywniak', 41, 0.9, 0.2, 9.6, 2.8, 0.069, 'g', true),
('Brokuły', 'Warzywniak', 34, 2.8, 0.4, 7.0, 2.6, 0.033, 'g', true),
('Szpinak', 'Warzywniak', 23, 2.9, 0.4, 3.6, 2.2, 0.079, 'g', true),

-- Fruits
('Banan', 'Owocowy', 89, 1.1, 0.3, 22.8, 2.6, 0.001, 'g', true),
('Jabłko', 'Owocowy', 52, 0.3, 0.2, 13.8, 2.4, 0.001, 'g', true),
('Pomarańcza', 'Owocowy', 47, 0.9, 0.1, 11.8, 2.4, 0.001, 'g', true),
('Truskawki', 'Owocowy', 32, 0.7, 0.3, 7.7, 2.0, 0.001, 'g', true),
('Winogrona', 'Owocowy', 62, 0.6, 0.2, 16.0, 0.9, 0.002, 'g', true),

-- Nuts and seeds
('Orzechy włoskie', 'Bakaliowy', 654, 15.2, 65.2, 13.7, 6.7, 0.002, 'g', true),
('Migdały', 'Bakaliowy', 579, 21.2, 49.9, 21.7, 12.5, 0.001, 'g', true),
('Nasiona słonecznika', 'Bakaliowy', 584, 20.8, 51.5, 20.0, 8.6, 0.009, 'g', true),
('Pestki dyni', 'Bakaliowy', 559, 19.0, 49.0, 10.7, 18.4, 0.007, 'g', true),

-- Oils and fats
('Oliwa z oliwek', 'Extra Virgin', 884, 0, 100.0, 0, 0, 0, 'ml', true),
('Masło', 'Mlekovita', 717, 0.9, 81.0, 0.1, 0, 0.643, 'g', true),
('Olej rzepakowy', 'Kujawski', 884, 0, 100.0, 0, 0, 0, 'ml', true),

-- Beverages
('Woda', 'Żywiec', 0, 0, 0, 0, 0, 0.005, 'ml', true),
('Kawa czarna', 'Tchibo', 2, 0.3, 0, 0.3, 0, 0.005, 'ml', true),
('Herbata zielona', 'Lipton', 1, 0, 0, 0.2, 0, 0.003, 'ml', true),

-- Snacks and sweets
('Czekolada mleczna', 'Wedel', 545, 7.0, 30.0, 60.0, 3.0, 0.1, 'g', true),
('Chipsy ziemniaczane', 'Lay''s', 536, 6.0, 35.0, 53.0, 4.0, 0.5, 'g', true),
('Ciasteczka', 'Delicje', 450, 5.0, 20.0, 65.0, 2.0, 0.3, 'g', true),

-- Ready meals (presets)
('Kurczak z ryżem', 'Domowe', 350, 35.0, 8.0, 45.0, 3.0, 0.4, 'g', true),
('Makaron z sosem pomidorowym', 'Domowe', 280, 12.0, 4.0, 50.0, 4.0, 0.6, 'g', true),
('Sałatka z tuńczykiem', 'Domowe', 220, 25.0, 8.0, 15.0, 5.0, 0.5, 'g', true),
('Owsianka z bananem', 'Domowe', 320, 12.0, 8.0, 55.0, 8.0, 0.1, 'g', true),
('Kanapka z serem', 'Domowe', 280, 15.0, 12.0, 35.0, 3.0, 0.8, 'g', true);

-- Create some default user favorites (templates)
INSERT INTO public.user_favorites (user_id, name, type, meal_data, calories, protein, fat, carbs) VALUES
-- These will be populated when users create their favorites
-- Example template for quick breakfast
(gen_random_uuid(), 'Szybkie śniadanie', 'template', 
 '{"items": [{"product_name": "Owsianka", "quantity": 50}, {"product_name": "Banan", "quantity": 100}, {"product_name": "Mleko 2%", "quantity": 200}]}', 
 320, 12.0, 8.0, 55.0),

-- Example template for lunch
(gen_random_uuid(), 'Lunch do pracy', 'template',
 '{"items": [{"product_name": "Kurczak pierś", "quantity": 150}, {"product_name": "Ryż biały", "quantity": 100}, {"product_name": "Brokuły", "quantity": 100}]}',
 350, 35.0, 8.0, 45.0),

-- Example template for dinner
(gen_random_uuid(), 'Kolacja na szybko', 'template',
 '{"items": [{"product_name": "Twaróg półtłusty", "quantity": 200}, {"product_name": "Chleb żytni", "quantity": 50}, {"product_name": "Pomidor", "quantity": 100}]}',
 280, 25.0, 8.0, 35.0);
