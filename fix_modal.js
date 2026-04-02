const fs = require('fs');

let code = fs.readFileSync('src/views/CalendarView.tsx', 'utf8');

const modalCode = `
      {/* Schedule Add Action */}
      {(user?.role === 'admin' || user?.role === 'leader' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com') && (
        <button 
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-50"
        >
          <Plus size={28} />
        </button>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-surface z-[100] flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-surface-container-highest bg-surface/80 backdrop-blur-md">
            <button onClick={() => setIsAdding(false)} className="p-2 text-on-surface-variant">
              <X size={24} />
            </button>
            <h2 className="text-lg font-bold font-headline">일정 추가</h2>
            <button onClick={handleAddSchedule} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm">
              저장
            </button>
          </header>
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="p-4 bg-primary/10 rounded-xl text-center border border-primary/20">
              <span className="font-bold text-primary">{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일</span>
              <p className="text-xs text-primary-dim mt-1">해당 날짜에 새 일정을 추가합니다.</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">일정 분류</label>
              <select
                value={newSchedule.type} onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              >
                <option value="worship">예배 / 모임</option>
                <option value="education">훈련 / 교육</option>
                <option value="volunteer">봉사 / 행사</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">일정 제목</label>
              <input 
                type="text" placeholder="(필수) 예: 금요영성집회" 
                value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">시간</label>
              <input 
                type="text" placeholder="(필수) 예: 20:00 - 22:00" 
                value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">장소</label>
              <input 
                type="text" placeholder="(필수) 예: 본당 2층" 
                value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('Schedule Add Action')) {
  code = code.replace(/    <\/div>\r?\n  \);\r?\n\};\r?\n\r?\nconst Toast = /, modalCode + '\n    </div>\n  );\n};\n\nconst Toast = ');
  fs.writeFileSync('src/views/CalendarView.tsx', code, 'utf8');
  console.log('Injected modal logic');
} else {
  console.log('Already injected');
}

