const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const bellOld = `<div className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer">
              <Bell className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
            </div>`;

const bellNew = `<div 
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

content = content.replace(bellOld, bellNew);

const returnOld = `  return (
    <div className=\`bg-surface`;

const returnNew = `  const hasUnreadNotifications = user && userData && notifications && notifications.length > 0 && 
    (!userData.lastCheckedNotificationAt || notifications[0].createdAt > userData.lastCheckedNotificationAt);

  return (
    <div className=\`bg-surface`;

content = content.replace(returnOld, returnNew);

const modalOld = `        </div>
      )}
    </div>
  );
}`;

const modalNew = `        </div>
      )}

      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
        notifications={notifications} 
      />
    </div>
  );
}`;

// Use lastIndexOf in case there are multiple matching closings
const lastIdx = content.lastIndexOf(modalOld);
if (lastIdx !== -1) {
  content = content.slice(0, lastIdx) + modalNew + content.slice(lastIdx + modalOld.length);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed patches done!');
