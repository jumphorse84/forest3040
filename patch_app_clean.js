const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    // Remove embedded ProgramDetailView
    const regex = /const ProgramDetailView = \(\{[^\}]+\}\) => \{[\s\S]*?^};/m;
    code = code.replace(regex, '');

    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully removed embedded ProgramDetailView from App.tsx");
} catch (e) {
    console.error(e);
}
