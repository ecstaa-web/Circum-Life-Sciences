const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const yachtsPath = path.join(__dirname, 'data', 'yachts.json');
const yachts = JSON.parse(fs.readFileSync(yachtsPath, 'utf8'));
const inquiries = [];

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nereis', yachts: yachts.length });
});

app.get('/api/yachts', (req, res) => {
  const category = req.query.category;
  const items = category && category !== 'all'
    ? yachts.filter((y) => y.category === category)
    : yachts;
  res.json({ yachts: items, count: items.length });
});

app.get('/api/yachts/:id', (req, res) => {
  const yacht = yachts.find((y) => y.id === req.params.id);
  if (!yacht) return res.status(404).json({ error: 'Yacht introuvable' });
  res.json(yacht);
});

app.post('/api/inquiries', (req, res) => {
  const { name, email, phone = '', yacht_id = '', message, interest = 'acquisition' } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Merci d’indiquer votre nom.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }
  if (!message || String(message).trim().length < 8) {
    return res.status(400).json({ error: 'Votre message est trop court.' });
  }
  inquiries.push({
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    yacht_id: String(yacht_id).trim(),
    message: String(message).trim(),
    interest: String(interest).trim(),
    received_at: new Date().toISOString()
  });
  res.json({
    ok: true,
    message: 'Votre demande a été transmise à la Maison. Un conseiller Nereïs vous répondra sous 24 heures.',
    reference: `NR-${String(inquiries.length).padStart(4, '0')}`
  });
});

app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

app.listen(PORT, HOST, () => {
  console.log(`Nereïs Yachts listening on http://${HOST}:${PORT}`);
});
