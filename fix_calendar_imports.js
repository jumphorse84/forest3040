const fs = require('fs');

try {
    let code = fs.readFileSync('src/views/CalendarView.tsx', 'utf8');

    // Remove the extra import line if it's identical
    code = code.replace("import { handleFirestoreError, OperationType } from '../App';", "");

    fs.writeFileSync('src/views/CalendarView.tsx', code, 'utf8');
    console.log("Successfully fixed duplicate imports in CalendarView.tsx.");
} catch (e) {
    console.error(e);
}
