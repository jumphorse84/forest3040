const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find and replace using regex to handle both CRLF and LF
const oldRegex = /\{schedules\.map\(\(schedule: any\) => \(\s*<ScheduleItem\s*key=\{schedule\.id\}\s*month=\{schedule\.date\.split\(' '\)\[0\]\}\s*day=\{schedule\.date\.split\(' '\)\[1\]\.replace\('일', ''\)\}\s*dDay=\{schedule\.d_day\}\s*time=\{schedule\.time\}\s*title=\{schedule\.title\}\s*location=\{schedule\.location\}\s*dDayClass=\{schedule\.active \? "bg-error-container\/20 text-on-error-container" : "bg-surface-container-high text-on-surface-variant"\}\s*active=\{schedule\.active\}\s*\/>\s*\)\)}/;

const newCode = `{schedules
          .filter((s: any) => s.active !== false)
          .sort((a: any, b: any) => (a.fullDate || '').localeCompare(b.fullDate || ''))
          .slice(0, 5)
          .map((schedule: any) => {
            const parts = schedule.fullDate ? schedule.fullDate.split('-') : [];
            const month = parts.length >= 2 ? parseInt(parts[1]) + '월' : '';
            const day = parts.length >= 3 ? parseInt(parts[2]) + '' : '';
            return (
              <ScheduleItem
                key={schedule.id}
                month={month}
                day={day}
                dDay={schedule.d_day}
                time={schedule.time}
                title={schedule.title}
                location={schedule.location}
                dDayClass={schedule.active ? "bg-error-container/20 text-on-error-container" : "bg-surface-container-high text-on-surface-variant"}
                active={schedule.active}
              />
            );
          })}`;

if (oldRegex.test(content)) {
  content = content.replace(oldRegex, newCode);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Fixed schedule date parsing!');
} else {
  console.log('Regex did not match. Trying line by line approach...');
  
  // Find line index by searching for the problematic line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("schedule.date.split(' ')[0]")) {
      console.log(`Found at line ${i+1}:`);
      console.log(lines.slice(Math.max(0, i-3), i+15).join('\n'));
      break;
    }
  }
}
