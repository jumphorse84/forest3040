const fs = require('fs');

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("const Toast = ({ message }")) {
    if (lines[i-1].trim() !== "};" && lines[i-2].trim() !== "};" && lines[i-3].trim() !== "};") {
      lines.splice(i, 0, "};");
      console.log('Inserted }; at line ' + (i+1));
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
