const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split(/\r?\n/);

const newBellFn = `            <div 
              className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer relative"
              onClick={() => {
                setIsNotificationModalOpen(true);
                if (user && hasUnreadNotifications) {
                  updateDoc(doc(firestoreDb, 'users', user.uid), { lastCheckedNotificationAt: new Date().toISOString() });
                }
              }}
            >
              <Bell className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
              {hasUnreadNotifications && (
                <span className="absolute top-0 -right-0.5 w-[10px] h-[10px] bg-red-500 border-2 border-surface rounded-full shadow-sm animate-pulse"></span>
              )}
            </div>`;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<Bell className="text-stone-600') && !lines[i-1].includes('onClick')) {
    // Found the bell icon, lets replace lines i-1 to i+1
    lines.splice(i-1, 3, newBellFn);
    console.log('Bell icon patched at line ' + i);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
