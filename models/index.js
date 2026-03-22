const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── BLOG POST ───────────────────────────────────
const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  excerpt: { type: String, maxlength: 400 },
  content: { type: String, required: true },
  coverEmoji: { type: String, default: '📝' },
  coverBg: { type: String, default: '#1a1030' },
  category: { type: String, required: true },
  tags: [String],
  seoKeyword: { type: String },
  metaDescription: { type: String, maxlength: 160 },
  readTime: { type: Number, default: 5 },
  viewCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  relatedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
}, { timestamps: true });

blogPostSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

blogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// ─── QUIZ RESPONSE ───────────────────────────────
const quizResponseSchema = new mongoose.Schema({
  sessionId: { type: String },
  profession: {
    type: String,
    enum: ['STUDENT', 'TEACHER', 'FREELANCER', 'HR', 'BUSINESS', 'DEVELOPER', 'MARKETER'],
    required: true,
  },
  useCase: { type: String, required: true },
  budget: {
    type: String,
    enum: ['FREE', 'LOW', 'MEDIUM', 'HIGH'],
    required: true,
  },
  recommendedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  toolScores: [{
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    score: Number,
  }],
  clickedTool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
  userAgent: String,
  ip: String,
}, { timestamps: true });

// ─── AFFILIATE CLICK ─────────────────────────────
const affiliateClickSchema = new mongoose.Schema({
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  source: {
    type: String,
    enum: ['tool-card', 'tool-detail', 'quiz-result', 'blog', 'comparison', 'sidebar'],
    default: 'tool-card',
  },
  page: String,
  userAgent: String,
  ip: String,
  referer: String,
  converted: { type: Boolean, default: false },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

// ─── USER ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
  },
  password: { type: String, required: true, minlength: 8, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  savedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  quizHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizResponse' }],
  emailSubscribed: { type: Boolean, default: true },
  profession: { type: String },
  lastLoginAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── PAGE VIEW (analytics) ───────────────────────
const pageViewSchema = new mongoose.Schema({
  page: { type: String, required: true },
  toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
  sessionId: String,
  userAgent: String,
  ip: String,
  referer: String,
  duration: Number,
}, { timestamps: true });

module.exports = {
  BlogPost: mongoose.model('BlogPost', blogPostSchema),
  QuizResponse: mongoose.model('QuizResponse', quizResponseSchema),
  AffiliateClick: mongoose.model('AffiliateClick', affiliateClickSchema),
  User: mongoose.model('User', userSchema),
  PageView: mongoose.model('PageView', pageViewSchema),
};
