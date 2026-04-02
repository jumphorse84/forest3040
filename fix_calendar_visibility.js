const fs = require('fs');

try {
    // 1. Fix App.tsx
    let appCode = fs.readFileSync('src/App.tsx', 'utf8');
    appCode = appCode.replace(
        /<CalendarView schedules=\{schedules\.length > 0 \? schedules : mockDb\.schedules\} onShowToast=\{showToast\} \/>/g,
        "<CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />"
    );
    appCode = appCode.replace(
        /<CalendarView schedules=\{schedules\} onShowToast=\{showToast\} \/>/g,
        "<CalendarView user={currentUser} schedules={schedules} onShowToast={showToast} />"
    );
    // Be generic just in case it doesn't match perfectly
    if (appCode.indexOf('<CalendarView user={currentUser}') === -1) {
        appCode = appCode.replace(/<CalendarView/g, "<CalendarView user={currentUser}");
    }
    fs.writeFileSync('src/App.tsx', appCode, 'utf8');
    console.log("Fixed App.tsx to pass user");

    // 2. Clean CalendarView.tsx
    let calCode = fs.readFileSync('src/views/CalendarView.tsx', 'utf8');
    
    // We know there's a duplicate block near the end of CalendarView.tsx starting with {/* Schedule Add Action */}
    // The first one starts around line 227. The second one starts around line 418.
    // Let's find the last occurrence of Schedule Add Action and remove it.
    const duplicateTag = '{/* Schedule Add Action */}';
    const firstTag = calCode.indexOf(duplicateTag);
    const lastTag = calCode.lastIndexOf(duplicateTag);

    if (firstTag !== -1 && lastTag !== -1 && firstTag !== lastTag) {
        // we found a duplicate
        const cutStart = lastTag;
        const endOfComponent = calCode.lastIndexOf('};');
        
        if (endOfComponent !== -1 && cutStart < endOfComponent) {
            // Cut it out! 
            // Wait, we need to make sure we don't cut the component ending bracket.
            calCode = calCode.substring(0, cutStart) + "\n    </div>\n  );\n};\n\nexport default CalendarView;";
            fs.writeFileSync('src/views/CalendarView.tsx', calCode, 'utf8');
            console.log("Successfully stripped duplicate Add Action logic from CalendarView");
        } else {
            console.log("Could not find end of component securely.");
        }
    } else {
        console.log("No duplicate tags found");
    }

} catch (e) {
    console.error(e);
}
