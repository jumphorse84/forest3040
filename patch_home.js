const fs = require('fs');
let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

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

if (!code.includes('const calculateDDay = (')) {
  code = code.replace(
    /return \(\r?\n    <>\r?\n/m,
    ddayHelper + '\n  return (\n    <>\n'
  );
  
  code = code.replace(
    /dDay=\{schedule\.d_day\}/g,
    "dDay={schedule.d_day && schedule.d_day !== 'D-?' && !schedule.d_day.includes('?') ? schedule.d_day : calculateDDay(schedule.fullDate)}"
  );
  
  fs.writeFileSync('src/views/HomeView.tsx', code, 'utf8');
  console.log('HomeView patched with dynamic D-Day');
} else {
  console.log('Already patched HomeView');
}
