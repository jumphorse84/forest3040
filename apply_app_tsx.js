const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    // 1. Add import
    if (!code.includes("import ProgramDetailView from './views/ProgramDetailView';")) {
        code = code.replace(
            "import ProgramAddView from './views/ProgramAddView';",
            "import ProgramAddView from './views/ProgramAddView';\nimport ProgramDetailView from './views/ProgramDetailView';"
        );
    }

    // 2. Add subPage routing
    const detailViewCode = `
        {subPage === 'program_detail' && (
          <ProgramDetailView 
            user={currentUser}
            programId={selectedProgramId}
            programs={programs.length > 0 ? programs : mockDb.programs}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}`;

    if (!code.includes("subPage === 'program_detail'")) {
        code = code.replace(
            "{subPage === 'program_add' && (",
            detailViewCode + "\n        {subPage === 'program_add' && ("
        );
    }

    // 3. REMOVE LOCAL ProgramDetailView
    // We know it starts with "const ProgramDetailView = ({ user,"
    // And it ends right before "// ==========================================\n// 5. Worship View (온라인 주보)"
    const startStr = "const ProgramDetailView = ({ user, programId";
    const endStr = "// ==========================================\n// 5. Worship View";
    
    const startIdx = code.indexOf(startStr);
    const endIdx = code.indexOf(endStr);
    
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        code = code.substring(0, startIdx) + code.substring(endIdx);
        console.log("Successfully stripped duplicate local ProgramDetailView");
    } else {
        console.log("Could not find bounds to strip duplicate ProgramDetailView", startIdx, endIdx);
    }

    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully assembled App.tsx");
} catch (e) {
    console.error(e);
}
