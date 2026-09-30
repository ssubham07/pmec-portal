require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' })); // 5mb to allow base64 signature drawings
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents / signatures / certificates / id_cards statically
const fs = require('fs');
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
['documents', 'signatures', 'certificates', 'id_cards'].forEach((sub) => {
  fs.mkdirSync(path.join(uploadDir, sub), { recursive: true });
});
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'pmec-portal-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`PMEC Portal API listening on port ${PORT}`));
}

module.exports = app;
