const fs = require('fs');
const bk = fs.readFileSync('src/App.tsx.backup', 'utf-8');

// Find end of a top-level const arrow function component
// Handles: const Foo = ({ a, b }: { a: string, b: () => void }) => { ... };
// or:       const Foo = ({ a, b }: any) => ( ... );
function findComponentEnd(content, namePos) {
  // Find "const Name = (" - the opening paren of parameters
  const eqPos = content.indexOf(' = (', namePos);
  if (eqPos === -1 || eqPos > namePos + 200) return -1;
  
  // Skip past the parameter block by tracking parens from '('
  let parenDepth = 0;
  let i = eqPos + 3; // position of the '('
  let inString = false;
  let stringChar = '';
  
  while (i < content.length) {
    const ch = content[i];
    if (!inString && (ch === '"' || ch === "'" || ch === '`')) {
      inString = true; stringChar = ch;
    } else if (inString && ch === stringChar && content[i-1] !== '\\') {
      inString = false;
    }
    if (!inString) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') {
        parenDepth--;
        if (parenDepth === 0) { i++; break; }
      }
    }
    i++;
  }
  
  // Now skip "=>" and whitespace
  while (i < content.length && (content[i] === ' ' || content[i] === '\n' || content[i] === '\r')) i++;
  if (content[i] === '=' && content[i+1] === '>') i += 2;
  while (i < content.length && (content[i] === ' ' || content[i] === '\n' || content[i] === '\r')) i++;
  
  // Now we should be at { or (
  const openChar = content[i];
  if (openChar !== '{' && openChar !== '(') {
    console.warn(`Expected { or ( but got: "${content.substring(i, i+15)}"`);
    return -1;
  }
  const closeChar = openChar === '(' ? ')' : '}';
  
  // Track depth
  let depth = 0;
  let inLineComment = false;
  let inBlockComment = false;
  inString = false;
  
  while (i < content.length) {
    const ch = content[i];
    const peek = content[i + 1];
    
    if (!inString && !inBlockComment && !inLineComment && ch === '/' && peek === '/') {
      inLineComment = true;
    } else if (inLineComment && ch === '\n') {
      inLineComment = false;
    } else if (!inString && !inLineComment && !inBlockComment && ch === '/' && peek === '*') {
      inBlockComment = true; i++;
    } else if (inBlockComment && ch === '*' && peek === '/') {
      inBlockComment = false; i++;
    }
    
    if (!inString && !inLineComment && !inBlockComment) {
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true; stringChar = ch;
      }
    } else if (inString && ch === stringChar && content[i-1] !== '\\') {
      inString = false;
    }
    
    if (!inString && !inLineComment && !inBlockComment) {
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          let end = i + 1;
          if (content[end] === ';') end++;
          if (content[end] === '\n') end++;
          return end;
        }
      }
    }
    i++;
  }
  return -1;
}

const viewNames = [
  'HomeView', 'MembersView', 'AdminUserManagementView', 'MyPageView',
  'ProgramView', 'ProgramAddView', 'WorshipView', 'WorshipAddView',
  'WorshipDetailView', 'KidsView', 'CalendarView', 'SurveyView',
  'PastoralStatsDashboardView',
];

const removeRanges = [];
for (const name of viewNames) {
  const marker = `\nconst ${name} = `;
  const pos = bk.indexOf(marker);
  if (pos === -1) { console.warn(`Not found: ${name}`); continue; }
  const end = findComponentEnd(bk, pos);
  if (end === -1) { 
    console.warn(`Could not find end of: ${name} — skipping`); 
    continue; 
  }
  removeRanges.push({ name, start: pos, end });
  console.log(`✅ ${name}: ${Math.round((end-pos)/1024)}KB`);
}

removeRanges.sort((a, b) => a.start - b.start);

let result = '';
let cursor = 0;
for (const range of removeRanges) {
  result += bk.substring(cursor, range.start);
  cursor = range.end;
}
result += bk.substring(cursor);

console.log(`\nBefore: ${Math.round(bk.length/1024)}KB → After removing views: ${Math.round(result.length/1024)}KB`);

// Add exports to shared helpers
result = result.replace('\nenum OperationType {', '\nexport enum OperationType {');
result = result.replace('\nfunction handleFirestoreError(', '\nexport function handleFirestoreError(');
result = result.replace('\nconst VISIT_CATEGORIES = [', '\nexport const VISIT_CATEGORIES = [');
result = result.replace('\nfunction MenuButton(', '\nexport function MenuButton(');
result = result.replace('\nfunction ScheduleItem(', '\nexport function ScheduleItem(');
result = result.replace('\nconst MemberRow = ', '\nexport const MemberRow = ');

// Add view imports before main App()
const viewImports = `// ==========================================
// View Imports (modularized)
// ==========================================
import HomeView from './views/HomeView';
import MembersView from './views/MembersView';
import AdminUserManagementView from './views/AdminUserManagementView';
import MyPageView from './views/MyPageView';
import ProgramView from './views/ProgramView';
import ProgramAddView from './views/ProgramAddView';
import WorshipView from './views/WorshipView';
import WorshipAddView from './views/WorshipAddView';
import WorshipDetailView from './views/WorshipDetailView';
import KidsView from './views/KidsView';
import CalendarView from './views/CalendarView';
import SurveyView from './views/SurveyView';
import PastoralStatsDashboardView from './views/PastoralStatsDashboardView';`;

const appPos = result.lastIndexOf('\nexport default function App()');
if (appPos !== -1) {
  result = result.substring(0, appPos) + '\n' + viewImports + '\n' + result.substring(appPos);
  console.log('✅ Inserted view imports');
} else {
  console.error('❌ main App() not found');
}

fs.writeFileSync('src/App.tsx', result, 'utf-8');
console.log(`\n✅ Done! App.tsx: ${Math.round(result.length/1024)}KB, ${result.split('\n').length} lines`);
