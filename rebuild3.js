const fs = require('fs');

function decodeUnicode(text) {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));
}

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let tempContent = fs.readFileSync('src/App.tsx.temp', 'utf8');
let scheduleAddView = decodeUnicode(tempContent);

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Update CalendarView signature
    if (line.trim() === "const CalendarView = ({ schedules, onShowToast }: any) => {") {
        lines[i] = "const CalendarView = ({ schedules, user, onNavigateToAdd, onShowToast }: any) => {";
    }

    // Update routing
    if (line.includes("{!subPage && activeTab === 'calendar' && <CalendarView")) {
        let originalSpaces = line.length - line.trimLeft().length;
        let indent = " ".repeat(originalSpaces);
        
        let newRoute = `${indent}{!subPage && activeTab === 'calendar' && <CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onNavigateToAdd={() => setSubPage('schedule_add')} onShowToast={showToast} />}\n`;
        newRoute += `${indent}{subPage === 'schedule_add' && (\n`;
        newRoute += `${indent}  <ScheduleAddView user={currentUser} onBack={() => setSubPage(null)} onShowToast={showToast} />\n`;
        newRoute += `${indent})}`;
        lines[i] = newRoute;
    }
}

// Find the end of CalendarView. It is right before "const Toast ="
let toastIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("const Toast =")) {
        toastIdx = i;
        break;
    }
}

if (toastIdx !== -1) {
    let endIdx = toastIdx - 1;
    while (endIdx >= 0 && lines[endIdx].trim() === "") {
        endIdx--;
    }

    if (lines[endIdx].trim() === "};") {
        let startReplaceIdx = endIdx - 4;
        
        let newEnding = `        </div>
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
        
        // Remove old lines
        lines.splice(startReplaceIdx, 5, newEnding);
        
        // Re-find toastIdx
        toastIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("const Toast =")) {
                toastIdx = i;
                break;
            }
        }
        
        // Insert ScheduleAddView right before Toast
        lines.splice(toastIdx, 0, scheduleAddView + "\n\n");
    }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log("Rebuild perfect via node array manipulation!");
