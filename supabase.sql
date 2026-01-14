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

-- Table: profiles

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name TEXT,
    paymentImage TEXT
);

-- Table: budgets

CREATE TABLE IF NOT EXISTS budgets (
    monthKey TEXT PRIMARY KEY,
    budgetAmount DECIMAL(10, 2)
);

