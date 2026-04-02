const fs = require('fs');
let code = fs.readFileSync('src/views/CalendarView.tsx', 'utf8');

// Fix 1: Dates logic (using regex replacement safely)
code = code.replace(
  /const \[currentDate, setCurrentDate\] = useState\(new Date\(2026, 2, 1\)\); \/\/ March 2026/,
  '  const [today] = useState(new Date());\n  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));'
);

code = code.replace(
  /const \[selectedDate, setSelectedDate\] = useState\(new Date\(2026, 2, 26\)\); \/\/ March 26, 2026/,
  'const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));'
);

code = code.replace(
  /const isToday = isSameDate\(date, new Date\(2026, 2, 26\)\); \/\/ Mock today/,
  'const isToday = isSameDate(date, today);'
);

// Fix 2: Add dynamic calculateDDay helper before rendering mapped schedules
if (!code.includes('const calculateDDay = (')) {
  const ddayHelper = `
  const calculateDDay = (targetDateStr: string) => {
    if (!targetDateStr) return '';
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const diff = target.getTime() - now.getTime();
    const dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dDay === 0) return 'D-Day';
    if (dDay > 0) return \`D-\${dDay}\`;
    return \`D+\${Math.abs(dDay)}\`;
  };
`;
  code = code.replace(
    /const selectedSchedules = getSchedulesForDate\(selectedDate\);/,
    `const selectedSchedules = getSchedulesForDate(selectedDate);\n${ddayHelper}`
  );
}

// Replace schedule.d_day with dynamically calculated one
code = code.replace(/\{schedule\.d_day\}/g, '{schedule.d_day && schedule.d_day !== \'D-?\' ? schedule.d_day : calculateDDay(schedule.fullDate)}');

fs.writeFileSync('src/views/CalendarView.tsx', code, 'utf8');
console.log('Calendar patched successfully');
