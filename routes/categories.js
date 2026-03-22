// ─── CATEGORIES ROUTE ────────────────────────────
const express = require('express');
const categoriesRouter = express.Router();

const CATEGORIES = [
  { id: 'writing', name: 'Writing', icon: '✍️', count: 28, color: '#6c63ff', description: 'AI tools for blogs, emails, and content creation' },
  { id: 'design', name: 'Design', icon: '🎨', count: 18, color: '#ff6bca', description: 'Image generation, graphic design, and visual AI' },
  { id: 'video', name: 'Video', icon: '🎬', count: 14, color: '#f5a623', description: 'AI video creation, avatars, and editing tools' },
  { id: 'coding', name: 'Coding', icon: '💻', count: 22, color: '#00d4b4', description: 'Code assistants, debuggers, and developer tools' },
  { id: 'marketing', name: 'Marketing', icon: '📣', count: 20, color: '#ff5f6d', description: 'SEO, ads, social media, and campaign tools' },
  { id: 'hr', name: 'HR & Hiring', icon: '👥', count: 12, color: '#22c986', description: 'Recruitment, onboarding, and HR automation' },
];

categoriesRouter.get('/', (req, res) => {
  res.json({ success: true, data: CATEGORIES });
});

categoriesRouter.get('/:id', (req, res) => {
  const cat = CATEGORIES.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });
  res.json({ success: true, data: cat });
});

// ─── BLOG ROUTE ──────────────────────────────────
const blogRouter = express.Router();
const { BlogPost } = require('../models/index');

const DEMO_POSTS = [
  { _id: '1', title: 'ChatGPT vs Claude vs Gemini — Which is Best in 2026?', slug: 'chatgpt-vs-claude-vs-gemini-2026', excerpt: 'We tested all three for 30 days. Here is our honest verdict for Indian users.', category: 'Comparison', coverEmoji: '🤖', coverBg: '#1a1030', readTime: 8, viewCount: 4820, publishedAt: new Date('2026-03-01'), isPublished: true },
  { _id: '2', title: 'Best Free AI Writing Tools — No Credit Card (India)', slug: 'best-free-ai-writing-tools-india', excerpt: 'All the best free AI writing tools tested for Indian freelancers and students.', category: 'Free Tools', coverEmoji: '✍️', coverBg: '#0f1a20', readTime: 6, viewCount: 3240, publishedAt: new Date('2026-02-20'), isPublished: true },
  { _id: '3', title: 'Best AI Tools for Teachers in India (2026)', slug: 'best-ai-tools-teachers-india', excerpt: 'From lesson planning to grading — AI tools that save teachers hours every week.', category: 'Education', coverEmoji: '📚', coverBg: '#1a1520', readTime: 7, viewCount: 2100, publishedAt: new Date('2026-02-10'), isPublished: true },
  { _id: '4', title: 'Jasper vs Writesonic — The Honest Verdict', slug: 'jasper-vs-writesonic', excerpt: 'Detailed head-to-head: quality, pricing, and use cases compared.', category: 'Comparison', coverEmoji: '⚡', coverBg: '#1a1020', readTime: 9, viewCount: 1890, publishedAt: new Date('2026-01-28'), isPublished: true },
  { _id: '5', title: 'How to Earn ₹50,000/Month Reviewing AI Tools', slug: 'earn-money-reviewing-ai-tools', excerpt: 'The complete guide to building affiliate income from zero investment.', category: 'Make Money', coverEmoji: '💰', coverBg: '#101a10', readTime: 12, viewCount: 5640, publishedAt: new Date('2026-01-15'), isPublished: true },
  { _id: '6', title: 'Best AI Tools for Small Business in India', slug: 'best-ai-tools-small-business-india', excerpt: 'Social media, customer service, accounting — AI tools that help Indian businesses grow.', category: 'Business', coverEmoji: '🏪', coverBg: '#1a1510', readTime: 8, viewCount: 1420, publishedAt: new Date('2026-01-05'), isPublished: true },
];

blogRouter.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let posts;
    try {
      const filter = { isPublished: true };
      if (category) filter.category = category;
      if (search) filter.$text = { $search: search };
      posts = await BlogPost.find(filter).sort({ publishedAt: -1 }).lean();
    } catch {
      posts = DEMO_POSTS.filter(p => p.isPublished);
      if (category) posts = posts.filter(p => p.category === category);
    }
    const total = posts.length;
    const paginated = posts.slice((page-1)*limit, page*limit);
    res.json({ success: true, data: paginated, pagination: { total, page: parseInt(page), limit: parseInt(limit) }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

blogRouter.get('/:slug', async (req, res) => {
  try {
    let post;
    try {
      post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
      if (post) await BlogPost.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });
    } catch {
      post = DEMO_POSTS.find(p => p.slug === req.params.slug || p._id === req.params.slug);
    }
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AUTH ROUTE ───────────────────────────────────
const authRouter = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, profession } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'All fields required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });
    const user = await User.create({ name, email, password, profession });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = signToken(user._id);
    res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ANALYTICS ROUTE ──────────────────────────────
const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', async (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalTools: 8,
        totalClicks: 4820,
        totalQuizResponses: 1248,
        totalPageViews: 28400,
        estimatedMonthlyRevenue: '$1,240',
        conversionRate: '3.2%',
      },
      trafficSources: [
        { source: 'Google Organic', visits: 14200, percentage: 50 },
        { source: 'Direct', visits: 5680, percentage: 20 },
        { source: 'Social Media', visits: 4260, percentage: 15 },
        { source: 'Reddit', visits: 2840, percentage: 10 },
        { source: 'Email', visits: 1420, percentage: 5 },
      ],
      topPages: [
        { page: '/tools/chatgpt', views: 4820, clicks: 640 },
        { page: '/compare', views: 3240, clicks: 420 },
        { page: '/quiz', views: 2980, clicks: 1248 },
        { page: '/blog/earn-money-reviewing-ai-tools', views: 2560, clicks: 180 },
        { page: '/tools/jasper-ai', views: 1980, clicks: 290 },
      ],
      monthlyRevenue: [
        { month: 'Oct', revenue: 120 }, { month: 'Nov', revenue: 280 },
        { month: 'Dec', revenue: 480 }, { month: 'Jan', revenue: 720 },
        { month: 'Feb', revenue: 980 }, { month: 'Mar', revenue: 1240 },
      ],
    },
  });
});

module.exports = { categoriesRouter, blogRouter, authRouter, analyticsRouter };
