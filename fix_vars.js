const fs = require('fs');
const path = require('path');

const backup = fs.readFileSync('src/App.tsx.backup', 'utf-8');

const opStart = backup.indexOf('enum OperationType {');
const opEnd = backup.indexOf('}', opStart) + 1;
const opCode = backup.substring(opStart, opEnd);

const hfStart = backup.indexOf('function handleFirestoreError(');
const hfEnd = backup.indexOf('}', hfStart) + 1;
let hfCode = backup.substring(hfStart, hfEnd);

const sgStart = backup.indexOf('const SmallGroupCard =');
const sgEnd = backup.indexOf('};', sgStart) + 2;
const sgCode = backup.substring(sgStart, sgEnd);

const toAppend = `\nexport ${opCode}\nexport ${hfCode}\nexport ${sgCode}\n`;

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
if (!appContent.includes('enum OperationType {')) {
    fs.appendFileSync('src/App.tsx', toAppend, 'utf-8');
    console.log('Appended to App.tsx');
}

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir);

files.forEach(file => {
    if (file.endsWith('.tsx')) {
        let content = fs.readFileSync(path.join(viewsDir, file), 'utf-8');
        if (!content.includes('import { OperationType')) {
            const imports = "import { OperationType, handleFirestoreError, SmallGroupCard } from '../App';\n";
            content = content.replace(/(?<=from 'lucide-react';[\s\S]*?)const /m, imports + "const ");
            fs.writeFileSync(path.join(viewsDir, file), content, 'utf-8');
            console.log('Updated', file);
        }
    }
});
