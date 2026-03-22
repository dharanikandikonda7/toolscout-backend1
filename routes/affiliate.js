const express = require('express');
const router = express.Router();
const { AffiliateClick } = require('../models/index');

const DEMO_LINKS = {
  '1': 'https://chat.openai.com',
  '2': 'https://jasper.ai',
  '3': 'https://writesonic.com',
  '4': 'https://rytr.me',
  '5': 'https://midjourney.com',
  '6': 'https://synthesia.io',
  '7': 'https://github.com/features/copilot',
  '8': 'https://canva.com',
};

// POST /api/affiliate/click/:toolId
// Tracks the click then redirects to affiliate link
router.post('/click/:toolId', async (req, res) => {
  const { toolId } = req.params;
  const { source = 'tool-card', page } = req.body;

  try {
    // Save click
    const click = new AffiliateClick({
      tool: toolId,
      source,
      page,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referer: req.headers.referer,
    });
    await click.save();

    // Increment tool click count
    try {
      const Tool = require('../models/Tool');
      await Tool.findByIdAndUpdate(toolId, { $inc: { clickCount: 1 } });
    } catch {}

    // Get affiliate link
    let affiliateLink = DEMO_LINKS[toolId] || '/';
    try {
      const Tool = require('../models/Tool');
      const tool = await Tool.findById(toolId).select('affiliateLink');
      if (tool?.affiliateLink) affiliateLink = tool.affiliateLink;
    } catch {}

    res.json({ success: true, redirectUrl: affiliateLink });
  } catch (err) {
    // Still redirect even if tracking fails
    const affiliateLink = DEMO_LINKS[toolId] || '/';
    res.json({ success: true, redirectUrl: affiliateLink });
  }
});

// GET /api/affiliate/stats — revenue dashboard
router.get('/stats', async (req, res) => {
  try {
    const [totalClicks, recentClicks] = await Promise.all([
      AffiliateClick.countDocuments(),
      AffiliateClick.find()
        .sort({ createdAt: -1 }).limit(10)
        .populate('tool', 'name logo logoColor commissionRate'),
    ]);

    const bySource = await AffiliateClick.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } }},
      { $sort: { count: -1 }},
    ]);

    const byTool = await AffiliateClick.aggregate([
      { $group: { _id: '$tool', count: { $sum: 1 } }},
      { $sort: { count: -1 }}, { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: { totalClicks, recentClicks, bySource, byTool },
    });
  } catch {
    // Demo stats
    res.json({
      success: true,
      data: {
        totalClicks: 4820,
        estimatedRevenue: '$1,240',
        conversionRate: '3.2%',
        bySource: [
          { _id: 'tool-detail', count: 1840 },
          { _id: 'quiz-result', count: 1320 },
          { _id: 'tool-card', count: 980 },
          { _id: 'blog', count: 480 },
          { _id: 'comparison', count: 200 },
        ],
        topTools: [
          { tool: 'ChatGPT', clicks: 1240 },
          { tool: 'Jasper AI', clicks: 890 },
          { tool: 'GitHub Copilot', clicks: 760 },
          { tool: 'Midjourney', clicks: 640 },
          { tool: 'Canva AI', clicks: 520 },
        ],
      },
    });
  }
});

module.exports = router;
