// Holiday and shopping event checker

export interface Holiday {
  name: string;
  date: string; // Format: "MM-DD" for annual holidays, or "YYYY-MM-DD" for specific dates
  type: 'holiday' | 'shopping' | 'seasonal';
}

// List of holidays and shopping events
const holidays: Holiday[] = [
  // Shopping events
  { name: 'Black Friday', date: '11-29', type: 'shopping' }, // Last Friday of November
  { name: 'Cyber Monday', date: '12-02', type: 'shopping' }, // Monday after Black Friday
  { name: 'Prime Day', date: '07-15', type: 'shopping' }, // Approximate date, may vary
  
  // Major holidays
  { name: 'Christmas', date: '12-25', type: 'holiday' },
  { name: 'New Year\'s Day', date: '01-01', type: 'holiday' },
  { name: 'Valentine\'s Day', date: '02-14', type: 'holiday' },
  { name: 'Easter', date: '04-09', type: 'holiday' }, // Approximate, varies by year
  { name: 'Mother\'s Day', date: '05-12', type: 'holiday' }, // Second Sunday of May (approximate)
  { name: 'Father\'s Day', date: '06-16', type: 'holiday' }, // Third Sunday of June (approximate)
  { name: 'Independence Day', date: '07-04', type: 'holiday' },
  { name: 'Halloween', date: '10-31', type: 'holiday' },
  { name: 'Thanksgiving', date: '11-28', type: 'holiday' }, // Fourth Thursday of November (approximate)
  
  // Seasonal events
  { name: 'Spring Sale', date: '03-20', type: 'seasonal' },
  { name: 'Summer Sale', date: '06-21', type: 'seasonal' },
  { name: 'Back to School', date: '08-15', type: 'seasonal' },
  { name: 'Holiday Season', date: '12-01', type: 'seasonal' },
];

/**
 * Calculate Black Friday date (last Friday of November)
 */
function getBlackFridayDate(year: number): Date {
  const november = new Date(year, 10, 1); // November is month 10 (0-indexed)
  const lastDay = new Date(year, 11, 0); // Last day of November
  const lastFriday = new Date(lastDay);
  lastFriday.setDate(lastDay.getDate() - ((lastDay.getDay() + 2) % 7));
  return lastFriday;
}

/**
 * Check if current date matches a holiday
 */
export function checkHoliday(date: Date = new Date()): Holiday | null {
  const currentMonth = date.getMonth() + 1; // 1-12
  const currentDay = date.getDate();
  const currentYear = date.getFullYear();
  const monthDay = `${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  // Check fixed date holidays
  for (const holiday of holidays) {
    if (holiday.date === monthDay) {
      // Special handling for Black Friday
      if (holiday.name === 'Black Friday') {
        const blackFriday = getBlackFridayDate(currentYear);
        if (
          date.getMonth() === blackFriday.getMonth() &&
          date.getDate() === blackFriday.getDate()
        ) {
          return holiday;
        }
      } else {
        return holiday;
      }
    }
  }

  return null;
}

/**
 * Get upcoming holidays within the next N days
 */
export function getUpcomingHolidays(days: number = 30): Holiday[] {
  const upcoming: Holiday[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const holiday = checkHoliday(checkDate);
    if (holiday) {
      upcoming.push(holiday);
    }
  }
  
  return upcoming;
}

/**
 * Get holiday reminder message
 */
export function getHolidayReminderMessage(holiday: Holiday): string {
  return `Don't forget about ${holiday.name}! Plan your content ahead`;
}
