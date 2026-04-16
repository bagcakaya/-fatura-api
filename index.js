const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL Bağlantısı (Bulut)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
  user: process.env.DB_USER || 'sql12823441',
  password: process.env.DB_PASSWORD || '2pfCULfNee',
  database: process.env.DB_NAME || 'sql12823441',
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL veritabanına başarıyla bağlanıldı.');
});

// 1. Faturaları Getir (Ay ve Yıla göre)
app.get('/api/faturalar', (req, res) => {
  const ay = req.query.ay;
  const yil = req.query.yil;

  let query = 'SELECT * FROM Faturalar ORDER BY FaturaTarihi ASC';
  const params = [];

  if (ay && yil) {
    query = 'SELECT * FROM Faturalar WHERE AitOlduguAy = ? AND AitOlduguYil = ? ORDER BY FaturaTarihi ASC';
    params.push(parseInt(ay), parseInt(yil));
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// 2. Fatura Ekle
app.post('/api/faturalar', (req, res) => {
  const { FaturaAdi, Tutar, FaturaTarihi, SonOdemeTarihi, AitOlduguAy, AitOlduguYil, Aciklama } = req.body;

  if (!FaturaAdi || !Tutar) {
    return res.status(400).json({ error: 'Eksik bilgi!' });
  }

  const query = 'INSERT INTO Faturalar (FaturaAdi, Tutar, FaturaTarihi, SonOdemeTarihi, AitOlduguAy, AitOlduguYil, OdendiMi, Aciklama) VALUES (?, ?, ?, ?, ?, ?, 0, ?)';

  db.query(query, [FaturaAdi, Tutar, FaturaTarihi, SonOdemeTarihi, AitOlduguAy, AitOlduguYil, Aciklama || ''], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fatura eklenemedi' });
    }
    res.status(201).json({ message: 'Fatura başarıyla eklendi', id: result.insertId });
  });
});

// 3. Ödeme Durumu Güncelle
app.put('/api/faturalar/:id/odeme', (req, res) => {
  const { id } = req.params;
  const { OdendiMi } = req.body;

  const query = 'UPDATE Faturalar SET OdendiMi = ? WHERE Id = ?';
  db.query(query, [OdendiMi ? 1 : 0, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ödeme durumu güncellenemedi' });
    }
    res.json({ message: 'Ödeme durumu güncellendi' });
  });
});

// 4. Fatura Sil
app.delete('/api/faturalar/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM Faturalar WHERE Id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fatura silinemedi' });
    }
    res.json({ message: 'Fatura başarıyla silindi' });
  });
});

app.listen(port, Object.assign({}, process.env.HOST ? { host: process.env.HOST } : {}), () => {
  console.log(`API sunucusu http://localhost:${port} adresinde çalışıyor`);
});
