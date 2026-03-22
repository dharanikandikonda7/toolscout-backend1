const express = require('express');
const router = express.Router();
const Tool = require('../models/Tool');

// In-memory fallback data (when MongoDB is not connected)
const DEMO_TOOLS = [
  { _id: '1', name: 'ChatGPT', slug: 'chatgpt', tagline: 'The world\'s most popular AI assistant', description: 'ChatGPT by OpenAI is the benchmark AI assistant — writing, coding, analysis, research. Free plan is genuinely powerful.', logo: 'C', logoColor: '#10a37f', category: 'writing', pricing: 'freemium', rating: 4.8, reviewCount: 45000, features: ['GPT-4o access','Image generation','Code interpreter','Web browsing','Custom GPTs'], pros: ['Free plan is excellent','Versatile','Huge ecosystem'], cons: ['Generic without good prompts','Knowledge cutoff'], targetProfessions: ['STUDENT','TEACHER','FREELANCER','HR','BUSINESS'], targetBudgets: ['FREE','LOW'], useCases: ['writing','coding','marketing'], affiliateLink: 'https://chat.openai.com', isFeatured: true, clickCount: 1240, viewCount: 8900, pricingPlans: [{name:'Free',price:'₹0',description:'GPT-3.5 + limited 4o'},{name:'Plus',price:'$20',priceINR:'₹1,650',description:'GPT-4o unlimited',featured:true}] },
  { _id: '2', name: 'Jasper AI', slug: 'jasper-ai', tagline: 'AI content writer for marketing teams', description: 'Jasper is a powerful AI writing assistant built for marketing teams. Write blogs, ads, emails and social posts 10x faster.', logo: 'J', logoColor: '#f97316', category: 'writing', pricing: 'paid', rating: 4.6, reviewCount: 2840, features: ['Blog post generator','Ad copy templates','Brand voice training','SEO mode','25+ languages'], pros: ['Excellent quality output','Huge template library','Brand voice feature'], cons: ['Expensive','Learning curve','No free plan'], targetProfessions: ['FREELANCER','BUSINESS','MARKETER'], targetBudgets: ['MEDIUM','HIGH'], useCases: ['writing','marketing'], affiliateLink: 'https://jasper.ai', isFeatured: true, clickCount: 890, viewCount: 5600, pricingPlans: [{name:'Creator',price:'$39',priceINR:'₹3,200',description:'1 user, unlimited words',featured:true},{name:'Teams',price:'$99',priceINR:'₹8,100',description:'3 users'}] },
  { _id: '3', name: 'Writesonic', slug: 'writesonic', tagline: 'Fast AI writing for every format', description: 'Writesonic generates high-quality content for blogs, ads, product descriptions and more. Great free plan for Indian freelancers.', logo: 'W', logoColor: '#8b5cf6', category: 'writing', pricing: 'freemium', rating: 4.4, reviewCount: 1920, features: ['1-click article writer','AI chatbot Chatsonic','Product descriptions','Landing page copy','SEO integrations'], pros: ['Generous free plan','Very affordable','Chatsonic is great'], cons: ['Quality varies','Can repeat itself'], targetProfessions: ['FREELANCER','STUDENT','BUSINESS'], targetBudgets: ['FREE','LOW','MEDIUM'], useCases: ['writing','marketing'], affiliateLink: 'https://writesonic.com', isFeatured: false, clickCount: 650, viewCount: 4200, pricingPlans: [{name:'Free',price:'₹0',description:'6,250 words/mo'},{name:'Unlimited',price:'₹1,900',description:'Unlimited words',featured:true}] },
  { _id: '4', name: 'Rytr', slug: 'rytr', tagline: 'Budget-friendly AI writer for India', description: 'Rytr is one of the most affordable AI writing tools — loved by Indian students and freelancers. Generate quality content in seconds.', logo: 'R', logoColor: '#06b6d4', category: 'writing', pricing: 'freemium', rating: 4.3, reviewCount: 1450, features: ['40+ use cases','30+ languages','Plagiarism checker','Tone selector','Chrome extension'], pros: ['Very affordable','Simple interface','Great free tier'], cons: ['Limited long-form','Fewer integrations'], targetProfessions: ['STUDENT','FREELANCER'], targetBudgets: ['FREE','LOW'], useCases: ['writing'], affiliateLink: 'https://rytr.me', isFeatured: false, clickCount: 420, viewCount: 3100, pricingPlans: [{name:'Free',price:'₹0',description:'10k chars/mo'},{name:'Saver',price:'₹600',description:'100k chars/mo',featured:true},{name:'Unlimited',price:'₹1,800',description:'Unlimited'}] },
  { _id: '5', name: 'Midjourney', slug: 'midjourney', tagline: 'World-class AI image generation', description: 'Midjourney produces stunning AI-generated images from text prompts. The go-to tool for designers and creative professionals.', logo: 'M', logoColor: '#818cf8', category: 'design', pricing: 'paid', rating: 4.8, reviewCount: 8200, features: ['Photorealistic images','Artistic styles','High resolution','Prompt variations','Commercial license'], pros: ['Best image quality','Active community','Consistent style'], cons: ['No free plan','Discord interface','Learning curve'], targetProfessions: ['FREELANCER','BUSINESS','MARKETER'], targetBudgets: ['LOW','MEDIUM'], useCases: ['design','marketing'], affiliateLink: 'https://midjourney.com', isFeatured: true, clickCount: 2100, viewCount: 9800, pricingPlans: [{name:'Basic',price:'$10',priceINR:'₹820',description:'200 images/mo'},{name:'Standard',price:'$30',priceINR:'₹2,460',description:'Unlimited relaxed',featured:true}] },
  { _id: '6', name: 'Synthesia', slug: 'synthesia', tagline: 'AI video creation with avatars', description: 'Synthesia turns scripts into professional videos using AI avatars. Perfect for HR training videos and corporate communications.', logo: 'S', logoColor: '#7c3aed', category: 'video', pricing: 'paid', rating: 4.5, reviewCount: 980, features: ['125+ AI avatars','60+ languages','Custom avatar','Screen recording','PPT to video'], pros: ['No filming needed','Professional output','Great for HR'], cons: ['Expensive','Avatars look robotic'], targetProfessions: ['HR','BUSINESS'], targetBudgets: ['MEDIUM','HIGH'], useCases: ['video','hr'], affiliateLink: 'https://synthesia.io', isFeatured: false, clickCount: 380, viewCount: 2400, pricingPlans: [{name:'Personal',price:'$22',priceINR:'₹1,800',description:'10 videos/mo'},{name:'Corporate',price:'Custom',description:'Unlimited'}] },
  { _id: '7', name: 'GitHub Copilot', slug: 'github-copilot', tagline: 'AI pair programmer for developers', description: 'GitHub Copilot autocompletes code, suggests functions, and helps debug — directly inside VS Code and JetBrains.', logo: 'G', logoColor: '#1f2937', category: 'coding', pricing: 'paid', rating: 4.7, reviewCount: 5600, features: ['Code autocomplete','Multi-language','Test generation','Documentation writing','VS Code + JetBrains'], pros: ['Huge productivity boost','Learns your style','Works in major IDEs'], cons: ['Can suggest buggy code','Not free','Privacy concerns'], targetProfessions: ['FREELANCER','BUSINESS','DEVELOPER'], targetBudgets: ['LOW','MEDIUM'], useCases: ['coding'], affiliateLink: 'https://github.com/features/copilot', isFeatured: true, clickCount: 1560, viewCount: 7200, pricingPlans: [{name:'Individual',price:'$10',priceINR:'₹820',description:'Per month'},{name:'Business',price:'$19',priceINR:'₹1,558',description:'Per user/month',featured:true}] },
  { _id: '8', name: 'Canva AI', slug: 'canva-ai', tagline: 'Design made easy with AI magic', description: 'Canva\'s AI features let you generate images, write copy, create presentations, and remove backgrounds — all inside Canva.', logo: 'Ca', logoColor: '#00c4cc', category: 'design', pricing: 'freemium', rating: 4.5, reviewCount: 12000, features: ['Magic Write','Text to Image','Background remover','Magic Eraser','Presentation AI'], pros: ['Everyone knows Canva','Excellent free plan','Easy drag-and-drop'], cons: ['AI needs Pro plan','Not for complex design'], targetProfessions: ['STUDENT','TEACHER','FREELANCER','BUSINESS','MARKETER'], targetBudgets: ['FREE','LOW'], useCases: ['design','marketing'], affiliateLink: 'https://canva.com', isFeatured: false, clickCount: 980, viewCount: 6100, pricingPlans: [{name:'Free',price:'₹0',description:'Basic features'},{name:'Pro',price:'₹3,999',description:'All AI features',featured:true}] },
];

// Helper: use DB or fallback to demo
async function getTools(filter = {}) {
  try {
    return await Tool.find(filter).lean();
  } catch {
    let tools = [...DEMO_TOOLS];
    if (filter.category) tools = tools.filter(t => t.category === filter.category);
    if (filter.pricing) tools = tools.filter(t => t.pricing === filter.pricing);
    if (filter.isFeatured) tools = tools.filter(t => t.isFeatured);
    return tools;
  }
}

// GET /api/tools — list with filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const {
      category, pricing, profession, budget, useCase,
      search, sort = 'rating', order = 'desc',
      page = 1, limit = 20, featured
    } = req.query;

    let tools = await getTools();

    // Filters
    if (category) tools = tools.filter(t => t.category === category);
    if (pricing) tools = tools.filter(t => t.pricing === pricing);
    if (profession) tools = tools.filter(t => t.targetProfessions?.includes(profession.toUpperCase()));
    if (budget) tools = tools.filter(t => t.targetBudgets?.includes(budget.toUpperCase()));
    if (useCase) tools = tools.filter(t => t.useCases?.includes(useCase.toLowerCase()));
    if (featured === 'true') tools = tools.filter(t => t.isFeatured);

    // Search
    if (search) {
      const q = search.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tagline?.toLowerCase().includes(q)
      );
    }

    // Sort
    tools.sort((a, b) => {
      const val = order === 'asc' ? 1 : -1;
      if (sort === 'rating') return (b.rating - a.rating) * val;
      if (sort === 'name') return a.name.localeCompare(b.name) * val;
      if (sort === 'clicks') return ((b.clickCount||0) - (a.clickCount||0)) * val;
      return 0;
    });

    // Pagination
    const total = tools.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const paginated = tools.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tools/featured
router.get('/featured', async (req, res) => {
  try {
    const tools = await getTools({ isFeatured: true });
    res.json({ success: true, data: tools.slice(0, 6) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tools/:id — by id or slug
router.get('/:id', async (req, res) => {
  try {
    let tool;
    try {
      tool = await Tool.findOne({
        $or: [{ _id: req.params.id }, { slug: req.params.id }]
      });
      if (tool) await Tool.findByIdAndUpdate(tool._id, { $inc: { viewCount: 1 } });
    } catch {
      tool = DEMO_TOOLS.find(t => t._id === req.params.id || t.slug === req.params.id);
    }
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });
    res.json({ success: true, data: tool });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tools — create (admin)
router.post('/', async (req, res) => {
  try {
    const tool = new Tool(req.body);
    await tool.save();
    res.status(201).json({ success: true, data: tool });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/tools/:id — update
router.put('/:id', async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });
    res.json({ success: true, data: tool });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/tools/:id
router.delete('/:id', async (req, res) => {
  try {
    await Tool.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tool deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.DEMO_TOOLS = DEMO_TOOLS;
