const fs = require('fs');

try {
    let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

    // 1. Fix onClick handler
    code = code.replace(
        "hoverBg=\"hover:bg-primary-container\" onClick={() => onNavigate('attendance')} />",
        "hoverBg=\"hover:bg-primary-container\" onClick={() => setIsTicketModalOpen(true)} />"
    );

    // 2. Add Modal to the bottom
    const modalJSX = `
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        user={ticketUser} 
      />
    </>
  );
};`;
    
    // Support \r\n or \n
    code = code.replace(/    <\/section>\r?\n    <\/>\r?\n  \);\r?\n\};/, "    </section>\n" + modalJSX);

    fs.writeFileSync('src/views/HomeView.tsx', code, 'utf8');
    console.log("Successfully fixed TicketModal in HomeView.");
} catch (e) {
    console.error(e);
}
