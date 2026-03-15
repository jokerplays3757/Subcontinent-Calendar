// Calendar utility functions for Indian calendar systems

// Vikram Samvat months
const VS_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
  'Shravana', 'Bhadrapada', 'Ashvina', 'Kartika',
  'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
];

// Saka months
const SAKA_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
  'Shravana', 'Bhadrapada', 'Ashvina', 'Kartika',
  'Agrahayana', 'Pausha', 'Magha', 'Phalguna'
];

// Vedic zodiac signs (Rashis)
const VEDIC_ZODIAC = [
  { name: 'Makara', english: 'Capricorn', symbol: '♑', element: 'Earth', ruling: 'Saturn', dates: 'Jan 14 – Feb 12' },
  { name: 'Kumbha', english: 'Aquarius', symbol: '♒', element: 'Air', ruling: 'Saturn', dates: 'Feb 13 – Mar 14' },
  { name: 'Meena', english: 'Pisces', symbol: '♓', element: 'Water', ruling: 'Jupiter', dates: 'Mar 15 – Apr 13' },
  { name: 'Mesha', english: 'Aries', symbol: '♈', element: 'Fire', ruling: 'Mars', dates: 'Apr 14 – May 14' },
  { name: 'Vrishabha', english: 'Taurus', symbol: '♉', element: 'Earth', ruling: 'Venus', dates: 'May 15 – Jun 14' },
  { name: 'Mithuna', english: 'Gemini', symbol: '♊', element: 'Air', ruling: 'Mercury', dates: 'Jun 15 – Jul 16' },
  { name: 'Karka', english: 'Cancer', symbol: '♋', element: 'Water', ruling: 'Moon', dates: 'Jul 17 – Aug 16' },
  { name: 'Simha', english: 'Leo', symbol: '♌', element: 'Fire', ruling: 'Sun', dates: 'Aug 17 – Sep 16' },
  { name: 'Kanya', english: 'Virgo', symbol: '♍', element: 'Earth', ruling: 'Mercury', dates: 'Sep 17 – Oct 16' },
  { name: 'Tula', english: 'Libra', symbol: '♎', element: 'Air', ruling: 'Venus', dates: 'Oct 17 – Nov 15' },
  { name: 'Vrishchika', english: 'Scorpio', symbol: '♏', element: 'Water', ruling: 'Mars', dates: 'Nov 16 – Dec 15' },
  { name: 'Dhanu', english: 'Sagittarius', symbol: '♐', element: 'Fire', ruling: 'Jupiter', dates: 'Dec 16 – Jan 13' },
];

export type MonthScheme = 'amanta' | 'purnimanta';
export type CalendarId = 'gregorian' | 'vikram' | 'saka';

// Year-specific refinement for 2026 month boundaries
// These are approximate civil calendar starts for better overlays in 2026.
const VS_2026_MONTH_STARTS: { monthIndex: number; start: Date }[] = [
  // Vikram Samvat 2083 starts with Chaitra on 19 March 2026
  { monthIndex: 0, start: new Date(2026, 2, 19) }, // Chaitra - Mar 19, 2026
  { monthIndex: 1, start: new Date(2026, 3, 17) }, // Vaishakha - mid April
  { monthIndex: 2, start: new Date(2026, 4, 17) }, // Jyeshtha - mid May
  { monthIndex: 3, start: new Date(2026, 5, 16) }, // Ashadha - mid June
  { monthIndex: 4, start: new Date(2026, 6, 16) }, // Shravana - mid July
  { monthIndex: 5, start: new Date(2026, 7, 15) }, // Bhadrapada - mid August
  { monthIndex: 6, start: new Date(2026, 8, 14) }, // Ashvina - mid September
  { monthIndex: 7, start: new Date(2026, 9, 14) }, // Kartika - mid October
  { monthIndex: 8, start: new Date(2026, 10, 13) }, // Margashirsha - mid November
  { monthIndex: 9, start: new Date(2026, 11, 13) }, // Pausha - mid December
  // Magha / Phalguna of this VS year spill into 2027, so we don't need explicit 2026 starts
];

const SAKA_2026_MONTH_STARTS: { monthIndex: number; start: Date }[] = [
  // Saka year 1948 – Chaitra starting on 19 March 2026 (per requirement)
  { monthIndex: 0, start: new Date(2026, 2, 19) }, // Chaitra
  { monthIndex: 1, start: new Date(2026, 3, 19) }, // Vaishakha
  { monthIndex: 2, start: new Date(2026, 4, 19) }, // Jyeshtha
  { monthIndex: 3, start: new Date(2026, 5, 18) }, // Ashadha
  { monthIndex: 4, start: new Date(2026, 6, 18) }, // Shravana
  { monthIndex: 5, start: new Date(2026, 7, 17) }, // Bhadrapada
  { monthIndex: 6, start: new Date(2026, 8, 17) }, // Ashvina
  { monthIndex: 7, start: new Date(2026, 9, 18) }, // Kartika
  { monthIndex: 8, start: new Date(2026, 10, 17) }, // Agrahayana
  { monthIndex: 9, start: new Date(2026, 11, 17) }, // Pausha
  // Magha / Phalguna will start in early 2027
];

/**
 * Convert Gregorian date to approximate Vikram Samvat year and month.
 * VS is ~56.7 years ahead. New year starts in Chaitra (~March/April).
 */
export function gregorianToVikramSamvat(
  date: Date,
  scheme: MonthScheme = 'purnimanta'
): { year: number; month: string; monthIndex: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-11
  const gDay = date.getDate();

  // Special handling for 2026 so that:
  // - Chaitra starts on 19 March 2026
  // - VS year transitions from 2082 to 2083 on that date
  if (gYear === 2026) {
    const chaitraStart = new Date(2026, 2, 19); // 2026-03-19

    let vsYear: number;
    if (date < chaitraStart) {
      // Still in the tail of VS 2082
      vsYear = 2026 + 56; // 2082
      // For Jan–18 Mar 2026, keep using the simpler approximate mapping from before
      // (Pausha / Magha / Phalguna of VS 2082)
      let monthIndex: number;
      if (gMonth === 0) monthIndex = gDay < 14 ? 9 : 10; // Pausha or Magha
      else if (gMonth === 1) monthIndex = gDay < 12 ? 10 : 11; // Magha or Phalguna
      else monthIndex = 11; // Phalguna

      const displayIndex = scheme === 'amanta' ? (monthIndex + 11) % 12 : monthIndex;
      return { year: vsYear, month: VS_MONTHS[displayIndex], monthIndex: displayIndex };
    }

    // From 19 March 2026 onwards we are in VS 2083
    vsYear = 2026 + 57; // 2083

    // Use refined month boundary table for 2026
    let monthIndex = VS_2026_MONTH_STARTS[0].monthIndex;
    for (const entry of VS_2026_MONTH_STARTS) {
      if (date >= entry.start) {
        monthIndex = entry.monthIndex;
      } else {
        break;
      }
    }

    const displayIndex = scheme === 'amanta' ? (monthIndex + 11) % 12 : monthIndex;
    return { year: vsYear, month: VS_MONTHS[displayIndex], monthIndex: displayIndex };
  }

  // Generic approximation for years other than 2026
  // VS new year starts around mid-March (Chaitra)
  // Before mid-March, we're in the previous VS year's last months
  let vsYear: number;
  let monthIndex: number;

  if (gMonth < 2 || (gMonth === 2 && gDay < 14)) {
    // Jan-mid Mar: VS year = Gregorian + 56, months Pausha-Phalguna
    vsYear = gYear + 56;
    if (gMonth === 0) monthIndex = gDay < 14 ? 9 : 10; // Pausha or Magha
    else if (gMonth === 1) monthIndex = gDay < 12 ? 10 : 11; // Magha or Phalguna
    else monthIndex = 11; // Phalguna
  } else {
    // Mid-Mar onwards: VS year = Gregorian + 57
    vsYear = gYear + 57;
    if (gMonth === 2) monthIndex = 0; // Chaitra
    else if (gMonth === 3) monthIndex = gDay < 14 ? 0 : 1;
    else if (gMonth === 4) monthIndex = gDay < 15 ? 1 : 2;
    else if (gMonth === 5) monthIndex = gDay < 15 ? 2 : 3;
    else if (gMonth === 6) monthIndex = gDay < 17 ? 3 : 4;
    else if (gMonth === 7) monthIndex = gDay < 17 ? 4 : 5;
    else if (gMonth === 8) monthIndex = gDay < 17 ? 5 : 6;
    else if (gMonth === 9) monthIndex = gDay < 17 ? 6 : 7;
    else if (gMonth === 10) monthIndex = gDay < 16 ? 7 : 8;
    else monthIndex = gDay < 16 ? 8 : 9; // month 11
  }

  const displayIndex = scheme === 'amanta' ? (monthIndex + 11) % 12 : monthIndex;
  return { year: vsYear, month: VS_MONTHS[displayIndex], monthIndex: displayIndex };
}

/**
 * Convert Gregorian date to approximate Saka era year and month.
 * Saka era = Gregorian - 78 (after Chaitra 1).
 */
export function gregorianToSaka(date: Date): { year: number; month: string; monthIndex: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  // Special handling for 2026 so that Chaitra starts on 19 March 2026
  if (gYear === 2026) {
    const chaitraStart = new Date(2026, 2, 19); // 2026-03-19

    let sakaYear: number;
    if (date < chaitraStart) {
      // Before 19 March 2026 we are still in the previous Saka year
      sakaYear = 2026 - 79;
      let monthIndex: number;
      if (gMonth === 0) monthIndex = gDay < 14 ? 9 : 10;
      else if (gMonth === 1) monthIndex = gDay < 12 ? 10 : 11;
      else monthIndex = 11;
      return { year: sakaYear, month: SAKA_MONTHS[monthIndex], monthIndex };
    }

    // From 19 March 2026 onwards we are in Saka year 1948
    sakaYear = 2026 - 78;
    let monthIndex = SAKA_2026_MONTH_STARTS[0].monthIndex;
    for (const entry of SAKA_2026_MONTH_STARTS) {
      if (date >= entry.start) {
        monthIndex = entry.monthIndex;
      } else {
        break;
      }
    }

    return { year: sakaYear, month: SAKA_MONTHS[monthIndex], monthIndex };
  }

  let sakaYear: number;
  let monthIndex: number;

  // Generic approximation for Saka new year (Chaitra 1) around March 22
  if (gMonth < 2 || (gMonth === 2 && gDay < 22)) {
    sakaYear = gYear - 79;
    if (gMonth === 0) monthIndex = gDay < 14 ? 9 : 10;
    else if (gMonth === 1) monthIndex = gDay < 12 ? 10 : 11;
    else monthIndex = 11;
  } else {
    sakaYear = gYear - 78;
    if (gMonth === 2) monthIndex = 0;
    else if (gMonth === 3) monthIndex = gDay < 21 ? 0 : 1;
    else if (gMonth === 4) monthIndex = gDay < 22 ? 1 : 2;
    else if (gMonth === 5) monthIndex = gDay < 22 ? 2 : 3;
    else if (gMonth === 6) monthIndex = gDay < 23 ? 3 : 4;
    else if (gMonth === 7) monthIndex = gDay < 23 ? 4 : 5;
    else if (gMonth === 8) monthIndex = gDay < 23 ? 5 : 6;
    else if (gMonth === 9) monthIndex = gDay < 23 ? 6 : 7;
    else if (gMonth === 10) monthIndex = gDay < 22 ? 7 : 8;
    else monthIndex = gDay < 22 ? 8 : 9;
  }

  return { year: sakaYear, month: SAKA_MONTHS[monthIndex], monthIndex };
}

/**
 * Generate all Gregorian dates belonging to the Vikram Samvat month that contains `anchorDate`.
 * Uses the existing gregorianToVikramSamvat mapping and walks backward/forward until the month changes.
 */
export function getVikramMonthDays(anchorDate: Date, scheme: MonthScheme): Date[] {
  const anchorInfo = gregorianToVikramSamvat(anchorDate, scheme);
  const days: Date[] = [];

  // Find month start by walking backward
  let start = new Date(anchorDate);
  // safety cap: don't walk back more than 40 days
  for (let i = 0; i < 40; i++) {
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 1);
    const prevInfo = gregorianToVikramSamvat(prev, scheme);
    if (prevInfo.year === anchorInfo.year && prevInfo.month === anchorInfo.month) {
      start = prev;
    } else {
      break;
    }
  }

  // Walk forward until month changes
  let current = new Date(start);
  for (let i = 0; i < 40; i++) {
    const info = gregorianToVikramSamvat(current, scheme);
    if (info.year !== anchorInfo.year || info.month !== anchorInfo.month) break;
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Generate all Gregorian dates belonging to the Saka month that contains `anchorDate`.
 */
export function getSakaMonthDays(anchorDate: Date): Date[] {
  const anchorInfo = gregorianToSaka(anchorDate);
  const days: Date[] = [];

  let start = new Date(anchorDate);
  for (let i = 0; i < 40; i++) {
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 1);
    const prevInfo = gregorianToSaka(prev);
    if (prevInfo.year === anchorInfo.year && prevInfo.month === anchorInfo.month) {
      start = prev;
    } else {
      break;
    }
  }

  let current = new Date(start);
  for (let i = 0; i < 40; i++) {
    const info = gregorianToSaka(current);
    if (info.year !== anchorInfo.year || info.month !== anchorInfo.month) break;
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Get Vedic zodiac sign for a given date
 */
export function getVedicZodiac(date: Date) {
  const month = date.getMonth();
  const day = date.getDate();

  // Map dates to zodiac indices based on Vedic astrology (Sidereal)
  const boundaries = [
    [0, 14], [1, 13], [2, 15], [3, 14], [4, 15], [5, 15],
    [6, 17], [7, 17], [8, 17], [9, 17], [10, 16], [11, 16]
  ];

  let index: number;
  if (day < boundaries[month][1]) {
    index = month; // previous zodiac
  } else {
    index = (month + 1) % 12;
  }

  // Adjust mapping: Jan before 14 = Dhanu (index 11)
  const zodiacMap = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (day < boundaries[month][1]) {
    return VEDIC_ZODIAC[zodiacMap[month]];
  }
  return VEDIC_ZODIAC[(zodiacMap[month] + 1) % 12];
}

export function getVedicZodiacForMonth(month: number): typeof VEDIC_ZODIAC[0] {
  // Returns the dominant zodiac for a Gregorian month (mid-month)
  const zodiacMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return VEDIC_ZODIAC[zodiacMap[month]];
}

export { VS_MONTHS, SAKA_MONTHS, VEDIC_ZODIAC };
