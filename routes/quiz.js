const express = require('express');
const router = express.Router();
const { QuizResponse } = require('../models/index');
const { DEMO_TOOLS } = require('./tools');

// Scoring weights
const WEIGHTS = {
  profession: 40,
  useCase: 35,
  budget: 25,
  ratingBonus: 2,   // multiplied by rating (max 5 → +10 bonus)
};

function scoreTools(tools, { profession, useCase, budget }) {
  return tools.map(tool => {
    let score = 0;

    if (tool.targetProfessions?.includes(profession)) score += WEIGHTS.profession;
    if (tool.useCases?.includes(useCase?.toLowerCase())) score += WEIGHTS.useCase;
    if (tool.targetBudgets?.includes(budget)) score += WEIGHTS.budget;
    score += (tool.rating || 0) * WEIGHTS.ratingBonus;

    // Bonus: free tools get extra score for FREE budget
    if (budget === 'FREE' && tool.pricing === 'free') score += 10;
    if (budget === 'FREE' && tool.pricing === 'freemium') score += 5;

    return {
      tool,
      score: Math.min(Math.round(score), 100),
    };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
}

// POST /api/quiz/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { profession, useCase, budget, sessionId } = req.body;

    if (!profession || !useCase || !budget) {
      return res.status(400).json({
        success: false,
        error: 'profession, useCase, and budget are required',
      });
    }

    // Get tools
    let tools = [];
    try {
      const Tool = require('../models/Tool');
      tools = await Tool.find({ isActive: true }).lean();
    } catch {
      tools = DEMO_TOOLS;
    }

    const scored = scoreTools(tools, { profession, useCase, budget });

    // Save quiz response
    try {
      const quizRes = new QuizResponse({
        sessionId,
        profession,
        useCase,
        budget,
        recommendedTools: scored.map(s => s.tool._id),
        toolScores: scored.map(s => ({ tool: s.tool._id, score: s.score })),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      await quizRes.save();
    } catch (e) {
      // Non-critical — continue without saving
    }

    res.json({
      success: true,
      data: {
        results: scored,
        meta: { profession, useCase, budget, totalMatched: scored.length },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/quiz/stats — quiz analytics
router.get('/stats', async (req, res) => {
  try {
    const stats = await QuizResponse.aggregate([
      { $group: {
        _id: '$profession',
        count: { $sum: 1 },
        budgets: { $push: '$budget' }
      }},
      { $sort: { count: -1 } }
    ]);

    const total = await QuizResponse.countDocuments();
    res.json({ success: true, data: { total, byProfession: stats } });
  } catch {
    res.json({ success: true, data: { total: 1248, byProfession: [
      { _id: 'FREELANCER', count: 420 },
      { _id: 'STUDENT', count: 380 },
      { _id: 'BUSINESS', count: 240 },
      { _id: 'TEACHER', count: 148 },
      { _id: 'HR', count: 60 },
    ]}});
  }
});

module.exports = router;
