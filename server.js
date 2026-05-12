import express, { json, static as staticMiddleware } from 'express';
import cors from 'cors';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = join(__dirname, 'data.json');
const CREDENTIALS_FILE = join(__dirname, 'credentials.json');

app.use(cors());
app.use(json());

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7); // Remove "Bearer "
  
  // Verify token format (username:password in base64)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');
    
    // Read credentials and verify
    const creds = readCredentials();
    const user = creds.users.find((u) => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = username;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper: read credentials from JSON file
function readCredentials() {
  try {
    if (!existsSync(CREDENTIALS_FILE)) {
      return { users: [] };
    }
    const raw = readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [] };
  }
}

// Serve static files from dist/ (protected by auth)
app.use((req, res, next) => {
  // Allow auth endpoints without authentication
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  // Require auth for everything else
  authMiddleware(req, res, next);
});

app.use(staticMiddleware(join(__dirname, 'dist')));

// Auth endpoints (no authentication required)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const creds = readCredentials();
  const user = creds.users.find((u) => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate token: base64(username:password)
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  console.log(`✅ User "${username}" logged in`);
  res.json({ token, username });
});

app.post('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');
    const creds = readCredentials();
    const user = creds.users.find((u) => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ valid: true, username });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Helper: read data from JSON file
function readData() {
  try {
    if (!existsSync(DATA_FILE)) {
      writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: write data to JSON file
function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/essays — получить все эссе
app.get('/api/essays', authMiddleware, (req, res) => {
  const essays = readData();
  console.log('📖 GET /api/essays: возвращаю', essays.length, 'эссе');
  res.json(essays);
});

// POST /api/essays — добавить эссе
app.post('/api/essays', authMiddleware, (req, res) => {
  console.log('📝 POST /api/essays:', req.body);
  const essays = readData();
  const newEssay = req.body;
  if (!newEssay.id) {
    newEssay.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  essays.push(newEssay);
  writeData(essays);
  console.log('✅ Эссе добавлено, всего:', essays.length);
  res.status(201).json(newEssay);
});

// PUT /api/essays/:id — обновить эссе
app.put('/api/essays/:id', authMiddleware, (req, res) => {
  const essays = readData();
  const idx = essays.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  essays[idx] = { ...essays[idx], ...req.body, id: req.params.id };
  writeData(essays);
  res.json(essays[idx]);
});

// DELETE /api/essays/:id — удалить эссе
app.delete('/api/essays/:id', authMiddleware, (req, res) => {
  const essays = readData();
  const filtered = essays.filter((e) => e.id !== req.params.id);
  if (filtered.length === essays.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  writeData(filtered);
  res.status(204).end();
});

// SPA fallback — для всех остальных маршрутов отдаём index.html
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Server running at http://localhost:${PORT}`);
  console.log(`  📁 Data file: ${DATA_FILE}\n`);
});
