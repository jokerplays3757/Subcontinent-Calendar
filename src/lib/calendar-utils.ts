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
const VS_2026_MONTH_STARTS: { monthIndex: number; start: Date }[] = [
  { monthIndex: 0, start: new Date(2026, 2, 19) }, // Chaitra
  { monthIndex: 1, start: new Date(2026, 3, 17) }, // Vaishakha
  { monthIndex: 2, start: new Date(2026, 4, 17) }, // Jyeshtha
  { monthIndex: 3, start: new Date(2026, 5, 16) }, // Ashadha
  { monthIndex: 4, start: new Date(2026, 6, 16) }, // Shravana
  { monthIndex: 5, start: new Date(2026, 7, 15) }, // Bhadrapada
  { monthIndex: 6, start: new Date(2026, 8, 14) }, // Ashvina
  { monthIndex: 7, start: new Date(2026, 9, 14) }, // Kartika
  { monthIndex: 8, start: new Date(2026, 10, 13) }, // Margashirsha
  { monthIndex: 9, start: new Date(2026, 11, 13) }, // Pausha
];

const SAKA_2026_MONTH_STARTS: { monthIndex: number; start: Date }[] = [
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
];

/**
 * Convert Gregorian date to approximate Vikram Samvat year and month.
 * VS is ~56.7 years ahead. New year starts in Chaitra (~March/April).
 */
export function gregorianToVikramSamvat(
  date: Date,
  scheme: MonthScheme = 'purnimanta'
): { year: number; month: string; monthIndex: number; day: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  let vsYear: number;
  let monthIndex: number;
  let currentStart: Date;

  if (gYear === 2026) {
    const chaitraStart = new Date(2026, 2, 19);
    if (date < chaitraStart) {
      vsYear = 2082;
      if (gMonth === 0) {
        monthIndex = gDay < 14 ? 9 : 10;
        currentStart = new Date(2026, 0, gDay < 14 ? 1 : 14);
      } else if (gMonth === 1) {
        monthIndex = gDay < 12 ? 10 : 11;
        currentStart = new Date(2026, 1, gDay < 12 ? 1 : 12);
      } else {
        monthIndex = 11;
        currentStart = new Date(2026, 2, 1);
      }
    } else {
      vsYear = 2083;
      monthIndex = 0;
      currentStart = VS_2026_MONTH_STARTS[0].start;
      for (const entry of VS_2026_MONTH_STARTS) {
        if (date >= entry.start) {
          monthIndex = entry.monthIndex;
          currentStart = entry.start;
        } else break;
      }
    }
  } else {
    // Generic approximation for years other than 2026
    if (gMonth < 2 || (gMonth === 2 && gDay < 14)) {
      vsYear = gYear + 56;
      monthIndex = gMonth === 0 ? (gDay < 14 ? 9 : 10) : (gMonth === 1 ? (gDay < 12 ? 10 : 11) : 11);
      currentStart = new Date(gYear, gMonth, 1);
    } else {
      vsYear = gYear + 57;
      monthIndex = gMonth === 2 ? 0 : 1;
      currentStart = new Date(gYear, 2, 19);
    }
  }

  // Calculate normalized day
  const diffTime = date.getTime() - currentStart.getTime();
  const rawDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const day = rawDay > 31 ? 1 : (rawDay < 1 ? 30 : rawDay);

  const displayIndex = scheme === 'amanta' ? (monthIndex + 11) % 12 : monthIndex;
  return { year: vsYear, month: VS_MONTHS[displayIndex], monthIndex: displayIndex, day };
}

/**
 * Convert Gregorian date to approximate Saka era year and month.
 */
export function gregorianToSaka(date: Date): { year: number; month: string; monthIndex: number; day: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  let sakaYear: number;
  let monthIndex: number;
  let currentStart: Date;

  if (gYear === 2026) {
    const chaitraStart = new Date(2026, 2, 19);
    if (date < chaitraStart) {
      sakaYear = 1947;
      monthIndex = gMonth === 0 ? (gDay < 14 ? 9 : 10) : (gMonth === 1 ? (gDay < 12 ? 10 : 11) : 11);
      currentStart = new Date(2026, 0, 1);
    } else {
      sakaYear = 1948;
      monthIndex = 0;
      currentStart = SAKA_2026_MONTH_STARTS[0].start;
      for (const entry of SAKA_2026_MONTH_STARTS) {
        if (date >= entry.start) {
          monthIndex = entry.monthIndex;
          currentStart = entry.start;
        } else break;
      }
    }
  } else {
    sakaYear = gMonth < 2 || (gMonth === 2 && gDay < 22) ? gYear - 79 : gYear - 78;
    monthIndex = 0;
    currentStart = new Date(gYear, 2, 22);
  }

  // Calculate normalized day
  const diffTime = date.getTime() - currentStart.getTime();
  const rawDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const day = rawDay > 31 ? 1 : (rawDay < 1 ? 30 : rawDay);

  return { year: sakaYear, month: SAKA_MONTHS[monthIndex], monthIndex, day };
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

  const zodiacMap = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const index = (day < boundaries[month][1]) ? zodiacMap[month] : (zodiacMap[month] + 1) % 12;

  return VEDIC_ZODIAC[index];
}

export function getVedicZodiacForMonth(month: number): typeof VEDIC_ZODIAC[0] {
  return VEDIC_ZODIAC[month];
}

export { VS_MONTHS, SAKA_MONTHS, VEDIC_ZODIAC };