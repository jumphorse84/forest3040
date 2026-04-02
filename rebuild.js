const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update signature
content = content.replace(
  "const CalendarView = ({ schedules, onShowToast }: any) => {",
  "const CalendarView = ({ schedules, user, onNavigateToAdd, onShowToast }: any) => {"
);

// 2. Add floating button
const oldCalEnd = `        </div>
      </div>
    </div>
  );
};`;

const newCalEnd = `        </div>
      </div>
      {(user?.role === 'admin' || user?.role === 'leader') && (
        <button
          onClick={onNavigateToAdd}
          className="fixed bottom-24 right-5 w-[60px] h-[60px] bg-[#1a936f] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#157a5c] active:scale-90 transition-all z-40 group"
        >
          <Plus size={30} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
};`;

content = content.replace(oldCalEnd, newCalEnd);

// 3. Decode ScheduleAddView
let tempContent = fs.readFileSync('src/App.tsx.temp', 'utf8');
let decoded = tempContent.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));

// Append after CalendarView
content = content.replace(newCalEnd, newCalEnd + '\n\n' + decoded);

// 4. Update Routing
const oldRoute = `{!subPage && activeTab === 'calendar' && <CalendarView schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />}`;
const newRoute = `{!subPage && activeTab === 'calendar' && <CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onNavigateToAdd={() => setSubPage('schedule_add')} onShowToast={showToast} />}
        {subPage === 'schedule_add' && (
          <ScheduleAddView user={currentUser} onBack={() => setSubPage(null)} onShowToast={showToast} />
        )}`;

content = content.replace(oldRoute, newRoute);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Rebuilt successfully');
