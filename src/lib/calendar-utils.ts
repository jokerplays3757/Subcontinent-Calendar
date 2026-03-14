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

/**
 * Convert Gregorian date to approximate Vikram Samvat year and month.
 * VS is ~56.7 years ahead. New year starts in Chaitra (~March/April).
 */
export function gregorianToVikramSamvat(date: Date): { year: number; month: string; monthIndex: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-11
  const gDay = date.getDate();

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

  return { year: vsYear, month: VS_MONTHS[monthIndex], monthIndex };
}

/**
 * Convert Gregorian date to approximate Saka era year and month.
 * Saka era = Gregorian - 78 (after Chaitra 1, ~March 22).
 */
export function gregorianToSaka(date: Date): { year: number; month: string; monthIndex: number } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  let sakaYear: number;
  let monthIndex: number;

  // Saka new year (Chaitra 1) falls around March 22
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
