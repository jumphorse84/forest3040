const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert the NotificationModal just before the closing tags of App fn
const target = `      )}
    </div>
  );
}

// ==========================================
// 3. Sub Views`;

const replacement = `      )}

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

// ==========================================
// 3. Sub Views`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('SUCCESS: NotificationModal injected into JSX.');
} else {
  console.log('FAIL: Target string not found. Showing context...');
  const idx = content.indexOf('3. Sub Views');
  if (idx !== -1) {
    console.log(JSON.stringify(content.slice(idx - 100, idx + 50)));
  }
}
