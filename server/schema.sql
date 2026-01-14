-- Database Schema for Management App
-- Compatible with MySQL/MariaDB

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    clientName VARCHAR(255),
    packageAmount DECIMAL(10, 2),
    downPayment DECIMAL(10, 2),
    fullyPaid VARCHAR(50),  -- 'Yes', 'No', or Boolean if refactored, keeping TEXT for compatibility
    salesCloser VARCHAR(255),
    devAssigned VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    paymentImage LONGTEXT -- Storing base64 images requires large text field
);

CREATE TABLE IF NOT EXISTS budgets (
    monthKey VARCHAR(20) PRIMARY KEY, -- Format 'YYYY-MM'
    budgetAmount DECIMAL(10, 2)
);

-- Seed Initial Admin User (Password: WebDevs!24)
-- Note: password should ideally be hashed (bcrypt), but following existing pattern for now.
INSERT IGNORE INTO users (username, password) VALUES ('Admin', 'WebDevs!24');
