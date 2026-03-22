const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Tool name is required'],
    trim: true, unique: true, maxlength: [100, 'Name too long'],
  },
  slug: {
    type: String, unique: true, lowercase: true,
  },
  tagline: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  logo: { type: String, default: 'AI' },
  logoColor: { type: String, default: '#6c63ff' },
  website: { type: String },
  affiliateLink: { type: String, required: [true, 'Affiliate link required'] },
  affiliateProgram: { type: String, enum: ['PartnerStack', 'Impact', 'Direct', 'ShareASale', 'Other'], default: 'Direct' },
  commissionRate: { type: Number, min: 0, max: 100, default: 30 },
  commissionType: { type: String, enum: ['one-time', 'recurring', 'hybrid'], default: 'recurring' },

  category: {
    type: String,
    enum: ['writing', 'design', 'video', 'coding', 'marketing', 'hr'],
    required: true,
  },
  pricing: {
    type: String,
    enum: ['free', 'freemium', 'paid'],
    required: true,
  },
  pricingPlans: [{
    name: String,
    price: String,
    priceINR: String,
    description: String,
    featured: { type: Boolean, default: false },
    features: [String],
  }],

  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  features: [{ type: String }],
  pros: [{ type: String }],
  cons: [{ type: String }],
  useCases: [{ type: String }],

  targetProfessions: [{
    type: String,
    enum: ['STUDENT', 'TEACHER', 'FREELANCER', 'HR', 'BUSINESS', 'DEVELOPER', 'MARKETER'],
  }],
  targetBudgets: [{
    type: String,
    enum: ['FREE', 'LOW', 'MEDIUM', 'HIGH'],
  }],

  seoKeywords: [String],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  clickCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-generate slug from name
toolSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual: conversion rate
toolSchema.virtual('conversionRate').get(function() {
  if (this.viewCount === 0) return 0;
  return ((this.clickCount / this.viewCount) * 100).toFixed(1);
});

toolSchema.index({ category: 1, pricing: 1 });
toolSchema.index({ rating: -1 });
toolSchema.index({ name: 'text', description: 'text', tagline: 'text' });

module.exports = mongoose.model('Tool', toolSchema);
