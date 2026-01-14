import mysql from 'mysql2/promise';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const dbType = process.env.DB_TYPE || 'sqlite'; // 'mysql', 'postgres', or 'sqlite'

let db;
let pool;

const verboseSqlite = sqlite3.verbose();

async function initDB() {
    if (dbType === 'mysql') {
        try {
            pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            console.log('Connected to MySQL database pool.');
        } catch (err) {
            console.error('Error connecting to MySQL:', err.message);
        }
    } else if (dbType === 'postgres') {
        try {
            const { Pool } = pg;
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
            });
            console.log('Connected to PostgreSQL (Supabase) database pool.');
        } catch (err) {
            console.error('Error connecting to PostgreSQL:', err.message);
        }
    } else {
        // SQLite Fallback
        const dbPath = path.resolve(__dirname, 'database.sqlite');
        db = new verboseSqlite.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database ' + dbPath + ': ' + err.message);
            } else {
                console.log('Connected to the SQLite database.');
            }
        });
        
        // Initialize Schema for SQLite (Keep existing logic)
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                clientName TEXT,
                packageAmount REAL,
                downPayment REAL,
                fullyPaid TEXT,
                salesCloser REAL,
                devAssigned TEXT
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                role TEXT,
                email TEXT,
                status TEXT,
                paymentImage TEXT
            )`);
             // Attempt to add columns if they don't exist (Migration)
             const columns = ['role', 'email', 'status'];
             columns.forEach(col => {
                 // For status, set default to 'Active'
                 let sql = `ALTER TABLE profiles ADD COLUMN ${col} TEXT`;
                 if (col === 'status') sql += " DEFAULT 'Active'";
                 
                 db.run(sql, (err) => {
                     // Ignore error if column exists
                 });
             });
            db.run(`CREATE TABLE IF NOT EXISTS budgets (
                monthKey TEXT PRIMARY KEY,
                budgetAmount REAL
            )`);
            const stmt = db.prepare("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)");
            stmt.run('Admin', 'WebDevs!24');
            stmt.finalize();
        });
    }
}

initDB();

// Unified Interface
export const query = async (sql, params = []) => {
    if (dbType === 'mysql') {
        const [rows] = await pool.query(sql, params);
        return rows;
    } else if (dbType === 'postgres') {
        // Postgres uses $1, $2 placeholders instead of ?
        // We need to convert ? to $1, $2, etc.
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const result = await pool.query(pgSql, params);
        return result.rows;
    } else {
        return new Promise((resolve, reject) => {
            // Check if it's a SELECT query
            const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
            if (isSelect) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                 db.all(sql, params, (err, rows) => { 
                    if (err) reject(err);
                    else resolve(rows);
                });
            }
        });
    }
};

export const execute = async (sql, params = []) => {
    if (dbType === 'mysql') {
        const [result] = await pool.execute(sql, params);
        return {
            insertId: result.insertId,
            changes: result.affectedRows
        };
    } else if (dbType === 'postgres') {
        let paramIndex = 1;
        // Postgres RETURNING clause is often needed to get inserted ID
        const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
        let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        
        if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
             pgSql += ' RETURNING id';
        }
        
        const result = await pool.query(pgSql, params);
        
        return {
            insertId: (result.rows.length > 0 && result.rows[0].id) ? result.rows[0].id : null,
            changes: result.rowCount
        };
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({
                    insertId: this.lastID,
                    changes: this.changes
                });
            });
        });
    }
};

export const get = async (sql, params = []) => {
    if (dbType === 'mysql') {
        const [rows] = await pool.query(sql, params);
        return rows[0];
    } else if (dbType === 'postgres') {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const result = await pool.query(pgSql, params);
        return result.rows[0];
    } else {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
};

export default {
    query,
    execute,
    get
};
