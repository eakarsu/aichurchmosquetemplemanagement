const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'temple_management',
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...');

    // Drop tables
    await client.query(`
      DROP TABLE IF EXISTS outreach CASCADE;
      DROP TABLE IF EXISTS counseling CASCADE;
      DROP TABLE IF EXISTS small_groups CASCADE;
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS announcements CASCADE;
      DROP TABLE IF EXISTS facilities CASCADE;
      DROP TABLE IF EXISTS prayers CASCADE;
      DROP TABLE IF EXISTS volunteers CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS members CASCADE;
      DROP TABLE IF EXISTS donations CASCADE;
      DROP TABLE IF EXISTS sermons CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Dropped existing tables.');

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create sermons table
    await client.query(`
      CREATE TABLE sermons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        speaker VARCHAR(255),
        date DATE,
        duration INTEGER,
        scripture_text TEXT,
        transcript TEXT,
        summary TEXT,
        tags VARCHAR[],
        audio_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'archived',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create donations table
    await client.query(`
      CREATE TABLE donations (
        id SERIAL PRIMARY KEY,
        donor_name VARCHAR(255),
        donor_email VARCHAR(255),
        amount DECIMAL(10,2),
        date DATE,
        category VARCHAR(100),
        payment_method VARCHAR(50),
        tax_receipt_sent BOOLEAN DEFAULT false,
        tax_receipt_number VARCHAR(100),
        notes TEXT,
        recurring BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create members table
    await client.query(`
      CREATE TABLE members (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        join_date DATE,
        membership_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        groups VARCHAR[],
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create events table
    await client.query(`
      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        event_date TIMESTAMP,
        end_date TIMESTAMP,
        location VARCHAR(255),
        category VARCHAR(100),
        max_attendees INTEGER,
        current_attendees INTEGER DEFAULT 0,
        organizer VARCHAR(255),
        status VARCHAR(50) DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create volunteers table
    await client.query(`
      CREATE TABLE volunteers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        skills VARCHAR[],
        availability VARCHAR[],
        assigned_ministry VARCHAR(100),
        hours_logged DECIMAL(6,1),
        status VARCHAR(50) DEFAULT 'active',
        join_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create prayers table
    await client.query(`
      CREATE TABLE prayers (
        id SERIAL PRIMARY KEY,
        requester_name VARCHAR(255),
        request_type VARCHAR(100),
        prayer_text TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'active',
        ai_guidance TEXT,
        prayer_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create facilities table
    await client.query(`
      CREATE TABLE facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        capacity INTEGER,
        amenities VARCHAR[],
        hourly_rate DECIMAL(8,2),
        status VARCHAR(50) DEFAULT 'available',
        booking_date DATE,
        booking_time VARCHAR(50),
        booked_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create announcements table
    await client.query(`
      CREATE TABLE announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        content TEXT,
        author VARCHAR(255),
        category VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'normal',
        publish_date DATE,
        expiry_date DATE,
        target_audience VARCHAR(100),
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('All tables created.');

    // Seed users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await client.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ['admin@temple.org', passwordHash, 'Admin User', 'admin']
    );
    console.log('Users seeded.');

    // Seed sermons
    const sermons = [
      { title: 'Finding Peace in Troubled Times', speaker: 'Pastor James Wilson', date: '2025-10-05', duration: 45, scripture: 'Philippians 4:6-7 - Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', transcript: 'Today we gather in a time of uncertainty. Many of us carry burdens that seem too heavy. But scripture reminds us that peace is not the absence of trouble; it is the presence of God in the midst of trouble. Let us explore how we can find that deep, abiding peace even when the storms of life rage around us. The apostle Paul wrote these words from prison, showing us that peace transcends circumstances.', tags: ['peace', 'anxiety', 'faith'], status: 'archived' },
      { title: 'The Power of Forgiveness', speaker: 'Imam Ahmed Hassan', date: '2025-10-12', duration: 40, scripture: 'Surah Ash-Shura 42:43 - And whoever is patient and forgives, indeed that is of the matters requiring resolve.', transcript: 'Forgiveness is one of the most powerful acts a human being can perform. It liberates not only the one who is forgiven but also the one who forgives. In our tradition, forgiveness is a divine attribute, and when we practice it, we draw closer to the divine. Today we will explore how forgiveness heals communities, mends broken relationships, and restores our inner peace.', tags: ['forgiveness', 'healing', 'community'], status: 'archived' },
      { title: 'Walking in Faith', speaker: 'Rabbi Sarah Cohen', date: '2025-10-19', duration: 35, scripture: 'Proverbs 3:5-6 - Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', transcript: 'Faith is not a one-time decision but a daily walk. Each morning we choose to trust, to believe, to step forward even when we cannot see the path ahead. The great figures of our tradition were all people who walked in faith — Abraham left his homeland, Moses led a nation through the wilderness, Ruth followed Naomi to a foreign land. What does walking in faith look like in our modern lives?', tags: ['faith', 'trust', 'journey'], status: 'archived' },
      { title: 'Love Your Neighbor', speaker: 'Rev. Maria Santos', date: '2025-11-02', duration: 50, scripture: 'Matthew 22:39 - Love your neighbor as yourself.', transcript: 'The command to love our neighbor is perhaps the most challenging teaching in all of scripture. It is easy to love those who are like us, who agree with us, who support us. But the true test of love is how we treat those who are different, those who challenge us, those who may even oppose us. Today we explore what it truly means to love our neighbor in a divided world, and how radical love can transform our communities.', tags: ['love', 'community', 'compassion'], status: 'archived' },
      { title: 'Gratitude in All Seasons', speaker: 'Minister David Park', date: '2025-11-09', duration: 30, scripture: '1 Thessalonians 5:18 - Give thanks in all circumstances; for this is Gods will for you.', transcript: 'Gratitude is not just for times of abundance. True gratitude shines brightest in seasons of scarcity and struggle. When we practice thankfulness even in difficult times, we shift our perspective from what we lack to what we have been given. Scientific research confirms what spiritual traditions have taught for millennia: grateful people are happier, healthier, and more resilient. Let us cultivate a spirit of gratitude together.', tags: ['gratitude', 'thankfulness', 'seasons'], status: 'archived' },
      { title: 'The Path to Wisdom', speaker: 'Pastor James Wilson', date: '2025-11-16', duration: 42, scripture: 'James 1:5 - If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', transcript: 'Wisdom is different from knowledge. Knowledge fills our minds; wisdom fills our hearts. In a world overflowing with information, we are starving for wisdom. Today we explore the ancient paths to wisdom — through prayer, through experience, through community, through the study of sacred texts. True wisdom leads to humility, compassion, and right action.', tags: ['wisdom', 'knowledge', 'prayer'], status: 'archived' },
      { title: 'Strength Through Unity', speaker: 'Imam Ahmed Hassan', date: '2025-11-23', duration: 38, scripture: 'Surah Al-Hujurat 49:13 - O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another.', transcript: 'Our diversity is not a weakness; it is our greatest strength. When we come together across our differences, we create something far more powerful than any individual could achieve alone. The fabric of our community is woven from many threads — different colors, different textures — but together they create something beautiful and strong. Let us recommit to unity while celebrating our wonderful diversity.', tags: ['unity', 'diversity', 'strength'], status: 'archived' },
      { title: 'Hope in Darkness', speaker: 'Rabbi Sarah Cohen', date: '2025-12-07', duration: 48, scripture: 'Psalm 30:5 - Weeping may stay for the night, but rejoicing comes in the morning.', transcript: 'There are times in life when darkness seems to surround us completely. We cannot see the way forward, and we wonder if the light will ever return. But the darkest hour is just before dawn. Our tradition teaches us that hope is not naive optimism; it is a fierce determination to believe in the possibility of light even in the deepest darkness. The Hanukkah candles remind us that a small flame can push back great darkness.', tags: ['hope', 'darkness', 'light', 'perseverance'], status: 'archived' },
      { title: 'The Joy of Giving', speaker: 'Rev. Maria Santos', date: '2025-12-14', duration: 33, scripture: 'Acts 20:35 - It is more blessed to give than to receive.', transcript: 'In a culture that emphasizes acquiring and consuming, the spiritual practice of giving is countercultural and transformative. When we give — whether it is our time, our talents, or our treasure — we participate in the divine flow of generosity. Giving breaks the grip of materialism on our hearts and connects us to something larger than ourselves. Today we celebrate the joy that comes from open-handed living.', tags: ['giving', 'generosity', 'joy'], status: 'archived' },
      { title: 'Compassion Without Borders', speaker: 'Minister David Park', date: '2025-12-21', duration: 55, scripture: 'Micah 6:8 - He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.', transcript: 'Compassion knows no borders — no national borders, no racial borders, no religious borders. When we see suffering, our hearts are called to respond regardless of who is suffering or where they come from. Today we explore how compassion moves us beyond our comfort zones and into a larger world of connection and service. True compassion is not just feeling for others; it is acting on their behalf.', tags: ['compassion', 'justice', 'mercy'], status: 'archived' },
      { title: 'Building Bridges of Understanding', speaker: 'Pastor James Wilson', date: '2026-01-04', duration: 44, scripture: 'Romans 12:18 - If it is possible, as far as it depends on you, live at peace with everyone.', transcript: 'In an age of division and polarization, building bridges of understanding is sacred work. It requires us to listen before we speak, to seek to understand before demanding to be understood. Bridge-building is not about compromising our convictions but about extending our compassion. Today we learn practical steps for building bridges in our families, our communities, and our world.', tags: ['understanding', 'peace', 'bridge-building'], status: 'archived' },
      { title: 'The Sacred Journey', speaker: 'Imam Ahmed Hassan', date: '2026-01-18', duration: 41, scripture: 'Surah Al-Ankabut 29:69 - And those who strive for Us, We will surely guide them to Our ways. And indeed, God is with the doers of good.', transcript: 'Life itself is a sacred journey. Every step we take, every challenge we face, every joy we experience is part of a larger pilgrimage toward meaning and connection with the divine. The journey is not always easy, and the path is not always clear, but we are assured that we do not walk alone. Today we reflect on our individual journeys and find the sacred in the ordinary moments of our lives.', tags: ['journey', 'pilgrimage', 'sacred'], status: 'archived' },
      { title: 'Embracing Change with Grace', speaker: 'Rabbi Sarah Cohen', date: '2026-02-01', duration: 36, scripture: 'Ecclesiastes 3:1 - There is a time for everything, and a season for every activity under the heavens.', transcript: 'Change is the one constant in life, yet we often resist it with all our might. Whether it is a change in our personal lives, our community, or our world, the ability to embrace change with grace is a mark of spiritual maturity. Today we explore how our tradition teaches us to navigate transitions, to let go of what was, and to embrace what is becoming, all while maintaining our core identity and values.', tags: ['change', 'grace', 'seasons', 'transition'], status: 'archived' },
      { title: 'Mindful Living', speaker: 'Rev. Maria Santos', date: '2026-02-15', duration: 29, scripture: 'Psalm 46:10 - Be still, and know that I am God.', transcript: 'In our fast-paced, always-connected world, the practice of mindfulness is a spiritual discipline that brings us back to the present moment. When we are fully present, we can see the beauty around us, hear the voice of the divine, and connect deeply with one another. Mindful living is not about emptying our minds but about filling our awareness with what truly matters. Today we practice being still and knowing.', tags: ['mindfulness', 'stillness', 'presence'], status: 'archived' },
      { title: 'The Light Within', speaker: 'Minister David Park', date: '2026-03-01', duration: 47, scripture: 'Matthew 5:14-16 - You are the light of the world. A town built on a hill cannot be hidden.', transcript: 'Each of us carries a divine light within us. This light is our truest self — the spark of the divine that gives us worth, purpose, and power. Sometimes that light feels dim, covered by doubt, fear, or pain. But it never goes out. Today we explore how to tend the light within, how to let it shine brightly, and how our individual lights together illuminate the world around us. You are the light of the world — let your light shine.', tags: ['light', 'purpose', 'identity', 'calling'], status: 'archived' },
    ];

    for (const s of sermons) {
      await client.query(
        `INSERT INTO sermons (title, speaker, date, duration, scripture_text, transcript, summary, tags, audio_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.title, s.speaker, s.date, s.duration, s.scripture, s.transcript, null, s.tags, null, s.status]
      );
    }
    console.log('Sermons seeded (15).');

    // Seed donations
    const donations = [
      { donor_name: 'John Smith', donor_email: 'john.smith@email.com', amount: 500.00, date: '2025-10-15', category: 'tithe', payment_method: 'check', tax_receipt_sent: true, tax_receipt_number: 'TR-2025-001', notes: 'Monthly tithe', recurring: true },
      { donor_name: 'Sarah Johnson', donor_email: 'sarah.j@email.com', amount: 250.00, date: '2025-10-22', category: 'offering', payment_method: 'credit_card', tax_receipt_sent: false, notes: 'Sunday offering', recurring: false },
      { donor_name: 'Michael Chen', donor_email: 'mchen@email.com', amount: 1000.00, date: '2025-11-01', category: 'building_fund', payment_method: 'bank_transfer', tax_receipt_sent: true, tax_receipt_number: 'TR-2025-002', notes: 'Building renovation contribution', recurring: false },
      { donor_name: 'Fatima Al-Rashid', donor_email: 'fatima.r@email.com', amount: 75.00, date: '2025-11-10', category: 'charity', payment_method: 'cash', tax_receipt_sent: false, notes: 'Zakat contribution', recurring: true },
      { donor_name: 'David Williams', donor_email: 'dwilliams@email.com', amount: 5000.00, date: '2025-11-15', category: 'building_fund', payment_method: 'bank_transfer', tax_receipt_sent: true, tax_receipt_number: 'TR-2025-003', notes: 'Major building fund donation', recurring: false },
      { donor_name: 'Emily Rodriguez', donor_email: 'emily.r@email.com', amount: 150.00, date: '2025-11-20', category: 'youth_program', payment_method: 'online', tax_receipt_sent: false, notes: 'Youth retreat sponsorship', recurring: false },
      { donor_name: 'Robert Kim', donor_email: 'rkim@email.com', amount: 300.00, date: '2025-12-01', category: 'tithe', payment_method: 'credit_card', tax_receipt_sent: true, tax_receipt_number: 'TR-2025-004', notes: 'December tithe', recurring: true },
      { donor_name: 'Lisa Thompson', donor_email: 'lisa.t@email.com', amount: 25.00, date: '2025-12-10', category: 'general', payment_method: 'cash', tax_receipt_sent: false, notes: 'Weekly offering', recurring: true },
      { donor_name: 'Ahmed Patel', donor_email: 'apatel@email.com', amount: 2000.00, date: '2025-12-20', category: 'mission', payment_method: 'bank_transfer', tax_receipt_sent: true, tax_receipt_number: 'TR-2025-005', notes: 'Mission trip funding', recurring: false },
      { donor_name: 'Grace Okafor', donor_email: 'grace.o@email.com', amount: 400.00, date: '2026-01-05', category: 'tithe', payment_method: 'online', tax_receipt_sent: false, notes: 'January tithe', recurring: true },
      { donor_name: 'James Murphy', donor_email: 'jmurphy@email.com', amount: 100.00, date: '2026-01-15', category: 'offering', payment_method: 'check', tax_receipt_sent: false, notes: 'Special offering', recurring: false },
      { donor_name: 'Yuki Tanaka', donor_email: 'yuki.t@email.com', amount: 750.00, date: '2026-01-25', category: 'charity', payment_method: 'credit_card', tax_receipt_sent: true, tax_receipt_number: 'TR-2026-001', notes: 'Community food bank donation', recurring: false },
      { donor_name: 'Maria Gonzalez', donor_email: 'mgonzalez@email.com', amount: 200.00, date: '2026-02-01', category: 'youth_program', payment_method: 'online', tax_receipt_sent: false, notes: 'Youth music program', recurring: true },
      { donor_name: 'Daniel Brown', donor_email: 'dbrown@email.com', amount: 350.00, date: '2026-02-14', category: 'general', payment_method: 'check', tax_receipt_sent: false, notes: 'Valentine outreach event', recurring: false },
      { donor_name: 'Hannah Lee', donor_email: 'hannah.lee@email.com', amount: 1500.00, date: '2026-03-01', category: 'building_fund', payment_method: 'bank_transfer', tax_receipt_sent: true, tax_receipt_number: 'TR-2026-002', notes: 'New sound system fund', recurring: false },
      { donor_name: 'Samuel Jackson', donor_email: 'sjackson@email.com', amount: 50.00, date: '2026-03-10', category: 'offering', payment_method: 'cash', tax_receipt_sent: false, notes: 'Weekly offering', recurring: true },
    ];

    for (const d of donations) {
      await client.query(
        `INSERT INTO donations (donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent, tax_receipt_number, notes, recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [d.donor_name, d.donor_email, d.amount, d.date, d.category, d.payment_method, d.tax_receipt_sent, d.tax_receipt_number || null, d.notes, d.recurring]
      );
    }
    console.log('Donations seeded (16).');

    // Seed members
    const members = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@email.com', phone: '555-0101', address: '123 Oak Street, Springfield, IL 62701', join_date: '2020-03-15', membership_type: 'elder', status: 'active', groups: ['bible_study', 'prayer_circle'], notes: 'Founding member, very active in community outreach' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@email.com', phone: '555-0102', address: '456 Maple Ave, Springfield, IL 62702', join_date: '2021-06-20', membership_type: 'regular', status: 'active', groups: ['choir', 'outreach'], notes: 'Beautiful singer, leads the alto section' },
      { first_name: 'Michael', last_name: 'Chen', email: 'mchen@email.com', phone: '555-0103', address: '789 Pine Road, Springfield, IL 62703', join_date: '2019-01-10', membership_type: 'elder', status: 'active', groups: ['bible_study', 'sunday_school'], notes: 'Sunday school teacher for adult class' },
      { first_name: 'Fatima', last_name: 'Al-Rashid', email: 'fatima.r@email.com', phone: '555-0104', address: '321 Elm Street, Springfield, IL 62704', join_date: '2022-09-01', membership_type: 'regular', status: 'active', groups: ['prayer_circle', 'outreach'], notes: 'Active in interfaith dialogue initiatives' },
      { first_name: 'David', last_name: 'Williams', email: 'dwilliams@email.com', phone: '555-0105', address: '654 Birch Lane, Springfield, IL 62705', join_date: '2018-05-25', membership_type: 'elder', status: 'active', groups: ['bible_study', 'prayer_circle', 'outreach'], notes: 'Board member, oversees building committee' },
      { first_name: 'Emily', last_name: 'Rodriguez', email: 'emily.r@email.com', phone: '555-0106', address: '987 Cedar Court, Springfield, IL 62706', join_date: '2023-01-15', membership_type: 'volunteer', status: 'active', groups: ['youth_group', 'choir'], notes: 'Youth group leader, amazing with teens' },
      { first_name: 'Robert', last_name: 'Kim', email: 'rkim@email.com', phone: '555-0107', address: '147 Willow Way, Springfield, IL 62707', join_date: '2021-11-08', membership_type: 'regular', status: 'active', groups: ['bible_study'], notes: 'Quiet but faithful attendee' },
      { first_name: 'Lisa', last_name: 'Thompson', email: 'lisa.t@email.com', phone: '555-0108', address: '258 Poplar Drive, Springfield, IL 62708', join_date: '2024-02-20', membership_type: 'new_member', status: 'active', groups: ['sunday_school'], notes: 'Recently joined, attending new member orientation' },
      { first_name: 'Ahmed', last_name: 'Patel', email: 'apatel@email.com', phone: '555-0109', address: '369 Spruce Avenue, Springfield, IL 62709', join_date: '2020-07-12', membership_type: 'regular', status: 'active', groups: ['prayer_circle', 'outreach'], notes: 'Leads community service projects' },
      { first_name: 'Grace', last_name: 'Okafor', email: 'grace.o@email.com', phone: '555-0110', address: '480 Ash Street, Springfield, IL 62710', join_date: '2022-04-30', membership_type: 'regular', status: 'active', groups: ['choir', 'prayer_circle'], notes: 'Soprano in the choir, prayer warrior' },
      { first_name: 'James', last_name: 'Murphy', email: 'jmurphy@email.com', phone: '555-0111', address: '591 Walnut Road, Springfield, IL 62711', join_date: '2023-08-10', membership_type: 'youth', status: 'active', groups: ['youth_group'], notes: 'Active in youth programs, aspiring musician' },
      { first_name: 'Yuki', last_name: 'Tanaka', email: 'yuki.t@email.com', phone: '555-0112', address: '602 Cherry Lane, Springfield, IL 62712', join_date: '2021-03-05', membership_type: 'regular', status: 'active', groups: ['bible_study', 'outreach'], notes: 'Bilingual, helps with translation services' },
      { first_name: 'Maria', last_name: 'Gonzalez', email: 'mgonzalez@email.com', phone: '555-0113', address: '713 Magnolia Blvd, Springfield, IL 62713', join_date: '2019-12-01', membership_type: 'volunteer', status: 'active', groups: ['sunday_school', 'outreach', 'choir'], notes: 'Dedicated volunteer, helps with Spanish ministry' },
      { first_name: 'Daniel', last_name: 'Brown', email: 'dbrown@email.com', phone: '555-0114', address: '824 Sycamore St, Springfield, IL 62714', join_date: '2024-06-15', membership_type: 'new_member', status: 'active', groups: ['bible_study'], notes: 'Transferred from sister congregation' },
      { first_name: 'Hannah', last_name: 'Lee', email: 'hannah.lee@email.com', phone: '555-0115', address: '935 Dogwood Place, Springfield, IL 62715', join_date: '2020-10-20', membership_type: 'elder', status: 'active', groups: ['prayer_circle', 'bible_study', 'choir'], notes: 'Womens ministry coordinator' },
      { first_name: 'Samuel', last_name: 'Jackson', email: 'sjackson@email.com', phone: '555-0116', address: '1046 Redwood Drive, Springfield, IL 62716', join_date: '2025-01-10', membership_type: 'new_member', status: 'active', groups: ['youth_group'], notes: 'College student, joined through campus ministry' },
    ];

    for (const m of members) {
      await client.query(
        `INSERT INTO members (first_name, last_name, email, phone, address, join_date, membership_type, status, groups, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [m.first_name, m.last_name, m.email, m.phone, m.address, m.join_date, m.membership_type, m.status, m.groups, m.notes]
      );
    }
    console.log('Members seeded (16).');

    // Seed events
    const events = [
      { title: 'Sunday Service', description: 'Weekly worship service with sermon, music, and fellowship. All are welcome to join us for a time of spiritual renewal and community connection.', event_date: '2026-03-22 10:00:00', end_date: '2026-03-22 12:00:00', location: 'Main Sanctuary', category: 'worship', max_attendees: 300, current_attendees: 185, organizer: 'Pastor James Wilson', status: 'upcoming' },
      { title: 'Youth Group Meeting', description: 'Weekly gathering for teens and young adults featuring games, discussions, and spiritual growth activities.', event_date: '2026-03-25 18:00:00', end_date: '2026-03-25 20:00:00', location: 'Youth Center', category: 'fellowship', max_attendees: 50, current_attendees: 32, organizer: 'Emily Rodriguez', status: 'upcoming' },
      { title: 'Community Potluck', description: 'Bring your favorite dish and join us for an evening of food, fun, and fellowship. A wonderful opportunity to get to know your neighbors.', event_date: '2026-03-28 17:30:00', end_date: '2026-03-28 20:00:00', location: 'Fellowship Hall', category: 'fellowship', max_attendees: 150, current_attendees: 78, organizer: 'Grace Okafor', status: 'upcoming' },
      { title: 'Bible Study', description: 'In-depth study of the Book of Romans. Open to all levels of biblical knowledge. Study guides provided.', event_date: '2026-03-26 19:00:00', end_date: '2026-03-26 20:30:00', location: 'Library', category: 'education', max_attendees: 30, current_attendees: 22, organizer: 'Michael Chen', status: 'upcoming' },
      { title: 'Choir Practice', description: 'Rehearsal for the Easter celebration concert. All voice parts welcome. No audition required.', event_date: '2026-03-24 18:30:00', end_date: '2026-03-24 20:00:00', location: 'Choir Room', category: 'worship', max_attendees: 40, current_attendees: 28, organizer: 'Sarah Johnson', status: 'upcoming' },
      { title: 'Interfaith Dialogue', description: 'Monthly gathering bringing together members of different faith traditions for respectful conversation and mutual understanding.', event_date: '2026-04-02 19:00:00', end_date: '2026-04-02 21:00:00', location: 'Conference Room A', category: 'education', max_attendees: 40, current_attendees: 15, organizer: 'Imam Ahmed Hassan', status: 'upcoming' },
      { title: 'Charity Gala', description: 'Annual fundraising gala to support local community programs. Formal dinner, live music, and silent auction.', event_date: '2026-04-18 18:00:00', end_date: '2026-04-18 22:00:00', location: 'Fellowship Hall', category: 'fundraiser', max_attendees: 200, current_attendees: 45, organizer: 'David Williams', status: 'upcoming' },
      { title: 'Prayer Breakfast', description: 'Early morning gathering for prayer, light breakfast, and spiritual encouragement to start your week.', event_date: '2026-03-23 07:00:00', end_date: '2026-03-23 08:30:00', location: 'Kitchen', category: 'worship', max_attendees: 50, current_attendees: 30, organizer: 'Hannah Lee', status: 'upcoming' },
      { title: 'Volunteer Orientation', description: 'Introduction session for new volunteers. Learn about ministry opportunities, expectations, and how to get involved.', event_date: '2026-04-05 10:00:00', end_date: '2026-04-05 12:00:00', location: 'Conference Room B', category: 'meeting', max_attendees: 25, current_attendees: 8, organizer: 'Maria Gonzalez', status: 'upcoming' },
      { title: 'Holiday Concert', description: 'Special Easter celebration concert featuring the choir, guest musicians, and congregational singing.', event_date: '2026-04-05 19:00:00', end_date: '2026-04-05 21:00:00', location: 'Main Sanctuary', category: 'worship', max_attendees: 350, current_attendees: 120, organizer: 'Minister David Park', status: 'upcoming' },
      { title: 'Marriage Workshop', description: 'Strengthen your relationship with practical tools and spiritual guidance for married couples and engaged couples.', event_date: '2026-04-12 09:00:00', end_date: '2026-04-12 15:00:00', location: 'Conference Room A', category: 'education', max_attendees: 30, current_attendees: 12, organizer: 'Rev. Maria Santos', status: 'upcoming' },
      { title: 'New Member Welcome', description: 'Welcome reception for new members. Meet the leadership team, learn about ministries, and connect with the community.', event_date: '2026-03-29 11:30:00', end_date: '2026-03-29 13:00:00', location: 'Fellowship Hall', category: 'fellowship', max_attendees: 50, current_attendees: 10, organizer: 'Pastor James Wilson', status: 'upcoming' },
      { title: 'Food Drive', description: 'Community food drive to support local families in need. Drop off non-perishable items or volunteer to sort and distribute.', event_date: '2026-04-10 08:00:00', end_date: '2026-04-10 16:00:00', location: 'Parking Lot', category: 'outreach', max_attendees: 100, current_attendees: 35, organizer: 'Ahmed Patel', status: 'upcoming' },
      { title: 'Mission Trip Info Session', description: 'Learn about our upcoming summer mission trip. Hear from past participants and get details on logistics, costs, and preparation.', event_date: '2026-04-15 19:00:00', end_date: '2026-04-15 20:30:00', location: 'Media Room', category: 'meeting', max_attendees: 40, current_attendees: 18, organizer: 'Robert Kim', status: 'upcoming' },
      { title: 'Annual General Meeting', description: 'Annual business meeting for all members. Review of finances, ministry reports, and election of board members.', event_date: '2026-04-20 18:00:00', end_date: '2026-04-20 20:00:00', location: 'Main Sanctuary', category: 'meeting', max_attendees: 300, current_attendees: 0, organizer: 'David Williams', status: 'upcoming' },
      { title: 'Easter Sunday Service', description: 'Special Easter celebration service with baptisms, communion, and joyful worship. Invite your friends and family!', event_date: '2026-04-05 09:00:00', end_date: '2026-04-05 11:30:00', location: 'Main Sanctuary', category: 'worship', max_attendees: 400, current_attendees: 250, organizer: 'Pastor James Wilson', status: 'upcoming' },
    ];

    for (const e of events) {
      await client.query(
        `INSERT INTO events (title, description, event_date, end_date, location, category, max_attendees, current_attendees, organizer, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [e.title, e.description, e.event_date, e.end_date, e.location, e.category, e.max_attendees, e.current_attendees, e.organizer, e.status]
      );
    }
    console.log('Events seeded (16).');

    // Seed volunteers
    const volunteers = [
      { name: 'Emily Rodriguez', email: 'emily.r@email.com', phone: '555-0106', skills: ['teaching', 'event_planning', 'counseling'], availability: ['weekday_evening', 'weekend_morning'], assigned_ministry: 'youth', hours_logged: 156.5, status: 'active', join_date: '2023-01-15', notes: 'Youth group leader, excellent communicator' },
      { name: 'Maria Gonzalez', email: 'mgonzalez@email.com', phone: '555-0113', skills: ['teaching', 'cooking', 'administration'], availability: ['weekday_morning', 'weekend_morning', 'weekend_afternoon'], assigned_ministry: 'children', hours_logged: 230.0, status: 'active', join_date: '2019-12-01', notes: 'Sunday school coordinator, bilingual' },
      { name: 'Thomas Wright', email: 'twright@email.com', phone: '555-0201', skills: ['music', 'tech'], availability: ['weekday_evening', 'weekend_morning'], assigned_ministry: 'worship', hours_logged: 180.5, status: 'active', join_date: '2021-05-10', notes: 'Sound engineer and backup guitarist' },
      { name: 'Jennifer Adams', email: 'jadams@email.com', phone: '555-0202', skills: ['cooking', 'event_planning', 'administration'], availability: ['flexible'], assigned_ministry: 'hospitality', hours_logged: 95.0, status: 'active', join_date: '2022-08-20', notes: 'Coordinates all church meals and receptions' },
      { name: 'Carlos Rivera', email: 'crivera@email.com', phone: '555-0203', skills: ['driving', 'landscaping', 'tech'], availability: ['weekend_morning', 'weekend_afternoon'], assigned_ministry: 'maintenance', hours_logged: 120.0, status: 'active', join_date: '2023-03-01', notes: 'Maintains church van and grounds' },
      { name: 'Patricia Nelson', email: 'pnelson@email.com', phone: '555-0204', skills: ['counseling', 'teaching'], availability: ['weekday_morning', 'weekday_evening'], assigned_ministry: 'outreach', hours_logged: 210.0, status: 'active', join_date: '2020-02-14', notes: 'Licensed counselor, leads grief support group' },
      { name: 'Kevin Zhang', email: 'kzhang@email.com', phone: '555-0205', skills: ['tech', 'administration'], availability: ['weekday_evening', 'weekend_afternoon'], assigned_ministry: 'media', hours_logged: 145.5, status: 'active', join_date: '2022-01-08', notes: 'Manages website and social media, livestreams services' },
      { name: 'Rachel Foster', email: 'rfoster@email.com', phone: '555-0206', skills: ['childcare', 'teaching', 'music'], availability: ['weekend_morning'], assigned_ministry: 'children', hours_logged: 88.0, status: 'active', join_date: '2023-09-15', notes: 'Nursery volunteer, trained in CPR' },
      { name: 'Andrew Mitchell', email: 'amitchell@email.com', phone: '555-0207', skills: ['event_planning', 'driving', 'cooking'], availability: ['flexible'], assigned_ministry: 'hospitality', hours_logged: 67.5, status: 'active', join_date: '2024-01-20', notes: 'New volunteer, very enthusiastic' },
      { name: 'Sophia Clark', email: 'sclark@email.com', phone: '555-0208', skills: ['music', 'teaching'], availability: ['weekday_evening', 'weekend_morning'], assigned_ministry: 'worship', hours_logged: 200.0, status: 'active', join_date: '2020-06-30', notes: 'Choir director, piano accompanist' },
      { name: 'Marcus Johnson', email: 'mjohnson@email.com', phone: '555-0209', skills: ['landscaping', 'driving'], availability: ['weekend_morning', 'weekend_afternoon'], assigned_ministry: 'maintenance', hours_logged: 75.0, status: 'active', join_date: '2024-04-10', notes: 'Helps with building maintenance on weekends' },
      { name: 'Laura Bennett', email: 'lbennett@email.com', phone: '555-0210', skills: ['administration', 'event_planning', 'counseling'], availability: ['weekday_morning'], assigned_ministry: 'administration', hours_logged: 310.0, status: 'active', join_date: '2019-06-01', notes: 'Office volunteer, handles scheduling and correspondence' },
      { name: 'Nathan Cooper', email: 'ncooper@email.com', phone: '555-0211', skills: ['tech', 'music'], availability: ['weekday_evening'], assigned_ministry: 'media', hours_logged: 55.0, status: 'active', join_date: '2025-02-01', notes: 'New media team member, graphic design skills' },
      { name: 'Diana Morales', email: 'dmorales@email.com', phone: '555-0212', skills: ['cooking', 'childcare', 'teaching'], availability: ['weekend_morning', 'weekend_afternoon', 'flexible'], assigned_ministry: 'children', hours_logged: 130.0, status: 'active', join_date: '2021-09-15', notes: 'VBS coordinator, creative program planner' },
      { name: 'Peter Nguyen', email: 'pnguyen@email.com', phone: '555-0213', skills: ['driving', 'event_planning'], availability: ['weekday_evening', 'weekend_afternoon'], assigned_ministry: 'outreach', hours_logged: 45.0, status: 'active', join_date: '2025-06-01', notes: 'Drives for meal delivery program' },
      { name: 'Christine Taylor', email: 'ctaylor@email.com', phone: '555-0214', skills: ['counseling', 'administration', 'teaching'], availability: ['weekday_morning', 'weekday_evening'], assigned_ministry: 'youth', hours_logged: 98.0, status: 'active', join_date: '2023-11-01', notes: 'Youth mentor, helps with college preparation workshops' },
    ];

    for (const v of volunteers) {
      await client.query(
        `INSERT INTO volunteers (name, email, phone, skills, availability, assigned_ministry, hours_logged, status, join_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [v.name, v.email, v.phone, v.skills, v.availability, v.assigned_ministry, v.hours_logged, v.status, v.join_date, v.notes]
      );
    }
    console.log('Volunteers seeded (16).');

    // Seed prayers
    const prayers = [
      { requester_name: 'John Smith', request_type: 'healing', prayer_text: 'Please pray for my mother who is recovering from surgery. She is 78 years old and the recovery has been slow. We trust in Gods healing power.', is_anonymous: false, status: 'active', prayer_count: 24 },
      { requester_name: 'Anonymous', request_type: 'guidance', prayer_text: 'I am facing a major career decision and need wisdom and clarity. I have two job offers and I want to choose the path that aligns with Gods plan for my life.', is_anonymous: true, status: 'active', prayer_count: 15 },
      { requester_name: 'Grace Okafor', request_type: 'gratitude', prayer_text: 'I want to give thanks for the safe arrival of my grandson. Both mother and baby are healthy, and our family is overjoyed. God is good!', is_anonymous: false, status: 'active', prayer_count: 31 },
      { requester_name: 'Ahmed Patel', request_type: 'family', prayer_text: 'Please pray for my family as we navigate a difficult season. My parents are aging and need more care, and we are trying to balance work, family, and their needs.', is_anonymous: false, status: 'active', prayer_count: 18 },
      { requester_name: 'Anonymous', request_type: 'financial', prayer_text: 'I lost my job last month and am struggling to pay bills. I pray for provision and for a new employment opportunity that will allow me to provide for my family.', is_anonymous: true, status: 'active', prayer_count: 42 },
      { requester_name: 'Sarah Johnson', request_type: 'spiritual_growth', prayer_text: 'I desire to deepen my faith and grow closer to God. Please pray that I develop discipline in daily prayer and scripture reading.', is_anonymous: false, status: 'active', prayer_count: 12 },
      { requester_name: 'David Williams', request_type: 'community', prayer_text: 'Please pray for our neighborhood which has been affected by recent flooding. Many families have lost belongings and need support and comfort.', is_anonymous: false, status: 'active', prayer_count: 56 },
      { requester_name: 'Anonymous', request_type: 'peace', prayer_text: 'I am struggling with anxiety and cannot find peace. The world feels overwhelming and I need Gods peace that surpasses understanding.', is_anonymous: true, status: 'active', prayer_count: 37 },
      { requester_name: 'Lisa Thompson', request_type: 'healing', prayer_text: 'My husband has been diagnosed with diabetes and we are adjusting to a new lifestyle. Prayers for his health and our family as we make these changes together.', is_anonymous: false, status: 'active', prayer_count: 20 },
      { requester_name: 'Michael Chen', request_type: 'guidance', prayer_text: 'Our family is considering relocating for my wifes job. We need wisdom about whether to leave our community and how to make this transition if it is Gods will.', is_anonymous: false, status: 'active', prayer_count: 14 },
      { requester_name: 'Anonymous', request_type: 'family', prayer_text: 'Please pray for reconciliation with my estranged sibling. We havent spoken in two years and I miss them terribly. I pray for healing and restoration.', is_anonymous: true, status: 'active', prayer_count: 28 },
      { requester_name: 'Emily Rodriguez', request_type: 'community', prayer_text: 'Please pray for the youth in our community who are struggling with mental health issues. May they find hope, support, and the help they need.', is_anonymous: false, status: 'active', prayer_count: 45 },
      { requester_name: 'Robert Kim', request_type: 'spiritual_growth', prayer_text: 'I want to discover my spiritual gifts and find my place of service in the community. Please pray for clarity and direction.', is_anonymous: false, status: 'active', prayer_count: 9 },
      { requester_name: 'Anonymous', request_type: 'healing', prayer_text: 'I am battling depression and some days it is hard to get out of bed. Please pray for strength, healing, and the courage to seek professional help.', is_anonymous: true, status: 'active', prayer_count: 51 },
      { requester_name: 'Hannah Lee', request_type: 'gratitude', prayer_text: 'Thank you God for answered prayers. My daughter got accepted into her dream college with a full scholarship. We are so grateful for this blessing.', is_anonymous: false, status: 'active', prayer_count: 33 },
      { requester_name: 'James Murphy', request_type: 'peace', prayer_text: 'As a college student, I am overwhelmed with the pressure of academics, social life, and figuring out my future. I pray for peace and Gods guidance.', is_anonymous: false, status: 'active', prayer_count: 16 },
    ];

    for (const p of prayers) {
      await client.query(
        `INSERT INTO prayers (requester_name, request_type, prayer_text, is_anonymous, status, prayer_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.requester_name, p.request_type, p.prayer_text, p.is_anonymous, p.status, p.prayer_count]
      );
    }
    console.log('Prayers seeded (16).');

    // Seed facilities
    const facilities = [
      { name: 'Main Sanctuary', description: 'Primary worship space with traditional and modern worship capabilities. Features stained glass windows and excellent acoustics.', capacity: 400, amenities: ['projector', 'sound_system', 'wifi', 'ac', 'piano'], hourly_rate: 0.00, status: 'available', notes: 'Reserved for Sunday services 8am-1pm' },
      { name: 'Fellowship Hall', description: 'Large multipurpose room ideal for dinners, receptions, and large gatherings. Includes adjacent kitchen access.', capacity: 200, amenities: ['projector', 'sound_system', 'wifi', 'kitchen_access', 'ac'], hourly_rate: 75.00, status: 'available', notes: 'Tables and chairs for 150 included' },
      { name: 'Youth Center', description: 'Dedicated space for youth activities with game area, small stage, and comfortable seating.', capacity: 60, amenities: ['projector', 'sound_system', 'wifi', 'ac'], hourly_rate: 40.00, status: 'available', notes: 'Includes foosball table and gaming console' },
      { name: 'Prayer Room', description: 'Quiet, contemplative space for individual or small group prayer. Beautifully decorated with comfortable seating.', capacity: 15, amenities: ['ac'], hourly_rate: 0.00, status: 'available', notes: 'Open 24/7 for members with key card access' },
      { name: 'Kitchen', description: 'Full commercial kitchen with industrial appliances, ample counter space, and walk-in refrigerator.', capacity: 20, amenities: ['kitchen_access', 'ac'], hourly_rate: 50.00, status: 'available', notes: 'Must complete food safety orientation before use' },
      { name: 'Parking Lot', description: 'Main parking facility with 150 spaces, including 8 handicap-accessible spots.', capacity: 150, amenities: ['parking'], hourly_rate: 0.00, status: 'available', notes: 'Overflow parking available at adjacent lot on weekends' },
      { name: 'Garden Area', description: 'Beautiful landscaped garden with fountain, benches, and pergola. Perfect for outdoor ceremonies and meditation.', capacity: 80, amenities: ['parking'], hourly_rate: 60.00, status: 'available', notes: 'Weather-dependent, rain plan required for bookings' },
      { name: 'Choir Room', description: 'Dedicated music rehearsal room with risers, piano, and music storage. Acoustically treated walls.', capacity: 45, amenities: ['piano', 'ac', 'sound_system'], hourly_rate: 30.00, status: 'available', notes: 'Sheet music library on site' },
      { name: 'Library', description: 'Quiet study and meeting space with extensive theological library. Comfortable reading nooks and study tables.', capacity: 30, amenities: ['wifi', 'ac', 'whiteboard'], hourly_rate: 25.00, status: 'available', notes: 'Book borrowing available for members' },
      { name: 'Conference Room A', description: 'Professional meeting room with oval table, presentation capabilities, and video conferencing equipment.', capacity: 20, amenities: ['projector', 'wifi', 'ac', 'whiteboard'], hourly_rate: 35.00, status: 'booked', booking_date: '2026-03-22', booking_time: '14:00-16:00', booked_by: 'David Williams', notes: 'Board meeting scheduled' },
      { name: 'Conference Room B', description: 'Smaller meeting room ideal for committee meetings and small group discussions.', capacity: 12, amenities: ['wifi', 'ac', 'whiteboard'], hourly_rate: 25.00, status: 'available', notes: 'Whiteboard markers in supply closet' },
      { name: 'Nursery', description: 'Safe, colorful childcare space equipped for infants and toddlers. Staffed during Sunday services.', capacity: 25, amenities: ['ac'], hourly_rate: 0.00, status: 'available', notes: 'Background checks required for all nursery volunteers' },
      { name: 'Gymnasium', description: 'Full-size gymnasium with basketball court, volleyball net, and storage for sports equipment.', capacity: 200, amenities: ['ac', 'sound_system', 'parking'], hourly_rate: 80.00, status: 'available', notes: 'Non-marking shoes required on court' },
      { name: 'Outdoor Pavilion', description: 'Covered outdoor pavilion with built-in grill area and picnic tables. Great for outdoor fellowship events.', capacity: 100, amenities: ['parking'], hourly_rate: 45.00, status: 'booked', booking_date: '2026-03-28', booking_time: '16:00-20:00', booked_by: 'Grace Okafor', notes: 'Community potluck setup' },
      { name: 'Media Room', description: 'Technology center with editing workstations, recording booth, and podcast studio equipment.', capacity: 10, amenities: ['projector', 'sound_system', 'wifi', 'ac'], hourly_rate: 50.00, status: 'available', notes: 'Training required before use of recording equipment' },
    ];

    for (const f of facilities) {
      await client.query(
        `INSERT INTO facilities (name, description, capacity, amenities, hourly_rate, status, booking_date, booking_time, booked_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [f.name, f.description, f.capacity, f.amenities, f.hourly_rate, f.status, f.booking_date || null, f.booking_time || null, f.booked_by || null, f.notes]
      );
    }
    console.log('Facilities seeded (15).');

    // Seed announcements
    const announcements = [
      { title: 'Easter Service Schedule', content: 'Join us for our special Easter celebrations! Good Friday service at 7pm on April 3rd. Easter Sunday sunrise service at 6:30am, followed by our main Easter celebration service at 9am and 11am. Childcare available at all services. Invite your friends and family!', author: 'Pastor James Wilson', category: 'event', priority: 'high', publish_date: '2026-03-15', expiry_date: '2026-04-06', target_audience: 'all', status: 'published' },
      { title: 'New Member Welcome Reception', content: 'We are excited to welcome our newest members! Please join us after the Sunday service on March 29th for a special reception in the Fellowship Hall. Light refreshments will be served. Current members are encouraged to attend and help welcome our new friends.', author: 'Admin User', category: 'event', priority: 'normal', publish_date: '2026-03-18', expiry_date: '2026-03-30', target_audience: 'all', status: 'published' },
      { title: 'Building Fund Update', content: 'We are pleased to announce that our building fund has reached 75% of our goal! Thanks to your generous contributions, the renovation of the Fellowship Hall will begin in May. Remaining funds needed: $15,000. Thank you for your continued support.', author: 'David Williams', category: 'general', priority: 'normal', publish_date: '2026-03-10', expiry_date: '2026-04-30', target_audience: 'members', status: 'published' },
      { title: 'Urgent: Volunteers Needed for Food Drive', content: 'Our annual spring food drive is on April 10th and we urgently need volunteers! We need help with sorting, packing, and distributing food to families in need. Sign up at the information desk or contact Ahmed Patel. Every hour you give makes a difference.', author: 'Ahmed Patel', category: 'urgent', priority: 'urgent', publish_date: '2026-03-19', expiry_date: '2026-04-11', target_audience: 'volunteers', status: 'published' },
      { title: 'Youth Summer Camp Registration Open', content: 'Registration is now open for our annual youth summer camp, July 12-18 at Camp Pinewood. Open to ages 12-18. Early bird discount of $50 off if registered by April 30. Limited to 40 spots. See Emily Rodriguez for details and registration forms.', author: 'Emily Rodriguez', category: 'ministry', priority: 'normal', publish_date: '2026-03-01', expiry_date: '2026-05-31', target_audience: 'youth', status: 'published' },
      { title: 'Choir Members: Easter Rehearsal Schedule', content: 'Extra rehearsals for Easter: March 24, March 31, and April 2 from 6:30-8pm in the Choir Room. Dress rehearsal April 4 at 10am. All choir members must attend at least 2 of the 3 rehearsals. Music packets available in the Choir Room.', author: 'Sophia Clark', category: 'ministry', priority: 'high', publish_date: '2026-03-17', expiry_date: '2026-04-05', target_audience: 'members', status: 'published' },
      { title: 'Office Hours Change', content: 'Please note that the church office will have modified hours during Holy Week (March 30 - April 3). Office will be open Monday-Wednesday 9am-3pm, closed Thursday and Friday. Normal hours resume Monday, April 6.', author: 'Laura Bennett', category: 'general', priority: 'normal', publish_date: '2026-03-20', expiry_date: '2026-04-06', target_audience: 'all', status: 'published' },
      { title: 'Community Prayer Vigil', content: 'Join us for a 24-hour prayer vigil on Good Friday through Holy Saturday (April 3-4). Sign up for one-hour slots at the information desk. Prayer guides will be provided. This is a meaningful way to prepare our hearts for Easter.', author: 'Hannah Lee', category: 'event', priority: 'normal', publish_date: '2026-03-16', expiry_date: '2026-04-04', target_audience: 'all', status: 'published' },
      { title: 'Parking Lot Repaving Notice', content: 'The main parking lot will be repaved on April 8-9. Please use the overflow lot on Elm Street during those days. Handicap parking will be temporarily relocated to the front circle drive. We apologize for the inconvenience.', author: 'Carlos Rivera', category: 'general', priority: 'high', publish_date: '2026-03-20', expiry_date: '2026-04-10', target_audience: 'all', status: 'published' },
      { title: 'Mission Trip Interest Meeting', content: 'Considering joining our summer mission trip to Guatemala? Attend our information session on April 15 at 7pm in the Media Room. Learn about the trip details, costs, fundraising options, and how you can make a difference.', author: 'Robert Kim', category: 'ministry', priority: 'normal', publish_date: '2026-03-12', expiry_date: '2026-04-16', target_audience: 'all', status: 'published' },
      { title: 'Elder Meeting Minutes Available', content: 'Minutes from the March Elder Board meeting are now available for review. Members may request a copy from the church office or download from the members portal. Key topics: budget review, building renovation timeline, and summer programming.', author: 'David Williams', category: 'general', priority: 'low', publish_date: '2026-03-14', expiry_date: '2026-04-14', target_audience: 'elders', status: 'published' },
      { title: 'Interfaith Dialogue: Understanding Our Neighbors', content: 'Our monthly interfaith dialogue continues on April 2 at 7pm in Conference Room A. This months topic: "Finding Common Ground in a Divided World." Guest speakers from three faith traditions. Open to all who seek understanding.', author: 'Imam Ahmed Hassan', category: 'event', priority: 'normal', publish_date: '2026-03-18', expiry_date: '2026-04-03', target_audience: 'all', status: 'published' },
      { title: 'Charity Gala Tickets on Sale', content: 'Tickets for the Annual Charity Gala on April 18 are now on sale! $75 per person, $130 per couple. Includes dinner, live music, and silent auction. All proceeds benefit our community outreach programs. Purchase at the office or online.', author: 'David Williams', category: 'event', priority: 'normal', publish_date: '2026-03-08', expiry_date: '2026-04-18', target_audience: 'all', status: 'published' },
      { title: 'Sunday School Curriculum Update', content: 'Starting April 5, our Sunday School will begin a new curriculum series: "Heroes of Faith." Classes for all ages from toddlers to adults. New teachers welcome! Contact Maria Gonzalez to volunteer.', author: 'Maria Gonzalez', category: 'ministry', priority: 'normal', publish_date: '2026-03-20', expiry_date: '2026-04-30', target_audience: 'all', status: 'published' },
      { title: 'Thank You from the Outreach Team', content: 'The Outreach Team would like to thank everyone who contributed to our winter coat drive. We collected over 200 coats and distributed them to families in need through local shelters. Your generosity warms hearts and bodies!', author: 'Patricia Nelson', category: 'community', priority: 'low', publish_date: '2026-03-05', expiry_date: '2026-03-31', target_audience: 'all', status: 'published' },
      { title: 'Womens Ministry Spring Retreat', content: 'Ladies, mark your calendars! Our annual spring retreat is May 1-3 at Riverside Lodge. Theme: "Renewed and Refreshed." Registration opens April 1. Cost: $120 includes lodging, meals, and materials. Scholarships available.', author: 'Hannah Lee', category: 'ministry', priority: 'normal', publish_date: '2026-03-19', expiry_date: '2026-05-01', target_audience: 'members', status: 'published' },
    ];

    for (const a of announcements) {
      await client.query(
        `INSERT INTO announcements (title, content, author, category, priority, publish_date, expiry_date, target_audience, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.title, a.content, a.author, a.category, a.priority, a.publish_date, a.expiry_date, a.target_audience, a.status]
      );
    }
    console.log('Announcements seeded (16).');

    // Create attendance table
    await client.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(255),
        service_date DATE,
        service_type VARCHAR(100),
        total_attendees INTEGER,
        new_visitors INTEGER DEFAULT 0,
        online_viewers INTEGER DEFAULT 0,
        offering_collected DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        weather VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create small_groups table
    await client.query(`
      CREATE TABLE small_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        leader VARCHAR(255),
        meeting_day VARCHAR(50),
        meeting_time VARCHAR(50),
        location VARCHAR(255),
        category VARCHAR(100),
        max_members INTEGER,
        current_members INTEGER DEFAULT 0,
        curriculum TEXT,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create counseling table
    await client.query(`
      CREATE TABLE counseling (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255),
        counselor VARCHAR(255),
        session_date TIMESTAMP,
        session_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        is_confidential BOOLEAN DEFAULT true,
        topic VARCHAR(255),
        notes TEXT,
        follow_up_date DATE,
        duration INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create outreach table
    await client.query(`
      CREATE TABLE outreach (
        id SERIAL PRIMARY KEY,
        program_name VARCHAR(255),
        description TEXT,
        coordinator VARCHAR(255),
        start_date DATE,
        end_date DATE,
        target_community VARCHAR(255),
        budget DECIMAL(10,2),
        spent DECIMAL(10,2) DEFAULT 0,
        volunteers_needed INTEGER,
        volunteers_assigned INTEGER DEFAULT 0,
        beneficiaries INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        impact_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('New tables created (attendance, small_groups, counseling, outreach).');

    // Seed attendance
    const attendanceRecords = [
      { service_name: 'Sunday Morning Worship', service_date: '2025-12-07', service_type: 'sunday_morning', total_attendees: 245, new_visitors: 8, online_viewers: 52, offering_collected: 3450.00, notes: 'Advent season kickoff, very engaged congregation', weather: 'clear' },
      { service_name: 'Sunday Evening Prayer', service_date: '2025-12-07', service_type: 'sunday_evening', total_attendees: 85, new_visitors: 2, online_viewers: 15, offering_collected: 620.00, notes: 'Quiet reflective service', weather: 'clear' },
      { service_name: 'Wednesday Bible Study', service_date: '2025-12-10', service_type: 'wednesday', total_attendees: 62, new_visitors: 3, online_viewers: 10, offering_collected: 180.00, notes: 'Studying Book of Isaiah', weather: 'cloudy' },
      { service_name: 'Christmas Eve Service', service_date: '2025-12-24', service_type: 'special_event', total_attendees: 350, new_visitors: 45, online_viewers: 120, offering_collected: 8500.00, notes: 'Candlelight service, standing room only', weather: 'snowy' },
      { service_name: 'Christmas Day Service', service_date: '2025-12-25', service_type: 'holiday', total_attendees: 180, new_visitors: 12, online_viewers: 85, offering_collected: 2200.00, notes: 'Joyful Christmas morning celebration', weather: 'snowy' },
      { service_name: 'Sunday Morning Worship', service_date: '2025-12-28', service_type: 'sunday_morning', total_attendees: 155, new_visitors: 4, online_viewers: 40, offering_collected: 2100.00, notes: 'Lower attendance post-holiday week', weather: 'cloudy' },
      { service_name: 'New Year Eve Watch Night', service_date: '2025-12-31', service_type: 'special_event', total_attendees: 190, new_visitors: 15, online_viewers: 65, offering_collected: 4200.00, notes: 'Watch night prayer service, powerful testimony sharing', weather: 'clear' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-01-04', service_type: 'sunday_morning', total_attendees: 220, new_visitors: 10, online_viewers: 48, offering_collected: 3100.00, notes: 'New Year new series kickoff', weather: 'rainy' },
      { service_name: 'Youth Service', service_date: '2026-01-09', service_type: 'youth_service', total_attendees: 55, new_visitors: 6, online_viewers: 20, offering_collected: 320.00, notes: 'Youth-led worship night, great energy', weather: 'cloudy' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-01-18', service_type: 'sunday_morning', total_attendees: 235, new_visitors: 7, online_viewers: 50, offering_collected: 3350.00, notes: 'Guest speaker Imam Ahmed Hassan', weather: 'sunny' },
      { service_name: 'Wednesday Bible Study', service_date: '2026-01-21', service_type: 'wednesday', total_attendees: 70, new_visitors: 5, online_viewers: 12, offering_collected: 210.00, notes: 'New series on Psalms', weather: 'rainy' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-02-01', service_type: 'sunday_morning', total_attendees: 250, new_visitors: 9, online_viewers: 55, offering_collected: 3600.00, notes: 'Black History Month celebration', weather: 'sunny' },
      { service_name: 'Sunday Evening Prayer', service_date: '2026-02-08', service_type: 'sunday_evening', total_attendees: 78, new_visitors: 1, online_viewers: 18, offering_collected: 540.00, notes: 'Healing prayer focus', weather: 'rainy' },
      { service_name: 'Youth Service', service_date: '2026-02-13', service_type: 'youth_service', total_attendees: 65, new_visitors: 8, online_viewers: 25, offering_collected: 280.00, notes: 'Valentine theme: Love of God', weather: 'cloudy' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-02-15', service_type: 'sunday_morning', total_attendees: 260, new_visitors: 11, online_viewers: 58, offering_collected: 3800.00, notes: 'Baptism Sunday, 4 baptized', weather: 'sunny' },
      { service_name: 'Wednesday Bible Study', service_date: '2026-02-25', service_type: 'wednesday', total_attendees: 68, new_visitors: 2, online_viewers: 14, offering_collected: 195.00, notes: 'Continuing Psalms series', weather: 'clear' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-03-01', service_type: 'sunday_morning', total_attendees: 240, new_visitors: 6, online_viewers: 52, offering_collected: 3250.00, notes: 'Lent season begins', weather: 'cloudy' },
      { service_name: 'Sunday Morning Worship', service_date: '2026-03-15', service_type: 'sunday_morning', total_attendees: 255, new_visitors: 12, online_viewers: 60, offering_collected: 3700.00, notes: 'Community invitation Sunday', weather: 'sunny' },
    ];

    for (const a of attendanceRecords) {
      await client.query(
        `INSERT INTO attendance (service_name, service_date, service_type, total_attendees, new_visitors, online_viewers, offering_collected, notes, weather)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.service_name, a.service_date, a.service_type, a.total_attendees, a.new_visitors, a.online_viewers, a.offering_collected, a.notes, a.weather]
      );
    }
    console.log('Attendance seeded (18).');

    // Seed small_groups
    const smallGroups = [
      { name: "Women's Bible Study", description: 'Weekly Bible study and prayer group for women of all ages. Focus on practical application of scripture to daily life.', leader: 'Hannah Lee', meeting_day: 'Tuesday', meeting_time: '10:00 AM', location: 'Library', category: 'bible_study', max_members: 20, current_members: 16, curriculum: 'Exploring the Women of the Bible - 12 week study', status: 'active', start_date: '2025-09-02', notes: 'Childcare provided during meetings' },
      { name: "Men's Fellowship", description: 'Brotherhood gathering for men focusing on faith, accountability, and community service projects.', leader: 'David Williams', meeting_day: 'Saturday', meeting_time: '7:30 AM', location: 'Fellowship Hall', category: 'fellowship', max_members: 25, current_members: 18, curriculum: 'Iron Sharpens Iron: Building Godly Character', status: 'active', start_date: '2025-09-06', notes: 'Breakfast provided, rotating hosts' },
      { name: 'Young Adults', description: 'Community for adults ages 18-30. Combines social activities with spiritual growth and life skills discussions.', leader: 'Emily Rodriguez', meeting_day: 'Friday', meeting_time: '7:00 PM', location: 'Youth Center', category: 'fellowship', max_members: 30, current_members: 22, curriculum: 'Navigating Faith in the Modern World', status: 'active', start_date: '2025-09-05', notes: 'Social events monthly, service projects quarterly' },
      { name: 'Marriage Enrichment', description: 'Strengthening marriages through guided discussions, communication exercises, and faith-based relationship tools.', leader: 'Rev. Maria Santos', meeting_day: 'Thursday', meeting_time: '7:00 PM', location: 'Conference Room A', category: 'fellowship', max_members: 16, current_members: 12, curriculum: 'The Five Love Languages for Couples of Faith', status: 'active', start_date: '2025-10-02', notes: 'Couples only, childcare available' },
      { name: 'Grief Support', description: 'Compassionate support group for those who have experienced loss. Safe space for sharing and healing.', leader: 'Patricia Nelson', meeting_day: 'Monday', meeting_time: '6:30 PM', location: 'Prayer Room', category: 'support', max_members: 12, current_members: 8, curriculum: 'GriefShare: Your Journey from Mourning to Joy', status: 'active', start_date: '2025-10-06', notes: 'Licensed counselor facilitates, confidential' },
      { name: 'New Believers', description: 'Foundational faith course for those new to the faith or exploring spiritual questions.', leader: 'Pastor James Wilson', meeting_day: 'Sunday', meeting_time: '12:30 PM', location: 'Conference Room B', category: 'discipleship', max_members: 15, current_members: 9, curriculum: 'Foundations of Faith: A 10-Week Journey', status: 'active', start_date: '2026-01-11', notes: 'Runs after Sunday service, lunch provided' },
      { name: 'Prayer Warriors', description: 'Dedicated intercessory prayer group meeting to pray for the congregation, community, and world needs.', leader: 'Grace Okafor', meeting_day: 'Wednesday', meeting_time: '6:00 AM', location: 'Prayer Room', category: 'discipleship', max_members: 20, current_members: 14, curriculum: 'The Power of Persistent Prayer', status: 'active', start_date: '2025-08-06', notes: 'Early morning meeting, coffee provided' },
      { name: 'Book Club', description: 'Monthly reading and discussion group exploring Christian literature, theology, and inspirational works.', leader: 'Michael Chen', meeting_day: 'Wednesday', meeting_time: '7:00 PM', location: 'Library', category: 'bible_study', max_members: 15, current_members: 11, curriculum: 'Current book: Mere Christianity by C.S. Lewis', status: 'active', start_date: '2025-09-03', notes: 'Books provided by the church library' },
      { name: 'Parenting Group', description: 'Support and guidance for parents at all stages. Discussing faith-based parenting strategies and challenges.', leader: 'Maria Gonzalez', meeting_day: 'Tuesday', meeting_time: '7:00 PM', location: 'Fellowship Hall', category: 'support', max_members: 20, current_members: 14, curriculum: 'Grace-Based Parenting in a Digital Age', status: 'active', start_date: '2025-10-07', notes: 'Childcare provided, all parenting stages welcome' },
      { name: 'Senior Saints', description: 'Fellowship and Bible study for senior adults. Includes social outings, prayer, and mutual support.', leader: 'Robert Kim', meeting_day: 'Thursday', meeting_time: '10:00 AM', location: 'Fellowship Hall', category: 'fellowship', max_members: 30, current_members: 22, curriculum: 'Living with Purpose in the Golden Years', status: 'active', start_date: '2025-09-04', notes: 'Transportation available for those who need it' },
      { name: 'College & Career', description: 'Navigating college life and early career decisions with faith as a foundation. Practical and spiritual guidance.', leader: 'Christine Taylor', meeting_day: 'Sunday', meeting_time: '5:00 PM', location: 'Youth Center', category: 'discipleship', max_members: 20, current_members: 13, curriculum: 'Faith and Vocation: Finding Your Calling', status: 'active', start_date: '2025-09-07', notes: 'Includes resume workshops and mentoring connections' },
      { name: 'Apologetics Study', description: 'In-depth study of Christian apologetics. Examining evidence for faith and learning to articulate beliefs thoughtfully.', leader: 'Michael Chen', meeting_day: 'Monday', meeting_time: '7:30 PM', location: 'Library', category: 'bible_study', max_members: 15, current_members: 10, curriculum: 'The Case for Christ and Defending Your Faith', status: 'active', start_date: '2026-01-05', notes: 'Open to seekers and skeptics as well' },
      { name: 'Worship Team Devotional', description: 'Spiritual formation group for worship team members. Combining devotional study with creative expression.', leader: 'Sophia Clark', meeting_day: 'Saturday', meeting_time: '9:00 AM', location: 'Choir Room', category: 'discipleship', max_members: 20, current_members: 15, curriculum: 'The Heart of Worship: Beyond the Music', status: 'active', start_date: '2025-09-06', notes: 'For all worship team members including tech crew' },
      { name: 'Community Service Team', description: 'Action-oriented group focused on planning and executing community service projects and outreach events.', leader: 'Ahmed Patel', meeting_day: 'Saturday', meeting_time: '10:00 AM', location: 'Conference Room A', category: 'service', max_members: 25, current_members: 17, curriculum: 'Serving with Purpose: Making a Lasting Impact', status: 'active', start_date: '2025-09-06', notes: 'Monthly service projects in addition to meetings' },
      { name: 'Interfaith Discussion', description: 'Open forum for respectful dialogue between different faith traditions. Building bridges through understanding.', leader: 'Imam Ahmed Hassan', meeting_day: 'Wednesday', meeting_time: '7:00 PM', location: 'Conference Room A', category: 'discussion', max_members: 25, current_members: 19, curriculum: 'Common Ground: Exploring Shared Values Across Faiths', status: 'active', start_date: '2025-10-01', notes: 'Guest speakers from various faith traditions monthly' },
      { name: 'Addiction Recovery Support', description: 'Faith-based recovery support group providing spiritual tools and community for those overcoming addiction.', leader: 'Patricia Nelson', meeting_day: 'Friday', meeting_time: '6:00 PM', location: 'Conference Room B', category: 'support', max_members: 15, current_members: 9, curriculum: 'Celebrate Recovery: 12 Steps with Christ', status: 'active', start_date: '2025-11-07', notes: 'Confidential, open to community members' },
    ];

    for (const sg of smallGroups) {
      await client.query(
        `INSERT INTO small_groups (name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members, curriculum, status, start_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [sg.name, sg.description, sg.leader, sg.meeting_day, sg.meeting_time, sg.location, sg.category, sg.max_members, sg.current_members, sg.curriculum, sg.status, sg.start_date, sg.notes]
      );
    }
    console.log('Small groups seeded (16).');

    // Seed counseling
    const counselingSessions = [
      { client_name: 'John Smith', counselor: 'Pastor James Wilson', session_date: '2026-01-10 10:00:00', session_type: 'pastoral', status: 'completed', is_confidential: true, topic: 'Spiritual doubt and faith crisis', notes: 'Client experiencing doubt after a personal loss. Discussed grief and faith. Recommended grief support group.', follow_up_date: '2026-01-24', duration: 60 },
      { client_name: 'Sarah & Mark Johnson', counselor: 'Rev. Maria Santos', session_date: '2026-01-15 14:00:00', session_type: 'marriage', status: 'completed', is_confidential: true, topic: 'Communication difficulties in marriage', notes: 'Couple struggling with communication patterns. Introduced active listening exercises. Both engaged and willing.', follow_up_date: '2026-01-29', duration: 90 },
      { client_name: 'Grace Okafor', counselor: 'Patricia Nelson', session_date: '2026-01-20 11:00:00', session_type: 'grief', status: 'completed', is_confidential: true, topic: 'Loss of a parent', notes: 'Client processing the recent loss of her father. Shared memories and tears. Exploring healthy grieving practices.', follow_up_date: '2026-02-03', duration: 60 },
      { client_name: 'James Murphy', counselor: 'Pastor James Wilson', session_date: '2026-01-25 15:00:00', session_type: 'youth', status: 'completed', is_confidential: true, topic: 'Academic pressure and anxiety', notes: 'College student feeling overwhelmed. Discussed time management, self-care, and trusting God with the future.', follow_up_date: '2026-02-08', duration: 45 },
      { client_name: 'Daniel & Lisa Brown', counselor: 'Rev. Maria Santos', session_date: '2026-02-01 10:00:00', session_type: 'pre_marriage', status: 'completed', is_confidential: true, topic: 'Pre-marriage counseling session 1: Expectations', notes: 'First session covering marriage expectations, family backgrounds, and shared values. Good rapport established.', follow_up_date: '2026-02-15', duration: 90 },
      { client_name: 'Emily Rodriguez', counselor: 'Patricia Nelson', session_date: '2026-02-05 13:00:00', session_type: 'pastoral', status: 'completed', is_confidential: true, topic: 'Burnout in ministry leadership', notes: 'Youth leader feeling burned out. Discussed boundaries, delegation, and spiritual self-care. Created action plan.', follow_up_date: '2026-02-19', duration: 60 },
      { client_name: 'Ahmed Patel', counselor: 'Pastor James Wilson', session_date: '2026-02-10 09:00:00', session_type: 'family', status: 'completed', is_confidential: true, topic: 'Caring for aging parents while raising children', notes: 'Sandwich generation stress. Discussed community resources, family meetings, and self-compassion.', follow_up_date: '2026-02-24', duration: 60 },
      { client_name: 'Anonymous Client A', counselor: 'Patricia Nelson', session_date: '2026-02-14 16:00:00', session_type: 'crisis', status: 'completed', is_confidential: true, topic: 'Crisis intervention - suicidal ideation', notes: 'Safety plan created. Referred to professional therapist. Emergency contacts established. Follow-up in 48 hours.', follow_up_date: '2026-02-16', duration: 90 },
      { client_name: 'Robert Kim', counselor: 'Rev. Maria Santos', session_date: '2026-02-20 11:00:00', session_type: 'spiritual_direction', status: 'completed', is_confidential: true, topic: 'Discerning spiritual gifts and calling', notes: 'Exploring spiritual gifts inventory results. Discussed potential areas of service and ministry involvement.', follow_up_date: '2026-03-06', duration: 60 },
      { client_name: 'Daniel & Lisa Brown', counselor: 'Rev. Maria Santos', session_date: '2026-02-15 10:00:00', session_type: 'pre_marriage', status: 'completed', is_confidential: true, topic: 'Pre-marriage counseling session 2: Finances and conflict', notes: 'Covered financial planning and healthy conflict resolution. Assigned budget exercise for next session.', follow_up_date: '2026-03-01', duration: 90 },
      { client_name: 'Lisa Thompson', counselor: 'Pastor James Wilson', session_date: '2026-03-01 14:00:00', session_type: 'pastoral', status: 'completed', is_confidential: true, topic: 'Adjusting to new church community', notes: 'New member feeling disconnected. Discussed small group options and volunteer opportunities for integration.', follow_up_date: '2026-03-15', duration: 45 },
      { client_name: 'Yuki Tanaka', counselor: 'Patricia Nelson', session_date: '2026-03-05 10:00:00', session_type: 'grief', status: 'completed', is_confidential: true, topic: 'Anniversary of spouse passing', notes: 'Approaching one-year anniversary. Discussed memorial rituals and continuing bonds approach to grief.', follow_up_date: '2026-03-19', duration: 60 },
      { client_name: 'Sarah & Mark Johnson', counselor: 'Rev. Maria Santos', session_date: '2026-03-12 14:00:00', session_type: 'marriage', status: 'scheduled', is_confidential: true, topic: 'Follow-up: Communication progress review', notes: null, follow_up_date: null, duration: 90 },
      { client_name: 'Hannah Lee', counselor: 'Pastor James Wilson', session_date: '2026-03-18 09:00:00', session_type: 'spiritual_direction', status: 'scheduled', is_confidential: true, topic: 'Leadership development and spiritual growth', notes: null, follow_up_date: null, duration: 60 },
      { client_name: 'Michael Chen', counselor: 'Rev. Maria Santos', session_date: '2026-03-20 15:00:00', session_type: 'family', status: 'scheduled', is_confidential: true, topic: 'Family relocation decision counseling', notes: null, follow_up_date: null, duration: 60 },
      { client_name: 'Anonymous Client B', counselor: 'Patricia Nelson', session_date: '2026-03-22 11:00:00', session_type: 'pastoral', status: 'scheduled', is_confidential: true, topic: 'Struggling with addiction', notes: null, follow_up_date: null, duration: 60 },
      { client_name: 'Maria Gonzalez', counselor: 'Pastor James Wilson', session_date: '2026-02-28 10:00:00', session_type: 'pastoral', status: 'cancelled', is_confidential: true, topic: 'Work-life balance', notes: 'Client cancelled due to illness. Rescheduled.', follow_up_date: '2026-03-14', duration: 60 },
    ];

    for (const c of counselingSessions) {
      await client.query(
        `INSERT INTO counseling (client_name, counselor, session_date, session_type, status, is_confidential, topic, notes, follow_up_date, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [c.client_name, c.counselor, c.session_date, c.session_type, c.status, c.is_confidential, c.topic, c.notes, c.follow_up_date, c.duration]
      );
    }
    console.log('Counseling sessions seeded (17).');

    // Seed outreach
    const outreachPrograms = [
      { program_name: 'Food Pantry', description: 'Weekly food distribution providing groceries and essentials to families facing food insecurity in our community.', coordinator: 'Ahmed Patel', start_date: '2025-01-15', end_date: null, target_community: 'Low-income families', budget: 15000.00, spent: 11200.00, volunteers_needed: 20, volunteers_assigned: 16, beneficiaries: 450, status: 'active', impact_notes: 'Serving an average of 45 families per week. Partnered with local grocery stores for surplus food donations.' },
      { program_name: 'Homeless Shelter Support', description: 'Monthly overnight shelter hosting and meal service for homeless individuals at the community shelter.', coordinator: 'Patricia Nelson', start_date: '2025-03-01', end_date: null, target_community: 'Homeless individuals', budget: 8000.00, spent: 5600.00, volunteers_needed: 15, volunteers_assigned: 12, beneficiaries: 180, status: 'active', impact_notes: 'Providing warm meals and overnight shelter one weekend per month. Several individuals connected with job resources.' },
      { program_name: 'After-School Tutoring', description: 'Free tutoring program for elementary and middle school students in reading, math, and science.', coordinator: 'Maria Gonzalez', start_date: '2025-09-08', end_date: '2026-06-12', target_community: 'School-age children', budget: 5000.00, spent: 3200.00, volunteers_needed: 12, volunteers_assigned: 10, beneficiaries: 35, status: 'active', impact_notes: 'Students showing average 15% improvement in grades. Waiting list of 10 students for next semester.' },
      { program_name: 'Prison Ministry', description: 'Weekly visitation and Bible study at the county correctional facility. Providing spiritual support and mentoring.', coordinator: 'Pastor James Wilson', start_date: '2025-02-01', end_date: null, target_community: 'Incarcerated individuals', budget: 3000.00, spent: 1800.00, volunteers_needed: 8, volunteers_assigned: 6, beneficiaries: 45, status: 'active', impact_notes: 'Regular group of 25 inmates attending weekly. Three released inmates now attending our services.' },
      { program_name: 'Hospital Visits', description: 'Pastoral care visits to hospitalized congregation members and community members without family support.', coordinator: 'Rev. Maria Santos', start_date: '2025-01-01', end_date: null, target_community: 'Hospitalized individuals', budget: 1500.00, spent: 900.00, volunteers_needed: 6, volunteers_assigned: 5, beneficiaries: 120, status: 'active', impact_notes: 'Visiting 3 hospitals weekly. Providing prayer, companionship, and practical support to patients and families.' },
      { program_name: 'Refugee Assistance', description: 'Comprehensive support for refugee families including housing assistance, language help, and cultural orientation.', coordinator: 'Fatima Al-Rashid', start_date: '2025-06-01', end_date: null, target_community: 'Refugee families', budget: 12000.00, spent: 9500.00, volunteers_needed: 18, volunteers_assigned: 14, beneficiaries: 28, status: 'active', impact_notes: 'Currently supporting 6 refugee families. All children enrolled in school. Two families now self-sufficient.' },
      { program_name: 'Community Garden', description: 'Shared garden space providing fresh produce to food pantry and teaching sustainable gardening to community members.', coordinator: 'Carlos Rivera', start_date: '2025-04-01', end_date: '2025-10-31', target_community: 'General community', budget: 3500.00, spent: 3500.00, volunteers_needed: 10, volunteers_assigned: 8, beneficiaries: 75, status: 'completed', impact_notes: 'Produced over 2,000 lbs of fresh produce. Donated 60% to food pantry. Planning expansion for next season.' },
      { program_name: 'Clothing Drive', description: 'Seasonal clothing collection and distribution drive providing winter coats, shoes, and professional attire.', coordinator: 'Grace Okafor', start_date: '2025-11-01', end_date: '2026-01-31', target_community: 'Low-income families', budget: 2000.00, spent: 1850.00, volunteers_needed: 12, volunteers_assigned: 12, beneficiaries: 200, status: 'completed', impact_notes: 'Collected and distributed over 500 items. Professional attire section helped 15 job seekers.' },
      { program_name: 'Meals on Wheels', description: 'Home delivery of hot meals to homebound seniors and disabled individuals in the community.', coordinator: 'Jennifer Adams', start_date: '2025-05-01', end_date: null, target_community: 'Homebound seniors', budget: 10000.00, spent: 7800.00, volunteers_needed: 15, volunteers_assigned: 11, beneficiaries: 40, status: 'active', impact_notes: 'Delivering 5 days a week to 40 homebound individuals. Many report this is their only social interaction.' },
      { program_name: 'Disaster Relief Fund', description: 'Emergency fund and response team for natural disasters. Provides immediate aid and long-term recovery support.', coordinator: 'David Williams', start_date: '2025-01-01', end_date: null, target_community: 'Disaster-affected families', budget: 20000.00, spent: 6500.00, volunteers_needed: 25, volunteers_assigned: 18, beneficiaries: 85, status: 'active', impact_notes: 'Responded to spring flooding. Provided emergency supplies to 30 families. Assisted 12 families with home repairs.' },
      { program_name: 'ESL Classes', description: 'Free English as a Second Language classes for immigrants and refugees in our community.', coordinator: 'Yuki Tanaka', start_date: '2025-09-15', end_date: '2026-05-30', target_community: 'Immigrants and refugees', budget: 4000.00, spent: 2800.00, volunteers_needed: 8, volunteers_assigned: 7, beneficiaries: 32, status: 'active', impact_notes: 'Three levels offered: beginner, intermediate, advanced. 80% retention rate. Five students passed citizenship test.' },
      { program_name: 'Job Training Workshop', description: 'Monthly workshops covering resume writing, interview skills, computer literacy, and professional development.', coordinator: 'Laura Bennett', start_date: '2025-10-01', end_date: null, target_community: 'Unemployed and underemployed adults', budget: 6000.00, spent: 3900.00, volunteers_needed: 10, volunteers_assigned: 8, beneficiaries: 55, status: 'active', impact_notes: '22 participants found employment within 3 months. Partnered with 5 local businesses for job placement.' },
      { program_name: 'Senior Home Visits', description: 'Regular visits to isolated seniors in nursing homes and assisted living facilities. Providing companionship and spiritual care.', coordinator: 'Hannah Lee', start_date: '2025-03-15', end_date: null, target_community: 'Seniors in care facilities', budget: 2000.00, spent: 1200.00, volunteers_needed: 10, volunteers_assigned: 7, beneficiaries: 30, status: 'active', impact_notes: 'Visiting 4 facilities bi-weekly. Hosting monthly birthday celebrations. Residents report improved mood and wellbeing.' },
      { program_name: 'Youth Mentoring', description: 'One-on-one mentoring program pairing adult volunteers with at-risk youth for guidance, support, and positive role modeling.', coordinator: 'Emily Rodriguez', start_date: '2025-09-01', end_date: null, target_community: 'At-risk youth ages 12-18', budget: 5000.00, spent: 2800.00, volunteers_needed: 15, volunteers_assigned: 11, beneficiaries: 22, status: 'active', impact_notes: '11 active mentor-mentee pairs. School attendance improved 20% among participants. Zero dropouts this year.' },
      { program_name: 'Addiction Recovery Support', description: 'Weekly support meetings and resources for individuals and families affected by substance abuse and addiction.', coordinator: 'Patricia Nelson', start_date: '2025-08-01', end_date: null, target_community: 'Individuals struggling with addiction', budget: 4500.00, spent: 2900.00, volunteers_needed: 8, volunteers_assigned: 6, beneficiaries: 38, status: 'active', impact_notes: 'Average attendance of 15 per meeting. 8 individuals completed 90-day sobriety milestones. Family support group started.' },
      { program_name: 'Community Garden 2026', description: 'Expanded community garden for the new growing season with additional plots and a children\'s learning garden.', coordinator: 'Carlos Rivera', start_date: '2026-04-01', end_date: '2026-10-31', target_community: 'General community', budget: 5000.00, spent: 800.00, volunteers_needed: 15, volunteers_assigned: 5, beneficiaries: 0, status: 'planning', impact_notes: 'Planning phase. Secured additional land from neighbor. Children\'s education component added.' },
    ];

    for (const o of outreachPrograms) {
      await client.query(
        `INSERT INTO outreach (program_name, description, coordinator, start_date, end_date, target_community, budget, spent, volunteers_needed, volunteers_assigned, beneficiaries, status, impact_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [o.program_name, o.description, o.coordinator, o.start_date, o.end_date, o.target_community, o.budget, o.spent, o.volunteers_needed, o.volunteers_assigned, o.beneficiaries, o.status, o.impact_notes]
      );
    }
    console.log('Outreach programs seeded (16).');

    console.log('\nDatabase seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
