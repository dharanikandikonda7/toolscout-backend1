const { BlogPost } = require('../models/index');

// ─── FREE RSS FEEDS — no API key needed ───────────────────
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge' },
  { url: 'https://feeds.feedburner.com/oreilly/radar/atom', source: "O'Reilly" },
];

const COVER_EMOJIS = ['🤖', '⚡', '🧠', '🚀', '💡', '🔮', '✨', '🎯', '📱', '💻'];
const COVER_BGS = ['#1a1030', '#0f1a20', '#1a1520', '#1a1020', '#101a10', '#1a1510', '#101520', '#1a1015'];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── PARSE RSS XML ────────────────────────────────────────
function parseRSSItems(xml) {
  const items = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ||
                      xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

  for (const item of itemMatches.slice(0, 10)) {
    const title = (item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1];
    const link = (item.match(/<link[^>]*>([^<]+)<\/link>/) ||
                  item.match(/<link[^>]*href="([^"]+)"/) || [])[1];
    const desc = (item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ||
                  item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1];
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) ||
                     item.match(/<published>(.*?)<\/published>/) ||
                     item.match(/<updated>(.*?)<\/updated>/) || [])[1];

    if (title && link) {
      items.push({
        title: title.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        link: link.trim(),
        excerpt: desc ? desc.replace(/<[^>]+>/g, '').trim().substring(0, 300) : '',
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
      });
    }
  }
  return items;
}

// ─── FETCH RSS ────────────────────────────────────────────
async function fetchRSSFeed(feedUrl, source) {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'ToolScout RSS Reader 1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRSSItems(xml);
    return items.map(i => ({ ...i, source }));
  } catch (err) {
    console.log(`RSS fetch error (${source}):`, err.message);
    return [];
  }
}

// ─── AI SUMMARY ──────────────────────────────────────────
async function generateAISummary(title, excerpt) {
  if (!GEMINI_API_KEY) {
    return {
      category: detectCategory(title),
      excerpt: excerpt?.substring(0, 250) || title,
      readTime: 4,
    };
  }

  try {
    const prompt = `Given this AI news article, return ONLY JSON (no markdown):
Title: "${title}"
Content: "${excerpt?.substring(0, 400) || ''}"

Return:
{
  "category": "one of: AI News, New Tools, Research, Business, Education, For India",
  "excerpt": "2 sentence summary for Indian audience, max 180 chars",
  "readTime": 4,
  "isRelevantToIndia": true or false
}`;

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
      }),
    });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { category: detectCategory(title), excerpt: excerpt?.substring(0, 250) || title, readTime: 4 };
  }
}

function detectCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('launch') || t.includes('new') || t.includes('release')) return 'New Tools';
  if (t.includes('research') || t.includes('paper') || t.includes('study')) return 'Research';
  if (t.includes('india') || t.includes('startup')) return 'For India';
  if (t.includes('business') || t.includes('revenue') || t.includes('funding')) return 'Business';
  return 'AI News';
}

function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80) + '-' + Date.now().toString(36);
}

// ─── MAIN NEWS UPDATER ────────────────────────────────────
async function fetchAndUpdateNews() {
  console.log('\n📰 Starting news updater...', new Date().toISOString());
  let added = 0, skipped = 0;

  try {
    // Fetch all RSS feeds in parallel
    const feedResults = await Promise.all(
      RSS_FEEDS.map(f => fetchRSSFeed(f.url, f.source))
    );

    const allArticles = feedResults.flat();
    console.log(`📡 Found ${allArticles.length} articles from ${RSS_FEEDS.length} feeds`);

    for (const article of allArticles) {
      try {
        // Skip if title too short or not AI-related
        if (!article.title || article.title.length < 10) continue;
        const titleLower = article.title.toLowerCase();
        const isAIRelated = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt',
          'chatbot', 'openai', 'anthropic', 'gemini', 'claude', 'neural', 'automation',
          'deep learning', 'generative'].some(kw => titleLower.includes(kw));
        if (!isAIRelated) continue;

        // Check if already exists
        const exists = await BlogPost.findOne({
          $or: [
            { title: { $regex: new RegExp(article.title.substring(0, 50), 'i') } },
            { externalUrl: article.link }
          ]
        });
        if (exists) { skipped++; continue; }

        // Generate AI summary
        const aiData = await generateAISummary(article.title, article.excerpt);

        const post = new BlogPost({
          title: article.title,
          slug: generateSlug(article.title),
          excerpt: aiData.excerpt || article.excerpt?.substring(0, 250) || article.title,
          content: `<p>${article.excerpt || article.title}</p><p><a href="${article.link}" target="_blank">Read full article on ${article.source} →</a></p>`,
          category: aiData.category || 'AI News',
          coverEmoji: COVER_EMOJIS[Math.floor(Math.random() * COVER_EMOJIS.length)],
          coverBg: COVER_BGS[Math.floor(Math.random() * COVER_BGS.length)],
          tags: ['AI News', article.source, aiData.category],
          readTime: aiData.readTime || 4,
          isPublished: true,
          publishedAt: article.publishedAt || new Date(),
          externalUrl: article.link,
          source: article.source,
          viewCount: 0,
        });

        await post.save();
        added++;
        console.log(`  ✅ News: ${article.title.substring(0, 60)}...`);

        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.log(`  ❌ Error saving article:`, err.message);
      }
    }

    // Keep only last 200 news articles (free tier DB limit)
    const count = await BlogPost.countDocuments({ category: { $ne: 'Comparison' } });
    if (count > 200) {
      const oldest = await BlogPost.find({ isPublished: true })
        .sort({ publishedAt: 1 }).limit(count - 200).select('_id');
      await BlogPost.deleteMany({ _id: { $in: oldest.map(p => p._id) } });
      console.log(`🗑️  Cleaned ${count - 200} old articles`);
    }

    console.log(`\n📊 News update done: +${added} added, ${skipped} skipped\n`);
    return { added, skipped };

  } catch (err) {
    console.error('News updater fatal error:', err);
    return { added, skipped, error: err.message };
  }
}

module.exports = { fetchAndUpdateNews };
