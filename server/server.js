import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001; // Run backend on 3001

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large payloads for image strings

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    try {
        const row = await db.get(sql, [username, password]);
        if (row) {
            res.json({
                "message": "success",
                "data": { id: row.id, username: row.username }
            });
        } else {
            res.status(401).json({ "message": "Invalid credentials" });
        }
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Clients Endpoints ---

// Get All Clients
app.get('/api/clients', async (req, res) => {
    const sql = "SELECT * FROM clients";
    try {
        const rows = await db.query(sql);
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
            res.status(400).json({ "error": err.message });
    }
});

// Add Client
app.post('/api/clients', async (req, res) => {
    const { date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned } = req.body;
    const sql = 'INSERT INTO clients (date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned) VALUES (?,?,?,?,?,?,?)';
    const params = [date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned];
    
    try {
        const result = await db.execute(sql, params);
        res.json({
            "message": "success",
            "data": { id: result.insertId, ...req.body }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update Client
app.put('/api/clients/:id', async (req, res) => {
    const { date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned } = req.body;
    // Updated SQL to be compatible with MySQL (no changes needed for basic update)
    const sql = `UPDATE clients SET 
                 date = ?, clientName = ?, packageAmount = ?, downPayment = ?, 
                 fullyPaid = ?, salesCloser = ?, devAssigned = ? 
                 WHERE id = ?`;
    const params = [date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned, req.params.id];
    
    try {
        const result = await db.execute(sql, params);
        res.json({
            "message": "success",
            "data": req.body,
            "changes": result.changes
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete Client
app.delete('/api/clients/:id', async (req, res) => {
    const sql = 'DELETE FROM clients WHERE id = ?';
    try {
        const result = await db.execute(sql, [req.params.id]);
        res.json({ "message": "deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Import Clients (Bulk)
app.post('/api/clients/import', async (req, res) => {
    const clients = req.body.clients;
    if (!Array.isArray(clients)) {
        return res.status(400).json({ error: "Invalid data format" });
    }

    // This bulk insert syntax is compatible with both SQLite and MySQL
    const placeholder = clients.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const sql = 'INSERT INTO clients (date, clientName, packageAmount, downPayment, fullyPaid, salesCloser, devAssigned) VALUES ' + placeholder;
    
    const params = [];
    clients.forEach(c => {
        params.push(c.date, c.clientName, c.packageAmount, c.downPayment, c.fullyPaid, c.salesCloser, c.devAssigned);
    });

    try {
        const result = await db.execute(sql, params);
        res.json({ "message": "success", "count": result.changes });
    } catch (err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    }
});


// --- Profiles Endpoints ---
app.get('/api/profiles', async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM profiles");
        res.json({data: rows});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.post('/api/profiles', async (req, res) => {
    const { name, role, email, status, paymentImage } = req.body;
    try {
        const result = await db.execute("INSERT INTO profiles (name, role, email, status, paymentImage) VALUES (?, ?, ?, ?, ?)", [name, role, email, status, paymentImage]);
        res.json({data: {id: result.insertId, name, role, email, status, paymentImage}});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.put('/api/profiles/:id', async (req, res) => {
    const { name, role, email, status, paymentImage } = req.body;
    try {
        // Build dynamic update query to handle partial updates if needed, but for now full update is fine or coalescing
        // Simpler: Just update all provided fields. 
        // Note: SQLite/MySQL syntax compatible for this? Yes.
        
        let sql = "UPDATE profiles SET ";
        const params = [];
        const updates = [];
        
        if (name !== undefined) { updates.push("name = ?"); params.push(name); }
        if (role !== undefined) { updates.push("role = ?"); params.push(role); }
        if (email !== undefined) { updates.push("email = ?"); params.push(email); }
        if (status !== undefined) { updates.push("status = ?"); params.push(status); }
        if (paymentImage !== undefined) { updates.push("paymentImage = ?"); params.push(paymentImage); }
        
        if (updates.length === 0) return res.json({message: "No changes"});
        
        sql += updates.join(", ") + " WHERE id = ?";
        params.push(req.params.id);

        await db.execute(sql, params);
        res.json({data: {id: req.params.id, ...req.body}});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.delete('/api/profiles/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM profiles WHERE id = ?", [req.params.id]);
        res.json({message: "deleted"});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});


// --- Budgets Endpoints ---
app.get('/api/budgets', async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM budgets");
        // Convert array to object map for frontend {'YYYY-MM': amount}
        const budgetMap = {};
        rows.forEach(r => budgetMap[r.monthKey] = r.budgetAmount);
        res.json({data: budgetMap});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.post('/api/budgets', async (req, res) => {
    const { monthKey, budgetAmount } = req.body;
    try {
        // Attempt insert
        // Note: Generic SQL is hard. Let's try to just do the simple check-update-insert logic for maximum compatibility.
        const existing = await db.get("SELECT monthKey FROM budgets WHERE monthKey = ?", [monthKey]);
        
        if (existing) {
            await db.execute("UPDATE budgets SET budgetAmount = ? WHERE monthKey = ?", [budgetAmount, monthKey]);
        } else {
            await db.execute("INSERT INTO budgets (monthKey, budgetAmount) VALUES (?, ?)", [monthKey, budgetAmount]);
        }
        res.json({message: "success"});
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
