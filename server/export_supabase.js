import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');
const outputPath = path.resolve(__dirname, '../supabase.sql');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

const stream = fs.createWriteStream(outputPath, { flags: 'w' });

console.log('Starting export to', outputPath);

stream.write('-- Supabase/PostgreSQL Migration Dump\n');
stream.write('-- Generated automatically\n\n');

// Helper to escape strings for SQL
const escape = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    return `'${String(str).replace(/'/g, "''")}'`;
};

db.serialize(() => {
    // 1. Users Table
    stream.write('-- Table: users\n');
    stream.write(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
`);
    db.all('SELECT * FROM users', (err, rows) => {
        if (err) throw err;
        if (rows.length > 0) {
            stream.write('INSERT INTO users (id, username, password) VALUES\n');
            const values = rows.map(r => `(${r.id}, ${escape(r.username)}, ${escape(r.password)})`).join(',\n');
            stream.write(values + ';\n');
            stream.write("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));\n\n");
        } else {
             // Ensure admin exists if empty (though previous code seeds it)
             stream.write("INSERT INTO users (username, password) VALUES ('Admin', 'WebDevs!24') ON CONFLICT DO NOTHING;\n\n");
        }

        // 2. Clients Table
        stream.write('-- Table: clients\n');
        stream.write(`
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
`);
        db.all('SELECT * FROM clients', (err, rows) => {
            if (err) throw err;
            if (rows.length > 0) {
                stream.write('INSERT INTO clients (id, date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned) VALUES\n');
                const values = rows.map(r => 
                    `(${r.id}, ${escape(r.date)}, ${escape(r.clientName)}, ${r.packageAmount || 0}, ${r.downPayment || 0}, ${escape(r.fullyPaid)}, ${escape(r.salesCloser)}, ${escape(r.devAssigned)})`
                ).join(',\n');
                stream.write(values + ';\n');
                stream.write("SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));\n\n");
            } else {
                stream.write('\n');
            }

            // 3. Profiles Table
            stream.write('-- Table: profiles\n');
            stream.write(`
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name TEXT,
    role TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    paymentImage TEXT
);
`);
            db.all('SELECT * FROM profiles', (err, rows) => {
                if (err) throw err;
                if (rows.length > 0) {
                    stream.write('INSERT INTO profiles (id, name, role, email, status, paymentImage) VALUES\n');
                    const values = rows.map(r => `(${r.id}, ${escape(r.name)}, ${escape(r.role)}, ${escape(r.email)}, ${escape(r.status || 'Active')}, ${escape(r.paymentImage)})`).join(',\n');
                    stream.write(values + ';\n');
                    stream.write("SELECT setval('profiles_id_seq', (SELECT MAX(id) FROM profiles));\n\n");
                } else {
                    stream.write('\n');
                }

                // 4. Budgets Table
                stream.write('-- Table: budgets\n');
                stream.write(`
CREATE TABLE IF NOT EXISTS budgets (
    monthKey TEXT PRIMARY KEY,
    budgetAmount DECIMAL(10, 2)
);
`);
                db.all('SELECT * FROM budgets', (err, rows) => {
                    if (err) throw err;
                    if (rows.length > 0) {
                        stream.write('INSERT INTO budgets (monthKey, budgetAmount) VALUES\n');
                        const values = rows.map(r => `(${escape(r.monthKey)}, ${r.budgetAmount || 0})`).join(',\n');
                        stream.write(values + ';\n');
                    } else {
                        // Inject a default budget for the current month so the chart works
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const defaultKey = `${year}-${month}`;
                        stream.write(`INSERT INTO budgets (monthKey, budgetAmount) VALUES ('${defaultKey}', 100000) ON CONFLICT DO NOTHING;\n`);
                    }

                    // 5. Disable RLS for MVP
                    stream.write('-- Disable RLS for MVP (Development Mode)\n');
                    stream.write('ALTER TABLE users DISABLE ROW LEVEL SECURITY;\n');
                    stream.write('ALTER TABLE clients DISABLE ROW LEVEL SECURITY;\n');
                    stream.write('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;\n');
                    stream.write('ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;\n');
                    
                    console.log('Export completed.');
                    stream.end();
                    db.close();
                });
            });
        });
    });
});
