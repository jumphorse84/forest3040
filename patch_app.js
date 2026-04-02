const fs = require('fs');

try {
    let code = fs.readFileSync('src/App.tsx', 'utf8');

    // 1. Add import ProgramDetailView
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

    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully patched App.tsx");
} catch (e) {
    console.error(e);
}
