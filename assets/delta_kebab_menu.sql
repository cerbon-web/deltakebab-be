-- Delta Kebab Database Schema and Data Initialization

-- Create Database
CREATE DATABASE IF NOT EXISTS delta_kebab_db;
USE delta_kebab_db;

-- Drop tables if they exist to allow clean re-runs
DROP TABLE IF EXISTS item_prices;
DROP TABLE IF EXISTS sizes;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS delivery_rules;
DROP TABLE IF EXISTS opening_hours;
DROP TABLE IF EXISTS restaurant_info;

-- ==========================================
-- 1. Create Core Structural Tables
-- ==========================================

CREATE TABLE restaurant_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    website VARCHAR(100),
    facebook VARCHAR(100),
    packaging_takeaway_fee DECIMAL(5,2),
    plastic_bag_fee DECIMAL(5,2)
);

CREATE TABLE opening_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_range VARCHAR(50) NOT NULL,
    open_time VARCHAR(20) NOT NULL
);

CREATE TABLE delivery_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    min_order_value DECIMAL(5,2),
    base_distance_km INT,
    base_cost DECIMAL(5,2),
    extra_km_cost DECIMAL(5,2),
    free_delivery_threshold DECIMAL(5,2)
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    ingredients TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE item_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    size_id INT NULL,
    price DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE SET NULL
);

-- ==========================================
-- 2. Populate Metadata & Restaurant Info
-- ==========================================

INSERT INTO restaurant_info (name, address, phone, website, facebook, packaging_takeaway_fee, plastic_bag_fee)
VALUES ('Delta Kebab', 'Tczew, ul. Jodłowa 11A', '739 659 985', 'www.deltakeb.pl', 'www.facebook.com/deltakebab', 1.50, 1.00);

INSERT INTO opening_hours (day_range, open_time) VALUES 
('PON-CZW', '10:00-24:00'),
('PT-SB', '10:00-2:00'),
('ND', '10:00-24:00');

INSERT INTO delivery_rules (min_order_value, base_distance_km, base_cost, extra_km_cost, free_delivery_threshold)
VALUES (40.00, 2, 5.00, 2.00, 200.00);

-- ==========================================
-- 3. Populate Categories
-- ==========================================

INSERT INTO categories (id, name) VALUES 
(1, 'Rollo'),
(2, 'Tortilla'),
(3, 'Talerz'),
(4, 'Box'),
(5, 'Bułka'),
(6, 'Kapsalon'),
(7, 'Kurczak'),
(8, 'Sałatki'),
(9, 'Dodatki'),
(10, 'Napoje');

-- ==========================================
-- 4. Populate Sizes
-- ==========================================

INSERT INTO sizes (id, name) VALUES 
(1, 'Małe / Mała / Mały'),
(2, 'Średnie / Średnia / Średni'),
(3, 'Mega / Duża / Duży'),
(4, '0.33L'),
(5, '0.5L');

-- ==========================================
-- 5. Populate Items and Item Prices
-- ==========================================

-- Category 1: Rollo
INSERT INTO items (id, category_id, name, ingredients) VALUES
(1, 1, 'ROLLO DELTA KEBAB', 'mięso, surówka, sosy'),
(2, 1, 'ROLLO DELTA KEBAB Z SEREM', 'mięso, ser, surówka, sosy'),
(3, 1, 'DELTA AMERYKAŃSKIE', 'mięso, frytki, sosy'),
(4, 1, 'ROLLO DELTA SAMO MIĘSO', 'mięso, sosy'),
(5, 1, 'SUPER ROLLO DELTA', 'mięso, ser, frytki, surówka, sosy'),
(6, 1, 'SZPINAK ROLLO DELTA', 'mięso, szpinak, ser, sosy'),
(7, 1, 'ROLLO WEGE', 'falafel, warzywa, sos'),
(8, 1, 'SUPER MEGA ROLLO AMERYKAŃSKIE', '2x mięso, ser, frytki, sosy'),
(9, 1, 'SUPER MEGA ROLLO Z SEREM', '2x mięso, ser, surówka, sosy'),
(10, 1, 'ROLLO DELTA GREKO', 'mięso, sałata lodowa, czerwona cebula, oliwki, ser sałatkowy, sos łagodny'),
(11, 1, 'ROLLO DELTA HOT SPICY', 'mięso, papryka mix, jalapeno, surówka, sos ostry'),
(12, 1, 'ROLLO WRAP', 'mięso, polędwiczki, sałata lodowa, pekińska, sosy');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(1, 1, 17.00), (1, 2, 24.00), (1, 3, 30.00),
(2, 1, 20.00), (2, 2, 26.00), (2, 3, 32.00),
(3, 1, 19.00), (3, 2, 25.00), (3, 3, 31.00),
(4, 1, 23.00), (4, 2, 30.00), (4, 3, 36.00),
(5, 1, 23.00), (5, 2, 30.00),
(6, 1, 23.00), (6, 2, 30.00),
(7, 1, 15.00), (7, 2, 20.00), (7, 3, 25.00),
(8, 3, 43.00),
(9, 3, 43.00),
(10, 1, 22.00), (10, 2, 28.00),
(11, 1, 22.00), (11, 2, 28.00),
(12, 1, 22.00), (12, 2, 28.00);

-- Category 2: Tortilla
INSERT INTO items (id, category_id, name, ingredients) VALUES
(13, 2, 'TORTILLA DELTA', 'mięso, surówka, ogórek, sosy'),
(14, 2, 'TORTILLA DELTA Z SEREM', 'mięso, ser, surówka, ogórek, sosy'),
(15, 2, 'TORTILLA AMERYKAŃSKA', 'mięso, frytki, sosy'),
(16, 2, 'TORTILLA SAMO MIĘSO', 'mięso, sosy');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(13, 1, 20.00), (13, 2, 26.00), (13, 3, 33.00),
(14, 1, 21.00), (14, 2, 27.00), (14, 3, 34.00),
(15, 1, 21.00), (15, 2, 27.00), (15, 3, 34.00),
(16, 1, 25.00), (16, 2, 30.00), (16, 3, 37.00);

-- Category 3: Talerz
INSERT INTO items (id, category_id, name, ingredients) VALUES
(17, 3, 'TALERZ KEBAB', 'mięso, warzywa, frytki, sosy'),
(18, 3, 'SUPER TALERZ', 'mięso, warzywa, ser, frytki, sosy'),
(19, 3, 'MEGA TALERZ', '2x mięso, warzywa, sosy + osobne frytki'),
(20, 3, 'TALERZ SAMO MIĘSO', 'mięso, frytki, sosy'),
(21, 3, 'TALERZ FALAFEL', 'falafela, warzywa, frytki, sosy');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(17, NULL, 29.00),
(18, NULL, 35.00),
(19, NULL, 43.00),
(20, NULL, 34.00),
(21, NULL, 22.00);

-- Category 4: Box
INSERT INTO items (id, category_id, name, ingredients) VALUES
(22, 4, 'KEBAB BOX', 'mięso, warzywa, frytki, sosy'),
(23, 4, 'BOX AMERYKAŃSKI', 'mięso, frytki, sosy'),
(24, 4, 'KIDS BOX', 'chicken nuggets 2 szt., chicken pops 4 szt., kulki warzywne 3 szt., frytki 80g, sos i napój');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(22, 1, 21.00), (22, 3, 27.00),
(23, 1, 24.00), (23, 3, 30.00),
(24, 1, 19.00);

-- Category 5: Bułka
INSERT INTO items (id, category_id, name, ingredients) VALUES
(25, 5, 'KEBAB W BUŁCE', 'bułka, mięso, warzywa, sosy'),
(26, 5, 'AMERYKAŃSKA', 'bułka, mięso, frytki, sosy'),
(27, 5, 'SUPER DELTA W BUŁCE', 'bułka, mięso, warzywa, ser, frytki, sosy'),
(28, 5, 'BUŁKA SAMO MIĘSO', 'bułka, mięso, sosy');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(25, 1, 22.00), (25, 2, 27.00), (25, 3, 34.00),
(26, 1, 24.00), (26, 2, 30.00), (26, 3, 37.00),
(27, 1, 27.00), (27, 2, 32.00), (27, 3, 39.00),
(28, 1, 28.00), (28, 2, 36.00);

-- Category 6: Kapsalon
INSERT INTO items (id, category_id, name, ingredients) VALUES
(29, 6, 'KAPSALON', 'mięso, warzywa, pomidor, ogórek, frytki, ser, sos');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(29, NULL, 31.00);

-- Category 7: Kurczak
INSERT INTO items (id, category_id, name, ingredients) VALUES
(30, 7, 'DELTOPYCHA', 'polędwiczki z kurczaka 2 szt., popsy z kurczaka 10 szt., frytki, sos'),
(31, 7, 'CHICKEN STRIPS', 'polędwiczki z kurczaka 4 szt., frytki, sos'),
(32, 7, 'CHICKEN POPS', 'kawałki kurczaka w panierce ryżowej 10 szt., frytki, sos');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(30, NULL, 26.00),
(31, NULL, 24.00),
(32, NULL, 21.00);

-- Category 8: Sałatki
INSERT INTO items (id, category_id, name, ingredients) VALUES
(33, 8, 'SAŁATKA Z KEBABEM', 'mięso, warzywa, sosy'),
(34, 8, 'CRISPY SALAD', 'stripsy z kurczaka 3 szt., warzywa, sosy'),
(35, 8, 'GRECKA', 'sałata lodowa, ogórek, pomidor, feta, oliwki, jalapeno, sosy');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(33, NULL, 24.00),
(34, NULL, 22.00),
(35, NULL, 16.00);

-- Category 9: Dodatki
INSERT INTO items (id, category_id, name, ingredients) VALUES
(36, 9, 'FRYTKI', NULL),
(37, 9, 'FRYTKI Z SEREM', NULL),
(38, 9, 'BAKLAWA', NULL),
(39, 9, 'DODATKOWE MIĘSO', NULL),
(40, 9, 'DODATKOWE WARZYWA', NULL),
(41, 9, 'DODATKOWY SER', NULL),
(42, 9, 'DODATKOWY SOS', 'czosnkowy, łagodny, ketchup, ostry, BBQ, koperkowy'),
(43, 9, 'KULKI WARZYWNE', 'kulki warzywne 10 szt., frytki, sos');

INSERT INTO item_prices (item_id, size_id, price) VALUES
(36, 1, 9.00), (36, 3, 17.00),
(37, 1, 12.00), (37, 3, 19.00),
(38, NULL, 7.00),
(39, NULL, 8.00),
(40, NULL, 3.00),
(41, NULL, 3.00),
(42, NULL, 3.00),
(43, NULL, 16.00);

-- Category 10: Napoje
INSERT INTO items (id, category_id, name, ingredients) VALUES
(44, 10, 'AYRAN', NULL),
(45, 10, 'MANGO DIMES', NULL),
(46, 10, 'PEPSI', NULL),
(47, 10, 'MIRINDA', NULL),
(48, 10, 'LIPTON', NULL),
(49, 10, 'MOUNTAIN DEW', NULL),
(50, 10, 'WODA', NULL);

INSERT INTO item_prices (item_id, size_id, price) VALUES
(44, NULL, 6.00),
(45, 4, 7.00),
(46, 4, 7.00), (46, 5, 9.00),
(47, 4, 7.00), (47, 5, 9.00),
(48, 4, 7.00), (48, 5, 9.00),
(49, 4, 7.00), (49, 5, 9.00),
(50, 5, 5.00);

COMMIT;
