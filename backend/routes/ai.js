const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL } = require('../lib/aiHelpers');

// Apply auth + rate limiter to all AI routes
router.use(authMiddleware);
router.use(aiRateLimiter);

/**
 * Helper: run AI prompt, parse JSON, persist to ai_results, send response.
 */
async function runAIFeature(req, res, { feature, systemPrompt, userPrompt, extra = {} }) {
  const data = await callOpenRouter(systemPrompt, userPrompt);
  const rawText = data.choices?.[0]?.message?.content || '';
  const parsed = parseAIJson(rawText) || { raw_analysis: rawText };

  const output = { ...extra, ...parsed };

  await saveAIResult(pool, {
    user_id: req.user?.id,
    feature,
    input: req.body,
    output,
    raw_text: rawText,
    model: data.model || DEFAULT_MODEL,
  });

  res.json(output);
}

/**
 * POST /api/ai/sermon-analyzer
 */
router.post('/sermon-analyzer', async (req, res) => {
  try {
    const { sermon_transcript, speaker, date } = req.body;

    if (!sermon_transcript || typeof sermon_transcript !== 'string' || sermon_transcript.trim().length === 0) {
      return res.status(400).json({ error: 'sermon_transcript is required and must be a non-empty string' });
    }
    if (sermon_transcript.length > 50000) {
      return res.status(400).json({ error: 'sermon_transcript exceeds maximum allowed length of 50,000 characters' });
    }

    const systemPrompt = 'You are an expert religious studies scholar and homiletics analyst. Provide thorough, respectful, and insightful sermon analysis. Respond only with valid JSON.';
    const prompt = `Analyze the following sermon and provide a structured analysis.

Speaker: ${speaker || 'Unknown'}
Date: ${date || 'Not provided'}

Sermon Transcript:
${sermon_transcript.substring(0, 10000)}

Respond with a JSON object containing:
- themes: array of main theological themes (3-5 items, each with "title" and "description")
- scripture_references: array of scripture references found or implied (each with "reference" and "context")
- sentiment: object with "overall" (Positive/Neutral/Challenging), "score" (0-100), and "notes"
- congregation_engagement_suggestions: array of 3-5 actionable suggestions (each with "suggestion" and "rationale")
- summary: 2-3 sentence overall summary of the sermon`;

    await runAIFeature(req, res, {
      feature: 'sermon-analyzer',
      systemPrompt,
      userPrompt: prompt,
      extra: { speaker: speaker || 'Unknown', date: date || null },
    });
  } catch (err) {
    console.error('Sermon analyzer error:', err);
    res.status(500).json({ error: 'Sermon analysis failed', details: err.message });
  }
});

/**
 * POST /api/ai/donation-insights
 */
router.post('/donation-insights', async (req, res) => {
  try {
    const { donations, period } = req.body;

    if (!Array.isArray(donations) || donations.length === 0) {
      return res.status(400).json({ error: 'donations must be a non-empty array' });
    }
    if (donations.length > 1000) {
      return res.status(400).json({ error: 'donations array exceeds maximum of 1,000 records' });
    }

    const systemPrompt = 'You are a nonprofit financial analyst specializing in religious organization fundraising. Respond only with valid JSON.';
    const prompt = `Analyze the following donation data and provide strategic insights.

Period: ${period || 'All time'}
Total Records: ${donations.length}
Donation Data (sample):
${JSON.stringify(donations.slice(0, 50), null, 2)}

Respond with a JSON object containing:
- giving_trends: object with "direction" (Growing/Stable/Declining), "key_observations" (array of 3 observations), and "month_over_month_insight"
- campaign_recommendations: array of 3-4 specific fundraising campaign ideas (each with "name", "description", "target_segment", and "expected_impact")
- major_donor_patterns: object with "threshold_suggested", "count_above_threshold", "retention_strategies" (array of 3 strategies)
- seasonal_patterns: array of months/periods with notably high or low giving with explanations
- summary: 2-3 sentence executive summary`;

    await runAIFeature(req, res, {
      feature: 'donation-insights',
      systemPrompt,
      userPrompt: prompt,
      extra: { period: period || 'All time', total_donations_analyzed: donations.length },
    });
  } catch (err) {
    console.error('Donation insights error:', err);
    res.status(500).json({ error: 'Donation insights generation failed', details: err.message });
  }
});

/**
 * POST /api/ai/prayer-guidance
 */
router.post('/prayer-guidance', async (req, res) => {
  try {
    const { prayer_request_text, category } = req.body;

    if (!prayer_request_text || typeof prayer_request_text !== 'string' || prayer_request_text.trim().length === 0) {
      return res.status(400).json({ error: 'prayer_request_text is required and must be a non-empty string' });
    }
    if (prayer_request_text.length > 5000) {
      return res.status(400).json({ error: 'prayer_request_text exceeds maximum allowed length of 5,000 characters' });
    }

    const systemPrompt = 'You are a compassionate, experienced pastoral counselor and chaplain with deep knowledge of scripture. Provide sensitive, respectful, and spiritually grounded guidance. Respond only with valid JSON.';
    const prompt = `Provide pastoral guidance for the following prayer request.

Category: ${category || 'General'}
Prayer Request:
${prayer_request_text}

Respond with a JSON object containing:
- pastoral_response_suggestions: array of 3 thoughtful response approaches (each with "approach", "sample_response", and "tone")
- scripture_references: array of 3-5 relevant scripture passages (each with "reference", "text_summary", and "relevance")
- follow_up_actions: array of 3-4 recommended pastoral follow-up steps (each with "action", "timing", and "purpose")
- sensitivity_notes: any specific pastoral care considerations for this type of request
- prayer_suggestion: a brief sample intercessory prayer (2-3 sentences)`;

    await runAIFeature(req, res, {
      feature: 'prayer-guidance',
      systemPrompt,
      userPrompt: prompt,
      extra: { category: category || 'General' },
    });
  } catch (err) {
    console.error('Prayer guidance error:', err);
    res.status(500).json({ error: 'Prayer guidance generation failed', details: err.message });
  }
});

/**
 * POST /api/ai/member-engagement
 */
router.post('/member-engagement', async (req, res) => {
  try {
    const { member_data, attendance_history } = req.body;

    if (!Array.isArray(member_data) || member_data.length === 0) {
      return res.status(400).json({ error: 'member_data must be a non-empty array' });
    }
    if (member_data.length > 500) {
      return res.status(400).json({ error: 'member_data array exceeds maximum of 500 records' });
    }

    const systemPrompt = 'You are a church growth and member engagement specialist with expertise in retention strategies. Respond only with valid JSON.';
    const prompt = `Analyze member engagement data and identify at-risk members and re-engagement opportunities.

Member Count: ${member_data.length}
Member Data (sample):
${JSON.stringify(member_data.slice(0, 30), null, 2)}

${attendance_history ? `Attendance History (sample):\n${JSON.stringify(Array.isArray(attendance_history) ? attendance_history.slice(0, 20) : attendance_history, null, 2)}` : ''}

Respond with a JSON object containing:
- at_risk_members: array of member identifiers/profiles showing signs of disengagement with "risk_indicators" for each
- engagement_tiers: object categorizing members into "highly_engaged", "moderately_engaged", "at_risk", "lapsed" with counts and criteria
- re_engagement_strategies: array of 4-5 specific strategies (each with "strategy", "target_group", "implementation_steps", and "expected_outcome")
- retention_insights: 3 key observations about overall congregational health
- recommended_outreach_priority: ranked list of members or groups requiring immediate attention`;

    await runAIFeature(req, res, {
      feature: 'member-engagement',
      systemPrompt,
      userPrompt: prompt,
      extra: { total_members_analyzed: member_data.length },
    });
  } catch (err) {
    console.error('Member engagement error:', err);
    res.status(500).json({ error: 'Member engagement analysis failed', details: err.message });
  }
});

/**
 * POST /api/ai/event-planner
 */
router.post('/event-planner', async (req, res) => {
  try {
    const { event_type, expected_attendance, budget } = req.body;

    if (!event_type || typeof event_type !== 'string' || event_type.trim().length === 0) {
      return res.status(400).json({ error: 'event_type is required and must be a non-empty string' });
    }

    const attendanceNum = parseInt(expected_attendance);
    if (expected_attendance !== undefined && (isNaN(attendanceNum) || attendanceNum < 1)) {
      return res.status(400).json({ error: 'expected_attendance must be a positive integer' });
    }

    const budgetNum = parseFloat(budget);
    if (budget !== undefined && (isNaN(budgetNum) || budgetNum < 0)) {
      return res.status(400).json({ error: 'budget must be a non-negative number' });
    }

    const systemPrompt = 'You are an experienced religious event coordinator with expertise in planning worship services, community events, and outreach programs. Respond only with valid JSON.';
    const prompt = `Create a comprehensive event plan for a religious organization event.

Event Type: ${event_type}
Expected Attendance: ${expected_attendance || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}

Respond with a JSON object containing:
- logistics_checklist: array of checklist items organized by "category" (Venue, Audio/Visual, Catering, Registration, Safety) each with "items" array and "timeline"
- volunteer_requirements: object with "total_volunteers_needed", "roles" (array of roles with "title", "count", "responsibilities", and "skills_needed")
- promotion_suggestions: array of 4-5 promotion channels/tactics (each with "channel", "content_idea", "timeline", and "estimated_reach")
- budget_breakdown: object with suggested allocation percentages by category (if budget provided)
- timeline: week-by-week preparation timeline from 4 weeks out to event day
- success_metrics: how to measure event success post-event`;

    await runAIFeature(req, res, {
      feature: 'event-planner',
      systemPrompt,
      userPrompt: prompt,
      extra: {
        event_type,
        expected_attendance: attendanceNum || null,
        budget: budgetNum || null,
      },
    });
  } catch (err) {
    console.error('Event planner error:', err);
    res.status(500).json({ error: 'Event plan generation failed', details: err.message });
  }
});

/**
 * POST /api/ai/outreach-strategy
 */
router.post('/outreach-strategy', async (req, res) => {
  try {
    const { community_demographics, current_programs } = req.body;

    if (!community_demographics || (typeof community_demographics !== 'object' && typeof community_demographics !== 'string')) {
      return res.status(400).json({ error: 'community_demographics is required (object or descriptive string)' });
    }

    const systemPrompt = 'You are a community outreach strategist specializing in religious organization growth, community engagement, and interfaith partnerships. Respond only with valid JSON.';
    const prompt = `Develop a comprehensive outreach strategy based on the following community profile.

Community Demographics:
${typeof community_demographics === 'string' ? community_demographics : JSON.stringify(community_demographics, null, 2)}

Current Programs:
${Array.isArray(current_programs) ? current_programs.join(', ') : (current_programs || 'None specified')}

Respond with a JSON object containing:
- outreach_recommendations: array of 5-6 specific outreach initiatives (each with "initiative", "target_group", "description", "implementation_steps", "estimated_cost", and "expected_impact")
- partnership_suggestions: array of 4-5 potential community partners (each with "organization_type", "partnership_type", "mutual_benefits", and "approach_strategy")
- gap_analysis: assessment of underserved groups in the community and how the organization can address them
- digital_outreach: specific social media and online engagement strategies tailored to the demographics
- timeline: phased 12-month implementation roadmap
- key_performance_indicators: metrics to track outreach effectiveness`;

    await runAIFeature(req, res, {
      feature: 'outreach-strategy',
      systemPrompt,
      userPrompt: prompt,
      extra: { current_programs_count: Array.isArray(current_programs) ? current_programs.length : 0 },
    });
  } catch (err) {
    console.error('Outreach strategy error:', err);
    res.status(500).json({ error: 'Outreach strategy generation failed', details: err.message });
  }
});

/**
 * POST /api/ai/sermon-qa
 * Audit-proposed feature #1: Sermon QA Bot - index transcripts, allow members to ask questions about previous sermons.
 */
router.post('/sermon-qa', async (req, res) => {
  try {
    const { question, sermon_ids } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required.' });
    }

    // Pull sermon transcripts from db (filtered by sermon_ids if provided)
    let sermonRows;
    if (Array.isArray(sermon_ids) && sermon_ids.length > 0) {
      sermonRows = await pool.query(
        'SELECT id, title, speaker, date, transcript, summary FROM sermons WHERE id = ANY($1::int[]) ORDER BY date DESC',
        [sermon_ids]
      );
    } else {
      sermonRows = await pool.query(
        'SELECT id, title, speaker, date, transcript, summary FROM sermons ORDER BY date DESC LIMIT 20'
      );
    }

    if (sermonRows.rows.length === 0) {
      return res.json({ answer: 'No sermons available to search.', citations: [] });
    }

    const corpus = sermonRows.rows.map(s =>
      `[Sermon ID ${s.id}] "${s.title}" by ${s.speaker} (${s.date ? new Date(s.date).toISOString().slice(0, 10) : 'n/a'})\n${(s.transcript || s.summary || '').slice(0, 4000)}`
    ).join('\n\n---\n\n');

    const systemPrompt = 'You are a sermon QA assistant. Answer questions citing the sermons by their ID. Respond ONLY with valid JSON.';
    const prompt = `Question: ${question}

Available Sermons:
${corpus}

Return JSON: { answer: string (2-4 paragraphs), citations: [{ sermon_id, title, relevance: "high"|"medium"|"low", quote: brief excerpt }], related_questions: array of 3 follow-ups }`;

    await runAIFeature(req, res, {
      feature: 'sermon-qa',
      systemPrompt,
      userPrompt: prompt,
      extra: { searched_sermon_count: sermonRows.rows.length },
    });
  } catch (err) {
    console.error('Sermon QA error:', err);
    res.status(500).json({ error: 'Sermon QA failed', details: err.message });
  }
});

/**
 * POST /api/ai/volunteer-burnout
 * Audit-proposed feature #5: detect at-risk volunteers based on engagement patterns.
 */
router.post('/volunteer-burnout', async (req, res) => {
  try {
    const { volunteer_logs } = req.body;

    let logsData;
    if (Array.isArray(volunteer_logs) && volunteer_logs.length > 0) {
      logsData = volunteer_logs;
    } else {
      // Try to load from db if exists
      try {
        const result = await pool.query(
          'SELECT id, name, skills, availability, assigned_ministry, hours_logged, status, join_date FROM volunteers ORDER BY hours_logged DESC NULLS LAST LIMIT 50'
        );
        logsData = result.rows;
      } catch {
        logsData = [];
      }
    }

    if (logsData.length === 0) {
      return res.status(400).json({ error: 'volunteer_logs array is required (or volunteers table must contain data).' });
    }

    const systemPrompt = 'You are a volunteer engagement specialist who identifies burnout risk in nonprofit/religious volunteers. Respond ONLY with valid JSON.';
    const prompt = `Analyze the following volunteer activity data and detect burnout risk:

${JSON.stringify(logsData.slice(0, 50), null, 2)}

Return JSON with keys:
- at_risk_volunteers: array of { id, name, risk_score (0-100), risk_factors: [], suggested_intervention }
- workload_distribution: { overworked_count, balanced_count, underutilized_count }
- recommendations: array of 3-5 program-level changes
- early_warning_signs: list of behavioral patterns to watch
- summary: 2-sentence overview`;

    await runAIFeature(req, res, {
      feature: 'volunteer-burnout',
      systemPrompt,
      userPrompt: prompt,
      extra: { volunteers_analyzed: logsData.length },
    });
  } catch (err) {
    console.error('Volunteer burnout error:', err);
    res.status(500).json({ error: 'Volunteer burnout analysis failed', details: err.message });
  }
});

/**
 * POST /api/ai/prayer-categorize
 * Audit-proposed feature #6: auto-tag prayer requests by topic.
 */
router.post('/prayer-categorize', async (req, res) => {
  try {
    const { prayer_requests } = req.body;
    if (!Array.isArray(prayer_requests) || prayer_requests.length === 0) {
      return res.status(400).json({ error: 'prayer_requests array is required.' });
    }
    if (prayer_requests.length > 100) {
      return res.status(400).json({ error: 'prayer_requests array exceeds maximum of 100.' });
    }

    const systemPrompt = 'You are a pastoral care assistant. Categorize prayer requests into topical groups for routing. Respond ONLY with valid JSON.';
    const prompt = `Categorize each of the following prayer requests into one or more topics. Topics include: Health, Financial, Family, Spiritual, Career, Bereavement, Relationships, Community, World Events, Other.

Prayer Requests:
${JSON.stringify(prayer_requests.slice(0, 100), null, 2)}

Return JSON array where each item is: { request_id, request_excerpt, primary_topic, secondary_topics: [], suggested_group: string (e.g. "Health Ministry", "Grief Care Group"), urgency: "low"|"medium"|"high" }`;

    await runAIFeature(req, res, {
      feature: 'prayer-categorize',
      systemPrompt,
      userPrompt: prompt,
      extra: { requests_analyzed: prayer_requests.length },
    });
  } catch (err) {
    console.error('Prayer categorize error:', err);
    res.status(500).json({ error: 'Prayer categorization failed', details: err.message });
  }
});

/**
 * POST /api/ai/facility-optimizer
 * Audit-proposed feature #7: facility utilization recommendations.
 */
router.post('/facility-optimizer', async (req, res) => {
  try {
    const { bookings, facilities } = req.body;
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ error: 'bookings array is required.' });
    }

    const systemPrompt = 'You are a facility scheduling optimization expert. Respond ONLY with valid JSON.';
    const prompt = `Given the following facility bookings and (optional) facility list, recommend booking optimizations to reduce conflicts and maximize utilization.

Bookings:
${JSON.stringify(bookings.slice(0, 100), null, 2)}

Facilities:
${facilities ? JSON.stringify(facilities, null, 2) : 'Not provided'}

Return JSON: { conflicts: [{ slot, facility, description }], underused_slots: [{ facility, day_of_week, time_range }], recommendations: array of 5 actionable suggestions, projected_utilization_lift_percent: number }`;

    await runAIFeature(req, res, {
      feature: 'facility-optimizer',
      systemPrompt,
      userPrompt: prompt,
      extra: { bookings_analyzed: bookings.length },
    });
  } catch (err) {
    console.error('Facility optimizer error:', err);
    res.status(500).json({ error: 'Facility optimization failed', details: err.message });
  }
});

module.exports = router;
