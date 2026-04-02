const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix corrupted Korean characters
const fixes = [
  ["{ value: 'worship', label: '혈배'", "{ value: 'worship', label: '예배'"],
  ["{ value: 'volunteer', label: '봄사'", "{ value: 'volunteer', label: '봉사'"],
];

for (const [from, to] of fixes) {
  if (content.includes(from)) {
    content = content.replace(from, to);
    console.log(`Fixed: ${from} → ${to}`);
  } else {
    console.log(`NOT FOUND: ${from}`);
  }
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done!');
