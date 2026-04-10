const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  "import WorshipView from './views/WorshipView';",
  "import WorshipView from './views/WorshipView';\nimport { NotificationModal } from './components/NotificationModal';"
);

// 2. States
content = content.replace(
  "const [weeklySettlements, setWeeklySettlements] = useState<any[]>([]);",
  "const [weeklySettlements, setWeeklySettlements] = useState<any[]>([]);\n  const [notifications, setNotifications] = useState<any[]>([]);\n  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);"
);

// 3. Subscription reset
content = content.replace(
  "setWeeklySettlements([]);\n      return;",
  "setWeeklySettlements([]);\n      setNotifications([]);\n      return;"
);

// 4. Subscription logic
content = content.replace(
  "const unsubKidsCares = onSnapshot(collection(firestoreDb, 'kids_cares'), (snapshot) => {\n      setKidsCares(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));\n    }, (err) => handleFirestoreError(err, OperationType.GET, 'kids_cares'));",
  "const unsubKidsCares = onSnapshot(collection(firestoreDb, 'kids_cares'), (snapshot) => {\n      setKidsCares(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));\n    }, (err) => handleFirestoreError(err, OperationType.GET, 'kids_cares'));\n\n    const qNotifications = query(collection(firestoreDb, 'notifications'), orderBy('createdAt', 'desc'));\n    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {\n      setNotifications(snapshot.docs.map(d => ({ ...d.data(), id: d.id })).slice(0, 50));\n    }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));"
);

// 5. Subscription cleanup
content = content.replace(
  "unsubKidsCares();\n      unsubFees();",
  "unsubKidsCares();\n      unsubNotifications();\n      unsubFees();"
);

// 6. Calculate unread + inject logic before return (we will put it right before `return (` of the whole app, which is near line 588 depending on what's there. Actually, right before `return (` of the `App` component).
// Or we can just calculate it inline where the Bell is. Let's do it right before `return (` in App rendering. Let me find a safe anchor.
// `  return (` in `export default function App()`
// There's only one main `return (` at the bottom of standard react component.
// Let's just insert it here:
const returnPrefix = "  return (\n    <div";
const calcUnread = `
  const hasUnreadNotifications = user && userData && notifications.length > 0 && 
    (!userData.lastCheckedNotificationAt || notifications[0].createdAt > userData.lastCheckedNotificationAt);

  return (
    <div`;
content = content.replace(returnPrefix, calcUnread);

// 7. Inject Modal at the bottom, just inside the main wrapper.
const endDivAnchor = "      <Toast message={toastMessage} />\n    </div>\n  );\n}";
const modalHtml = `      <Toast message={toastMessage} />
      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
        notifications={notifications} 
      />
    </div>
  );
}`;
content = content.replace(endDivAnchor, modalHtml);

// 8. Update Bell Icon
const oldBell = `<div className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer">
              <Bell className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
            </div>`;
const newBell = `<div 
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
content = content.replace(oldBell, newBell);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully.');
