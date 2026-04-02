const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    // Add exports
    code = code.replace(/const VISIT_CATEGORIES =/g, 'export const VISIT_CATEGORIES =');
    code = code.replace(/const MenuButton =/g, 'export const MenuButton =');
    code = code.replace(/const ScheduleItem =/g, 'export const ScheduleItem =');
    code = code.replace(/const MemberRow =/g, 'export const MemberRow =');
    code = code.replace(/enum OperationType/g, 'export enum OperationType');
    code = code.replace(/function handleFirestoreError/g, 'export function handleFirestoreError');

    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully restored missing exports in App.tsx");
} catch (e) {
    console.error(e);
}
