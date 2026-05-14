const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - configured from environment
const allowedOrigins = (process.env.CORS_ORIGINS || `http://localhost:${process.env.FRONTEND_PORT || 3000}`)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sermons', require('./routes/sermons'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/members', require('./routes/members'));
app.use('/api/events', require('./routes/events'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/prayers', require('./routes/prayers'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/small-groups', require('./routes/smallgroups'));
app.use('/api/counseling', require('./routes/counseling'));
app.use('/api/outreach', require('./routes/outreach'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-results', require('./routes/aiResults'));
app.use('/api/calendar', require('./routes/calendar'));
// Audit-recommended additions (notifications, reporting, webhooks)
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.use('/api/engagement-coordinator', require('./routes/engagementCoordinator')); // apply pass 6 — audit custom suggestion

app.use('/api/scripture-rag', require('./routes/sermonScriptureRag')); // apply pass 6 — audit custom suggestion

app.use('/api/worship-ops', require('./routes/worshipOpsStream')); // apply pass 6 — audit custom suggestion

app.use('/api/denomination-white-label', require('./routes/denominationWhiteLabel')); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-sermon-transcription-clip-generation-for-soc', require('./routes/gap_no_ai_sermon_transcription_clip_generation_for_soc'));
app.use('/api/gap-no-ai-live-translation-for-multilingual-congregati', require('./routes/gap_no_ai_live_translation_for_multilingual_congregati'));
app.use('/api/gap-no-ai-giving-pattern-fraud-anomaly-detection', require('./routes/gap_no_ai_giving_pattern_fraud_anomaly_detection'));
app.use('/api/gap-no-ai-prayer-request-triage-and-routing', require('./routes/gap_no_ai_prayer_request_triage_and_routing'));
app.use('/api/gap-no-ai-personalized-devotional-content-generation', require('./routes/gap_no_ai_personalized_devotional_content_generation'));
app.use('/api/gap-notification-routes-exist-but-no-sms-push-delivery', require('./routes/gap_notification_routes_exist_but_no_sms_push_delivery'));
app.use('/api/gap-no-export-reporting-for-tax-receipt-generation', require('./routes/gap_no_export_reporting_for_tax_receipt_generation'));
app.use('/api/gap-no-direct-chms-api-client-planning-center-church-c', require('./routes/gap_no_direct_chms_api_client_planning_center_church_c'));
app.use('/api/gap-no-livestream-giving-page-integration', require('./routes/gap_no_livestream_giving_page_integration'));
app.use('/api/gap-no-mobile-app-for-members', require('./routes/gap_no_mobile_app_for_members'));
app.use('/api/gap-no-shift-swap-workflow-on-volunteer-scheduling', require('./routes/gap_no_shift_swap_workflow_on_volunteer_scheduling'));
