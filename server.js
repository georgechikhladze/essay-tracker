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

app.use(cors());
app.use(json());

// Serve static files from dist/
app.use(staticMiddleware(join(__dirname, 'dist')));

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
app.get('/api/essays', (req, res) => {
  const essays = readData();
  console.log('📖 GET /api/essays: возвращаю', essays.length, 'эссе');
  res.json(essays);
});

// POST /api/essays — добавить эссе
app.post('/api/essays', (req, res) => {
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
app.put('/api/essays/:id', (req, res) => {
  const essays = readData();
  const idx = essays.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  essays[idx] = { ...essays[idx], ...req.body, id: req.params.id };
  writeData(essays);
  res.json(essays[idx]);
});

// DELETE /api/essays/:id — удалить эссе
app.delete('/api/essays/:id', (req, res) => {
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
