const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true }));

// ─── DATABASE ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/toolscout')
  .then(() => {
    console.log('✅ MongoDB connected');
    startCronJobs(); // Start automation after DB connects
  })
  .catch(() => console.log('⚠️  MongoDB offline — using demo data'));

// ─── ROUTES ───────────────────────────────────────────────
const { categoriesRouter, blogRouter, authRouter, analyticsRouter } = require('./routes/categories');
app.use('/api/tools',      require('./routes/tools'));
app.use('/api/categories', categoriesRouter);
app.use('/api/quiz',       require('./routes/quiz'));
app.use('/api/blog',       blogRouter);
app.use('/api/affiliate',  require('./routes/affiliate'));
app.use('/api/auth',       authRouter);
app.use('/api/analytics',  analyticsRouter);

// ─── MANUAL TRIGGER ENDPOINTS ────────────────────────────
app.post('/api/admin/scrape-tools', async (req, res) => {
  try {
    const { scrapeAndUpdateTools } = require('./services/toolScraper');
    res.json({ message: 'Tool scraper started' });
    scrapeAndUpdateTools(); // runs async
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/update-news', async (req, res) => {
  try {
    const { fetchAndUpdateNews } = require('./services/newsUpdater');
    res.json({ message: 'News updater started' });
    fetchAndUpdateNews(); // runs async
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const Tool = require('./models/Tool');
    const { BlogPost } = require('./models/index');
    const [toolCount, newsCount, lastTool] = await Promise.all([
      Tool.countDocuments({ isActive: true }),
      BlogPost.countDocuments({ isPublished: true }),
      Tool.findOne().sort({ createdAt: -1 }).select('name createdAt'),
    ]);
    res.json({
      tools: toolCount,
      news: newsCount,
      lastToolAdded: lastTool?.name,
      lastToolAddedAt: lastTool?.createdAt,
      nextScrapeIn: '6 hours',
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CRON JOBS (run inside Railway server) ────────────────
function startCronJobs() {
  const { scrapeAndUpdateTools, updateToolRatings } = require('./services/toolScraper');
  const { fetchAndUpdateNews } = require('./services/newsUpdater');

  // Every 3 hours — fetch AI news
  cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ Cron: Fetching news...');
    await fetchAndUpdateNews();
  });

  // Every 6 hours — scrape new tools
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Cron: Scraping new tools...');
    await scrapeAndUpdateTools();
  });

  // Daily 9am IST (3:30 UTC) — update ratings
  cron.schedule('30 3 * * *', async () => {
    console.log('⏰ Cron: Updating ratings...');
    await updateToolRatings();
  });

  console.log('⏰ Cron jobs started:');
  console.log('   News: every 3 hours');
  console.log('   Tool scraper: every 6 hours');
  console.log('   Rating updates: daily 9am IST');

  // Run once immediately on startup (after 30s delay)
  setTimeout(async () => {
    console.log('🚀 Running initial data fetch...');
    await fetchAndUpdateNews();
    await scrapeAndUpdateTools();
  }, 30000);
}

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok', version: '2.0.0',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'demo-mode',
  timestamp: new Date().toISOString(),
  features: ['auto-tool-discovery', 'auto-news', 'quiz', 'affiliate-tracking'],
  endpoints: [
    'GET  /api/tools',
    'GET  /api/tools/:id',
    'GET  /api/categories',
    'POST /api/quiz/recommend',
    'GET  /api/blog',
    'POST /api/affiliate/click/:toolId',
    'POST /api/admin/scrape-tools',
    'POST /api/admin/update-news',
    'GET  /api/admin/stats',
  ]
}));

app.get('/', (req, res) => res.redirect('/api/health'));
app.use('*', (req, res) => res.status(404).json({ error: `${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ToolScout API v2  → http://localhost:${PORT}`);
  console.log(`🔍 Health check      → http://localhost:${PORT}/api/health`);
  console.log(`📦 Tools             → http://localhost:${PORT}/api/tools`);
  console.log(`📰 News              → http://localhost:${PORT}/api/blog`);
  console.log(`🤖 Admin stats       → http://localhost:${PORT}/api/admin/stats\n`);
});

module.exports = app;
