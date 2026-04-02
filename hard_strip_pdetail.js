const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    const startIdx = code.indexOf('const ProgramDetailView = ({ user, programId');
    const endBound = code.indexOf('const Toast = ({ message');

    if (startIdx !== -1 && endBound !== -1) {
        // Find the last "};" before endBound
        const substring = code.substring(startIdx, endBound);
        const lastBrace = substring.lastIndexOf('};');
        
        if (lastBrace !== -1) {
            const cutEnd = startIdx + lastBrace + 2;
            code = code.substring(0, startIdx) + code.substring(cutEnd);
            fs.writeFileSync('src/App.tsx', code, 'utf8');
            console.log("Successfully hard-stripped ProgramDetailView.");
        }
    } else {
        console.log("Could not find start or end bounds.");
    }
} catch (e) {
    console.error(e);
}
