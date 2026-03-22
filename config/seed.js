const mongoose = require('mongoose');
require('dotenv').config();

const Tool = require('../models/Tool');
const { BlogPost } = require('../models/index');

const TOOLS_DATA = [
  {
    name: 'ChatGPT', slug: 'chatgpt',
    tagline: "The world's most popular AI assistant",
    description: 'ChatGPT by OpenAI is the benchmark AI assistant — writing, coding, analysis, research, and conversation. The free plan is genuinely powerful and the most widely used AI tool globally.',
    logo: 'C', logoColor: '#10a37f', website: 'https://chat.openai.com',
    affiliateLink: 'https://chat.openai.com', affiliateProgram: 'Direct',
    commissionRate: 0, commissionType: 'one-time',
    category: 'writing', pricing: 'freemium',
    rating: 4.8, reviewCount: 45000,
    features: ['GPT-4o access', 'Image generation (Plus)', 'Code interpreter', 'Browse the web', 'Custom GPTs', 'API access'],
    pros: ['Free plan is excellent', 'Versatile — does almost anything', 'Huge ecosystem', 'Constantly improving'],
    cons: ['Generic outputs without good prompts', 'Knowledge cutoff', 'ChatGPT Plus costs $20/mo'],
    useCases: ['writing', 'coding', 'marketing', 'research'],
    targetProfessions: ['STUDENT', 'TEACHER', 'FREELANCER', 'HR', 'BUSINESS', 'DEVELOPER'],
    targetBudgets: ['FREE', 'LOW'],
    pricingPlans: [
      { name: 'Free', price: '₹0', description: 'GPT-3.5 + limited GPT-4o' },
      { name: 'Plus', price: '$20', priceINR: '₹1,650', description: 'GPT-4o unlimited', featured: true },
      { name: 'Team', price: '$25', priceINR: '₹2,050', description: 'Per user/month' },
    ],
    isFeatured: true, clickCount: 1240, viewCount: 8900,
    seoKeywords: ['chatgpt', 'openai', 'ai assistant', 'chatgpt free', 'chatgpt india'],
  },
  {
    name: 'Jasper AI', slug: 'jasper-ai',
    tagline: 'AI content writer for marketing teams',
    description: 'Jasper is a powerful AI writing assistant built for marketing teams and content creators. Write blogs, ads, emails and social posts 10x faster with brand voice training.',
    logo: 'J', logoColor: '#f97316', website: 'https://jasper.ai',
    affiliateLink: 'https://jasper.ai', affiliateProgram: 'PartnerStack',
    commissionRate: 30, commissionType: 'recurring',
    category: 'writing', pricing: 'paid',
    rating: 4.6, reviewCount: 2840,
    features: ['Blog post generator', 'Ad copy templates', 'Brand voice training', 'SEO mode', '25+ languages', 'Chrome extension'],
    pros: ['Excellent quality output', 'Huge template library', 'Brand voice feature is unique', 'Great for long-form content'],
    cons: ['Expensive for solo users', 'Learning curve for beginners', 'No free plan'],
    useCases: ['writing', 'marketing', 'seo'],
    targetProfessions: ['FREELANCER', 'BUSINESS', 'MARKETER'],
    targetBudgets: ['MEDIUM', 'HIGH'],
    pricingPlans: [
      { name: 'Creator', price: '$39', priceINR: '₹3,200', description: '1 user, unlimited words', featured: true },
      { name: 'Teams', price: '$99', priceINR: '₹8,100', description: '3 users + collaboration' },
    ],
    isFeatured: true, clickCount: 890, viewCount: 5600,
    seoKeywords: ['jasper ai', 'jasper ai review', 'jasper ai pricing india', 'ai writing tool'],
  },
  {
    name: 'Writesonic', slug: 'writesonic',
    tagline: 'Fast AI writing for every format',
    description: 'Writesonic generates high-quality content for blogs, ads, product descriptions, and more. Comes with a generous free plan — perfect for Indian freelancers and small businesses.',
    logo: 'W', logoColor: '#8b5cf6', website: 'https://writesonic.com',
    affiliateLink: 'https://writesonic.com', affiliateProgram: 'PartnerStack',
    commissionRate: 30, commissionType: 'recurring',
    category: 'writing', pricing: 'freemium',
    rating: 4.4, reviewCount: 1920,
    features: ['1-click article writer', 'AI chatbot Chatsonic', 'Product descriptions', 'Landing page copy', 'SEO integrations', 'API access'],
    pros: ['Generous free plan', 'Very affordable paid plans', 'Chatsonic is like ChatGPT+', 'Good for e-commerce'],
    cons: ['Output quality varies', 'Occasional repetition', 'UI can be overwhelming'],
    useCases: ['writing', 'marketing', 'ecommerce'],
    targetProfessions: ['FREELANCER', 'STUDENT', 'BUSINESS', 'MARKETER'],
    targetBudgets: ['FREE', 'LOW', 'MEDIUM'],
    pricingPlans: [
      { name: 'Free', price: '₹0', description: '6,250 words/month' },
      { name: 'Unlimited', price: '₹1,900', description: 'Unlimited words', featured: true },
    ],
    isFeatured: false, clickCount: 650, viewCount: 4200,
    seoKeywords: ['writesonic', 'writesonic review', 'writesonic free', 'writesonic india'],
  },
  {
    name: 'Rytr', slug: 'rytr',
    tagline: 'Budget-friendly AI writer for India',
    description: "Rytr is one of the most affordable AI writing tools — loved by Indian students and freelancers. 40+ use cases, 30+ languages, plagiarism checker included.",
    logo: 'R', logoColor: '#06b6d4', website: 'https://rytr.me',
    affiliateLink: 'https://rytr.me', affiliateProgram: 'Direct',
    commissionRate: 30, commissionType: 'recurring',
    category: 'writing', pricing: 'freemium',
    rating: 4.3, reviewCount: 1450,
    features: ['40+ use cases', '30+ languages', 'Plagiarism checker', 'Tone selector', 'Chrome extension', 'API access'],
    pros: ['Very affordable — ₹600/mo', 'Great for students', 'Simple clean interface', 'Long cookie window'],
    cons: ['Limited long-form ability', 'Fewer integrations', 'Smaller template library'],
    useCases: ['writing', 'social-media'],
    targetProfessions: ['STUDENT', 'FREELANCER', 'TEACHER'],
    targetBudgets: ['FREE', 'LOW'],
    pricingPlans: [
      { name: 'Free', price: '₹0', description: '10,000 chars/month' },
      { name: 'Saver', price: '₹600', description: '100,000 chars/month', featured: true },
      { name: 'Unlimited', price: '₹1,800', description: 'Unlimited generation' },
    ],
    isFeatured: false, clickCount: 420, viewCount: 3100,
    seoKeywords: ['rytr', 'rytr review', 'rytr india', 'cheap ai writing tool india'],
  },
  {
    name: 'Midjourney', slug: 'midjourney',
    tagline: 'World-class AI image generation',
    description: 'Midjourney produces stunning, artistic AI-generated images from text prompts. The go-to tool for designers, artists, and creative professionals worldwide.',
    logo: 'M', logoColor: '#818cf8', website: 'https://midjourney.com',
    affiliateLink: 'https://midjourney.com', affiliateProgram: 'Direct',
    commissionRate: 0, commissionType: 'one-time',
    category: 'design', pricing: 'paid',
    rating: 4.8, reviewCount: 8200,
    features: ['Photorealistic images', 'Artistic styles', 'High resolution output', 'Prompt variations', 'Commercial license', 'Fast mode'],
    pros: ['Best image quality available', 'Huge active community', 'Consistent style control', 'Regular model updates'],
    cons: ['No free plan', 'Discord-only interface', 'Learning prompting takes time'],
    useCases: ['design', 'marketing', 'creative'],
    targetProfessions: ['FREELANCER', 'BUSINESS', 'MARKETER'],
    targetBudgets: ['LOW', 'MEDIUM'],
    pricingPlans: [
      { name: 'Basic', price: '$10', priceINR: '₹820', description: '200 images/month' },
      { name: 'Standard', price: '$30', priceINR: '₹2,460', description: 'Unlimited relaxed', featured: true },
      { name: 'Pro', price: '$60', priceINR: '₹4,920', description: 'Stealth + fast mode' },
    ],
    isFeatured: true, clickCount: 2100, viewCount: 9800,
    seoKeywords: ['midjourney', 'midjourney review', 'ai image generator', 'midjourney india'],
  },
];

const BLOG_DATA = [
  {
    title: 'ChatGPT vs Claude vs Gemini — Which is Best in 2026?',
    slug: 'chatgpt-vs-claude-vs-gemini-2026',
    excerpt: 'We tested all three for 30 days across writing, coding, and research. Here is our honest verdict for Indian users.',
    content: '<p>This is a full comparison article...</p>',
    category: 'Comparison', coverEmoji: '🤖', coverBg: '#1a1030',
    seoKeyword: 'chatgpt vs claude vs gemini india', readTime: 8, viewCount: 4820, isPublished: true, publishedAt: new Date('2026-03-01'),
  },
  {
    title: 'Best Free AI Writing Tools — No Credit Card Needed (India 2026)',
    slug: 'best-free-ai-writing-tools-india-2026',
    excerpt: 'All the best free AI writing tools tested and ranked for Indian freelancers and students. Zero cost, real results.',
    content: '<p>This article covers all free AI writing tools...</p>',
    category: 'Free Tools', coverEmoji: '✍️', coverBg: '#0f1a20',
    seoKeyword: 'free ai writing tools india no credit card', readTime: 6, viewCount: 3240, isPublished: true, publishedAt: new Date('2026-02-20'),
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/toolscout');
    console.log('✅ Connected to MongoDB');

    await Tool.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('🗑️  Cleared existing data');

    await Tool.insertMany(TOOLS_DATA);
    console.log(`✅ Seeded ${TOOLS_DATA.length} tools`);

    await BlogPost.insertMany(BLOG_DATA);
    console.log(`✅ Seeded ${BLOG_DATA.length} blog posts`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
