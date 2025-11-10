import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ENV değişkenlerini kullanacağız
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, JWT_SECRET } = process.env;

const db = new pg.Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: PGPORT,
  ssl: { rejectUnauthorized: false }
});

// Kullanıcı kayıt
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Eksik bilgi var." });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
      [username, email, hash]
    );
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Kullanıcı zaten var." });
    return res.status(500).json({ error: "Server patladı ama düzelteceğiz." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const q = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (q.rowCount === 0) return res.status(400).json({ error: "Kullanıcı yok." });

  const user = q.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Şifre yanlış." });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ ok: true, token });
});

// Kullanıcı verisi
app.get("/api/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token yok." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const q = await db.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [decoded.userId]);
    res.json({ ok: true, user: q.rows[0] });
  } catch {
    res.status(401).json({ error: "Token bozuk veya süresi dolmuş." });
  }
});

app.listen(3000, () => console.log("Backend çalışıyor → http://localhost:3000"));
