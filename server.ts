import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("gestor.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    description TEXT NOT NULL,
    value REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    completion_date DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    message TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Clients
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, email, phone, notes } = req.body;
    const info = db.prepare("INSERT INTO clients (name, email, phone, notes) VALUES (?, ?, ?, ?)").run(name, email, phone, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/clients/:id", (req, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    const services = db.prepare("SELECT * FROM services WHERE client_id = ? ORDER BY date DESC").all(req.params.id);
    const reminders = db.prepare("SELECT * FROM reminders WHERE client_id = ? AND completed = 0 ORDER BY due_date ASC").all(req.params.id);
    res.json({ ...client, services, reminders });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM reminders WHERE client_id = ?").run(req.params.id);
    db.prepare("DELETE FROM services WHERE client_id = ?").run(req.params.id);
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Services
  app.get("/api/services", (req, res) => {
    const services = db.prepare(`
      SELECT s.*, c.name as client_name 
      FROM services s 
      JOIN clients c ON s.client_id = c.id 
      ORDER BY s.date DESC
    `).all();
    res.json(services);
  });

  app.post("/api/services", (req, res) => {
    const { client_id, description, value, date, status, completion_date } = req.body;
    const info = db.prepare("INSERT INTO services (client_id, description, value, date, status, completion_date) VALUES (?, ?, ?, ?, ?, ?)").run(
      client_id, 
      description, 
      value, 
      date || new Date().toISOString(),
      status || 'pending',
      completion_date || null
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/services/:id", (req, res) => {
    const { status, completion_date } = req.body;
    db.prepare("UPDATE services SET status = ?, completion_date = ? WHERE id = ?").run(status, completion_date, req.params.id);
    res.json({ success: true });
  });

  // Reminders
  app.get("/api/reminders", (req, res) => {
    const reminders = db.prepare(`
      SELECT r.*, c.name as client_name 
      FROM reminders r 
      JOIN clients c ON r.client_id = c.id 
      WHERE r.completed = 0
      ORDER BY r.due_date ASC
    `).all();
    res.json(reminders);
  });

  app.post("/api/reminders", (req, res) => {
    const { client_id, message, due_date } = req.body;
    const info = db.prepare("INSERT INTO reminders (client_id, message, due_date) VALUES (?, ?, ?)").run(client_id, message, due_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/reminders/:id/complete", (req, res) => {
    db.prepare("UPDATE reminders SET completed = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get().count;
    const totalRevenue = db.prepare("SELECT SUM(value) as sum FROM services WHERE status = 'completed'").get().sum || 0;
    const activeReminders = db.prepare("SELECT COUNT(*) as count FROM reminders WHERE completed = 0").get().count;
    const pendingServices = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'pending'").get().count;
    
    // Monthly revenue for the last 6 months (only completed)
    const monthlyRevenue = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(value) as total
      FROM services 
      WHERE date >= date('now', '-6 months') AND status = 'completed'
      GROUP BY month
      ORDER BY month ASC
    `).all();

    const recentServices = db.prepare(`
      SELECT s.*, c.name as client_name 
      FROM services s 
      JOIN clients c ON s.client_id = c.id 
      ORDER BY s.date DESC LIMIT 10
    `).all();

    const recentClients = db.prepare(`
      SELECT * FROM clients ORDER BY created_at DESC LIMIT 5
    `).all();

    res.json({
      totalClients,
      totalRevenue,
      activeReminders,
      pendingServices,
      recentServices,
      monthlyRevenue,
      recentClients
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
