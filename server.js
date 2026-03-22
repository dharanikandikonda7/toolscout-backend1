const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true }));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/toolscout')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(() => console.log('⚠️  MongoDB offline — using demo data'));

const { categoriesRouter, blogRouter, authRouter, analyticsRouter } = require('./routes/categories');
app.use('/api/tools',      require('./routes/tools'));
app.use('/api/categories', categoriesRouter);
app.use('/api/quiz',       require('./routes/quiz'));
app.use('/api/blog',       blogRouter);
app.use('/api/affiliate',  require('./routes/affiliate'));
app.use('/api/auth',       authRouter);
app.use('/api/analytics',  analyticsRouter);

app.get('/api/health', (req, res) => res.json({
  status: 'ok', version: '1.0.0',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'demo-mode',
  timestamp: new Date().toISOString(),
  endpoints: [
    'GET  /api/tools',
    'GET  /api/tools/:id',
    'GET  /api/categories',
    'POST /api/quiz/recommend',
    'GET  /api/blog',
    'POST /api/affiliate/click/:toolId',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET  /api/analytics/dashboard',
  ]
}));

app.get('/', (req, res) => res.redirect('/api/health'));
app.use('*', (req, res) => res.status(404).json({ error: `${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ToolScout API  → http://localhost:${PORT}`);
  console.log(`🔍 Health check   → http://localhost:${PORT}/api/health`);
  console.log(`📦 Tools          → http://localhost:${PORT}/api/tools`);
  console.log(`🎯 Quiz           → POST http://localhost:${PORT}/api/quiz/recommend\n`);
});
module.exports = app;
