const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const components = [];
let currentComp = null;
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^const ([A-Z][A-Za-z0-9_]*) = \(/);
  if (match) {
    if (currentComp) {
      // rough measure until next component
      components.push({ name: currentComp, lines: i - startLine });
    }
    currentComp = match[1];
    startLine = i;
  }
}
if (currentComp) {
  components.push({ name: currentComp, lines: lines.length - startLine });
}

components.sort((a, b) => b.lines - a.lines);
console.log(components.slice(0, 15));
