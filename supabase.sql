-- Supabase/PostgreSQL Migration Dump
-- Generated automatically

-- Table: users

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
INSERT INTO users (id, username, password) VALUES
(1, 'Admin', 'WebDevs!24');
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Table: clients

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    date DATE,
    clientName TEXT,
    packageAmount DECIMAL(10, 2),
    downPayment DECIMAL(10, 2),
    fullyPaid TEXT,
    salesCloser TEXT,
    devAssigned TEXT
);
INSERT INTO clients (id, date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned) VALUES
(1, '2026-01-14', 'papa g', 2499, 500, 'Not', 249.9, 'Red'),
(2, '2026-01-14', 'erun', 1499, 500, 'Not', 149.9, 'Red');
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- Table: profiles

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name TEXT,
    role TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    paymentImage TEXT
);
INSERT INTO profiles (id, name, role, email, status, paymentImage) VALUES
(1, 'Red', NULL, NULL, 'Active', NULL);
SELECT setval('profiles_id_seq', (SELECT MAX(id) FROM profiles));

-- Table: budgets

CREATE TABLE IF NOT EXISTS budgets (
    monthKey TEXT PRIMARY KEY,
    budgetAmount DECIMAL(10, 2)
);

