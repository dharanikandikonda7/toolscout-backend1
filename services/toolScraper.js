const mongoose = require('mongoose');
const Tool = require('../models/Tool');

// ─── FREE APIs — zero cost ────────────────────────────────
// ProductHunt GraphQL API (free, no key needed for basic queries)
// HackerNews Algolia API (completely free, no key needed)
// Gemini AI API (free tier — 60 req/min)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── PRODUCTHUNT API ─────────────────────────────────────
async function fetchProductHuntTools() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const query = `{
      posts(first: 50, postedAfter: "${dateStr}T00:00:00Z", topic: "artificial-intelligence") {
        edges {
          node {
            id name tagline description
            website votesCount reviewsRating
            topics { edges { node { name } } }
            thumbnail { url }
          }
        }
      }
    }`;

    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PRODUCTHUNT_TOKEN || ''}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error('ProductHunt API error');
    const data = await res.json();
    return data?.data?.posts?.edges?.map(e => e.node) || [];
  } catch (err) {
    console.log('ProductHunt fetch error (using HN fallback):', err.message);
    return [];
  }
}

// ─── HACKERNEWS API (no key needed) ──────────────────────
async function fetchHackerNewsTools() {
  try {
    const res = await fetch(
      'https://hn.algolia.com/api/v1/search?query=Show+HN+AI&tags=show_hn&hitsPerPage=30&numericFilters=created_at_i>' + 
      Math.floor((Date.now() - 86400000 * 2) / 1000)
    );
    const data = await res.json();
    return (data.hits || [])
      .filter(h => 
        h.title?.toLowerCase().includes('ai') ||
        h.title?.toLowerCase().includes('gpt') ||
        h.title?.toLowerCase().includes('llm') ||
        h.title?.toLowerCase().includes('machine learning')
      )
      .map(h => ({
        id: h.objectID,
        name: h.title?.replace(/^Show HN:\s*/i, '').trim(),
        tagline: h.title,
        website: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        votesCount: h.points || 0,
        source: 'hackernews',
      }));
  } catch (err) {
    console.log('HackerNews fetch error:', err.message);
    return [];
  }
}

// ─── GEMINI AI ENRICHMENT ─────────────────────────────────
async function enrichToolWithAI(tool) {
  if (!GEMINI_API_KEY) {
    // Fallback: generate basic data without AI
    return generateBasicToolData(tool);
  }

  try {
    const prompt = `You are an AI tool database. Given this AI tool info, return ONLY a JSON object (no markdown, no explanation):

Tool name: ${tool.name}
Tagline: ${tool.tagline || ''}
Website: ${tool.website || ''}

Return this exact JSON structure:
{
  "description": "2-3 sentence description of what this tool does, who it's for, and key benefits (max 200 words)",
  "category": "one of: writing, design, video, coding, marketing, hr",
  "pricing": "one of: free, freemium, paid",
  "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "useCases": ["usecase1", "usecase2"],
  "targetProfessions": ["STUDENT", "FREELANCER"],
  "targetBudgets": ["FREE", "LOW"],
  "logoColor": "#hexcolor"
}`;

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.log('Gemini enrichment error:', err.message);
    return generateBasicToolData(tool);
  }
}

// Fallback when no AI key available
function generateBasicToolData(tool) {
  const name = (tool.name || '').toLowerCase();
  let category = 'writing';
  if (name.includes('image') || name.includes('design') || name.includes('art')) category = 'design';
  if (name.includes('video') || name.includes('avatar')) category = 'video';
  if (name.includes('code') || name.includes('dev') || name.includes('debug')) category = 'coding';
  if (name.includes('market') || name.includes('seo') || name.includes('ad')) category = 'marketing';
  if (name.includes('hr') || name.includes('hire') || name.includes('recruit')) category = 'hr';

  return {
    description: tool.tagline || `${tool.name} is an AI-powered tool that helps users work smarter and faster.`,
    category,
    pricing: 'freemium',
    features: ['AI-powered automation', 'Easy to use interface', 'Cloud-based', 'Regular updates'],
    pros: ['Saves time', 'Easy to use', 'Affordable pricing'],
    cons: ['Limited free tier', 'Internet required'],
    useCases: [category],
    targetProfessions: ['FREELANCER', 'BUSINESS'],
    targetBudgets: ['FREE', 'LOW', 'MEDIUM'],
    logoColor: '#6c63ff',
  };
}

// ─── GENERATE LOGO LETTER ────────────────────────────────
function getLogoLetter(name) {
  return (name || 'A').substring(0, 2).toUpperCase();
}

// ─── GENERATE SLUG ────────────────────────────────────────
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── MAIN SCRAPER FUNCTION ────────────────────────────────
async function scrapeAndUpdateTools() {
  console.log('\n🤖 Starting tool scraper...', new Date().toISOString());
  let added = 0, skipped = 0, errors = 0;

  try {
    // Fetch from all sources
    const [phTools, hnTools] = await Promise.all([
      fetchProductHuntTools(),
      fetchHackerNewsTools(),
    ]);

    const allTools = [...phTools, ...hnTools];
    console.log(`📡 Found ${allTools.length} potential tools (PH: ${phTools.length}, HN: ${hnTools.length})`);

    for (const rawTool of allTools) {
      try {
        if (!rawTool.name || rawTool.name.length < 2) continue;

        // Check if already exists
        const slug = generateSlug(rawTool.name);
        const exists = await Tool.findOne({
          $or: [{ slug }, { name: { $regex: new RegExp(`^${rawTool.name}$`, 'i') } }]
        });

        if (exists) { skipped++; continue; }

        // Enrich with AI
        const enriched = await enrichToolWithAI(rawTool);

        // Create tool
        const tool = new Tool({
          name: rawTool.name,
          slug,
          tagline: rawTool.tagline || rawTool.name,
          description: enriched.description,
          logo: getLogoLetter(rawTool.name),
          logoColor: enriched.logoColor || '#6c63ff',
          website: rawTool.website || '',
          affiliateLink: rawTool.website || '#',
          category: enriched.category || 'writing',
          pricing: enriched.pricing || 'freemium',
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(rawTool.votesCount || Math.random() * 500),
          features: enriched.features || [],
          pros: enriched.pros || [],
          cons: enriched.cons || [],
          useCases: enriched.useCases || [],
          targetProfessions: enriched.targetProfessions || ['FREELANCER'],
          targetBudgets: enriched.targetBudgets || ['LOW'],
          isActive: true,
          isFeatured: false,
          lastUpdated: new Date(),
          seoKeywords: [rawTool.name.toLowerCase(), `${rawTool.name.toLowerCase()} review`, `${rawTool.name.toLowerCase()} free`],
        });

        await tool.save();
        added++;
        console.log(`  ✅ Added: ${rawTool.name}`);

        // Rate limit — wait 1s between Gemini calls
        await new Promise(r => setTimeout(r, 1000));

      } catch (err) {
        errors++;
        console.log(`  ❌ Error processing ${rawTool.name}:`, err.message);
      }
    }

    console.log(`\n📊 Scraper done: +${added} added, ${skipped} skipped, ${errors} errors\n`);
    return { added, skipped, errors };

  } catch (err) {
    console.error('Scraper fatal error:', err);
    return { added, skipped, errors: errors + 1 };
  }
}

// ─── UPDATE EXISTING TOOL RATINGS ────────────────────────
async function updateToolRatings() {
  try {
    const tools = await Tool.find({ isActive: true });
    for (const tool of tools) {
      // Simulate slight rating drift based on click activity
      if (tool.clickCount > 100) {
        const newRating = Math.min(5, Math.max(3, tool.rating + (Math.random() * 0.1 - 0.05)));
        await Tool.findByIdAndUpdate(tool._id, {
          rating: parseFloat(newRating.toFixed(1)),
          lastUpdated: new Date(),
        });
      }
    }
    console.log('✅ Tool ratings updated');
  } catch (err) {
    console.error('Rating update error:', err);
  }
}

module.exports = { scrapeAndUpdateTools, updateToolRatings };
