const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix VISIT_CATEGORIES - replace the entire corrupted block
const corruptedBlock = /const VISIT_CATEGORIES = \[[\s\S]*?\];/;

const fixedBlock = `const VISIT_CATEGORIES = [
  { id: 'spiritual', label: '\uC601\uC801 \uB3CC\uBD04', icon: '\u271D\uFE0F', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'family', label: '\uAC00\uC815/\uAD00\uACC4', icon: '\uD83C\uDFE0', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'job', label: '\uC9C1\uC7A5/\uC9C4\uB85C', icon: '\uD83D\uDCBC', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'finance', label: '\uC7AC\uC815', icon: '\uD83D\uDCB0', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'health', label: '\uAC74\uAC15', icon: '\uD83C\uDFE5', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'other', label: '\uAE30\uD0C0', icon: '\uD83D\uDCDD', color: 'bg-surface-container text-on-surface-variant border-surface-container-high' },
];`;

const newContent = content.replace(corruptedBlock, fixedBlock);

if (newContent === content) {
  console.log('ERROR: Pattern not found!');
  // Show what we found around that area
  const idx = content.indexOf('const VISIT_CATEGORIES');
  if (idx >= 0) {
    console.log('Found at index', idx);
    console.log(JSON.stringify(content.substring(idx, idx + 400)));
  }
} else {
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('SUCCESS: VISIT_CATEGORIES fixed!');
}
