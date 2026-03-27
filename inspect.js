const fs = require('fs');
try {
  const data = fs.readFileSync('firebase_projects.json', 'utf16le');
  // Strip BOM if present
  const cleaned = data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data;
  const json = JSON.parse(cleaned);
  const projects = json.result.map(p => `${p.projectId} \t ${p.displayName}`);
  console.log(projects.join('\n'));
} catch (e) {
  console.error("Error:", e.message);
}
