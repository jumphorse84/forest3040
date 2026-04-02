const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    const startIdx = code.indexOf('const ProgramDetailView = ({ user, programId,');
    if (startIdx !== -1) {
        // Find the end of this component. The component ends before the next export or const.
        // Let's just find the exact next major block.
        const endIdx = code.indexOf('const WorshipView =', startIdx);
        if (endIdx !== -1) {
            code = code.substring(0, startIdx) + code.substring(endIdx);
            fs.writeFileSync('src/App.tsx', code, 'utf8');
            console.log("Successfully removed ProgramDetailView by boundary search.");
        } else {
            console.log("Could not find end boundary");
        }
    } else {
        console.log("Could not find start boundary");
    }

} catch (e) {
    console.error(e);
}
