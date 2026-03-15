import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function loadEnv(envPath = '.env') {
  const fullPath = path.resolve(envPath);
  const contents = fs.readFileSync(fullPath, 'utf8');
  const env = {};

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function main() {
  const env = loadEnv();

  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Optional: quick check if table exists
  const probe = await supabase.from('festivals').select('*').limit(1);
  if (probe.error) {
    console.error('Error probing festivals table. It may not exist yet.');
    console.error('Message:', probe.error.message);
    console.error(
      'If the table is missing, run the SQL in supabase/migrations/20260314115303_afc5eef5-42af-48dc-be51-8ccd7ee2c70b.sql in the Supabase SQL editor, then re-run this script.'
    );
    process.exit(1);
  }

  const festivals = [
    {
      name: 'Makar Sankranti',
      description: 'Harvest and sun-transit festival marking the start of longer days.',
      gregorian_date: '2026-01-14',
      region: 'Pan-India, especially North and Central India',
      religion: 'Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Maha Shivaratri',
      description: 'Night of devotion to Lord Shiva with fasting and vigil.',
      gregorian_date: '2026-02-15',
      region: 'All India',
      religion: 'Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Holi',
      description: 'Spring festival of colors celebrating the triumph of good over evil.',
      gregorian_date: '2026-03-04',
      region: 'All India',
      religion: 'Hinduism',
      is_national_holiday: true,
    },
    {
      name: 'Eid-ul-Fitr',
      description: 'Festival marking the end of Ramadan with prayers and feasts.',
      gregorian_date: '2026-03-20',
      region: 'All India',
      religion: 'Islam',
      is_national_holiday: true,
    },
    {
      name: 'Ram Navami',
      description: 'Birth anniversary of Lord Rama, celebrated with prayers and processions.',
      gregorian_date: '2026-03-26',
      region: 'All India, especially North India',
      religion: 'Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Baisakhi',
      description: 'Harvest festival and founding day of the Khalsa for Sikhs.',
      gregorian_date: '2026-04-14',
      region: 'Punjab and North India',
      religion: 'Sikhism / Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Buddha Purnima',
      description:
        'Commemoration of the birth, enlightenment, and parinirvana of Buddha.',
      gregorian_date: '2026-05-01',
      region: 'All India, especially Buddhist regions',
      religion: 'Buddhism',
      is_national_holiday: true,
    },
    {
      name: 'Onam',
      description: 'Harvest festival of Kerala welcoming King Mahabali.',
      gregorian_date: '2026-08-26',
      region: 'Kerala and Malayali communities',
      religion: 'Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Ganesh Chaturthi',
      description:
        'Festival celebrating the birth of Lord Ganesha with public immersions.',
      gregorian_date: '2026-09-14',
      region: 'Maharashtra and Western India',
      religion: 'Hinduism',
      is_national_holiday: false,
    },
    {
      name: 'Dussehra',
      description:
        'Festival marking the victory of Rama over Ravana and good over evil.',
      gregorian_date: '2026-10-20',
      region: 'All India',
      religion: 'Hinduism',
      is_national_holiday: true,
    },
    {
      name: 'Diwali',
      description:
        'Festival of lights symbolizing the victory of light over darkness.',
      gregorian_date: '2026-11-08',
      region: 'All India',
      religion: 'Hinduism / Jainism / Sikhism',
      is_national_holiday: true,
    },
  ];

  const { error } = await supabase.from('festivals').insert(festivals);

  if (error) {
    console.error('Error inserting festivals:', error.message);
    process.exit(1);
  }

  console.log('Successfully inserted festivals into the database.');
}

main().catch((err) => {
  console.error('Unexpected error while seeding festivals:', err);
  process.exit(1);
});

