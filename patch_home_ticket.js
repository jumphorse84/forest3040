const fs = require('fs');

try {
    let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');
    
    // 1. Add import
    if (!code.includes("TicketModal")) {
        code = code.replace("import { MenuButton }", "import { TicketModal } from '../components/TicketModal';\nimport { MenuButton }");
        // Fallback if MenuButton is not imported this way:
        if (!code.includes("TicketModal")) {
            code = "import { TicketModal } from '../components/TicketModal';\n" + code;
        }
    }

    // 2. Add state and map user
    const stateAnchor = "const HomeView = ({ user, schedules, programs, worships, onNavigateToProgram, onNavigateToWorship, onShowToast, onNavigateToMyForestBoard, onNavigate }: any) => {";
    
    // We try multiple signatures just in case parameter list differs
    const targetSignature = code.match(/const HomeView = \([^)]+\) => \{/);
    if (targetSignature && !code.includes('isTicketModalOpen')) {
        const stateAddition = `
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  
  const ticketUser = user ? {
    avatarSrc: '',
    avatarFallback: user.name?.substring(0, 1) || '👤',
    name: user.name || '방문자',
    affiliation: user.forest || '소속 숲 없음',
    title: user.role === 'admin' ? '운영진' : user.role === 'leader' ? '마을장' : '멤버',
    birthdate: user.birthDate || 'YYYY.MM.DD',
    qrData: user.uid ? \`\${user.uid}_\${Date.now()}\` : 'GUEST_QR'
  } : null;
`;
        code = code.replace(targetSignature[0], targetSignature[0] + '\n' + stateAddition);
    }

    // 3. Update the onClick handler for Attendance (출석체크)
    if (code.includes("label=\"출석체크\"")) {
        // Change onClick={() => onNavigate('attendance')} to onClick={() => setIsTicketModalOpen(true)}
        // We'll replace the entire tag safely using regex
        code = code.replace(
            /(<MenuButton[^>]+label="출석체크"[^>]+onClick=\{)[^}]+(\}\s*\/>)/g,
            '$1() => setIsTicketModalOpen(true)$2'
        );
    }

    // 4. Inject Modal Component
    const modalCode = `
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        user={ticketUser} 
      />
    </div>
  );
};
`;
    if (!code.includes("<TicketModal isOpen={isTicketModalOpen}")) {
        code = code.replace(/    <\/div>\r?\n  \);\r?\n\};\r?\n?$/, modalCode);
    }

    fs.writeFileSync('src/views/HomeView.tsx', code, 'utf8');
    console.log("TicketModal integrated into HomeView.");
} catch (e) {
    console.error(e);
}
