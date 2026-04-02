import sys

try:
    with open('src/views/CalendarView.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Normalize line endings to avoid \r\n vs \n issues
    code = code.replace('\r\n', '\n')

    # 1. Update lucide-react and firebase imports
    if 'Trash2' not in code:
        code = code.replace("from 'lucide-react';", ", Trash2 } from 'lucide-react';")
    if 'updateDoc' not in code:
        code = code.replace("from 'firebase/firestore';", ", doc, updateDoc, deleteDoc } from 'firebase/firestore';")

    # 2. Add Detail and Edit States
    state_anchor = "const [newSchedule, setNewSchedule] = useState({ title: '', time: '', location: '', type: 'worship', d_day: 'D-?' });"
    state_addition = """
  const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState<any>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editScheduleData, setEditScheduleData] = useState<any>(null);
"""
    if 'selectedScheduleForDetail' not in code:
        code = code.replace(state_anchor, state_anchor + '\n' + state_addition)

    # 3. Add Update & Delete Handlers
    handler_anchor = "const handleAddSchedule = async () => {"
    handler_addition = """
  const handleUpdateSchedule = async () => {
    if (!editScheduleData.title || !editScheduleData.time || !editScheduleData.location) {
      onShowToast('모든 필드를 입력해주세요.');
      return;
    }
    try {
      const scheduleRef = doc(firestoreDb, 'schedules', selectedScheduleForDetail.id);
      
      // Keep same date for simplicity unless date editing is required, but we didn't add date editing in add mode either.
      // Update fields
      await updateDoc(scheduleRef, {
        title: editScheduleData.title,
        time: editScheduleData.time,
        location: editScheduleData.location,
        type: editScheduleData.type
      });
      
      onShowToast('일정이 수정되었습니다.');
      setIsEditingDetail(false);
      setSelectedScheduleForDetail(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'schedules');
    }
  };

  const handleDeleteSchedule = async () => {
    if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(firestoreDb, 'schedules', selectedScheduleForDetail.id));
        onShowToast('일정이 삭제되었습니다.');
        setSelectedScheduleForDetail(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'schedules');
      }
    }
  };
"""
    if 'handleUpdateSchedule' not in code:
        code = code.replace(handler_anchor, handler_addition + '\n  ' + handler_anchor)

    # 4. Modify onClick handler for items
    old_onclick = "onClick={() => onShowToast('일정 상세 페이지로 이동합니다.')}"
    new_onclick = "onClick={() => setSelectedScheduleForDetail(schedule)}"
    code = code.replace(old_onclick, new_onclick)

    # 5. Add Detail/Edit Modal to the bottom
    modal_code = """
      {/* Schedule Detail / Edit Modal */}
      {selectedScheduleForDetail && (
        <div className="fixed inset-0 bg-surface z-[100] flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-surface-container-highest bg-surface/80 backdrop-blur-md">
            <div className="flex items-center">
              <button 
                onClick={() => {
                  if (isEditingDetail) {
                    setIsEditingDetail(false);
                  } else {
                    setSelectedScheduleForDetail(null);
                  }
                }} 
                className="p-2 text-on-surface-variant"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold font-headline ml-2">
                {isEditingDetail ? '일정 수정' : '일정 상세'}
              </h2>
            </div>
            {isEditingDetail && (
              <button onClick={handleUpdateSchedule} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm">
                저장
              </button>
            )}
          </header>
          
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {!isEditingDetail ? (
              <>
                <div className="p-6 bg-surface-container-lowest border border-surface-container-low rounded-2xl shadow-sm text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedScheduleForDetail.type === 'worship' ? 'bg-primary-container text-on-primary-container' :
                    selectedScheduleForDetail.type === 'education' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {selectedScheduleForDetail.type === 'worship' && <BookOpen size={32} />}
                    {selectedScheduleForDetail.type === 'education' && <GraduationCap size={32} />}
                    {selectedScheduleForDetail.type === 'volunteer' && <HeartHandshake size={32} />}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface">{selectedScheduleForDetail.title}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{selectedScheduleForDetail.fullDate} | {selectedScheduleForDetail.time}</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-on-surface-variant text-sm bg-surface-container-low py-2 px-4 rounded-xl inline-flex w-full mt-4">
                    <MapPin size={16} /> <span>{selectedScheduleForDetail.location}</span>
                  </div>
                </div>

                {/* Admin controls */}
                {(user?.role === 'admin' || user?.role === 'leader' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com') && (
                  <div className="flex gap-3 pt-6">
                    <button 
                      onClick={() => {
                        setEditScheduleData({ ...selectedScheduleForDetail });
                        setIsEditingDetail(true);
                      }}
                      className="flex-1 p-4 bg-surface-container-low text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                    >
                      <FileEdit size={18} /> 수정하기
                    </button>
                    <button 
                      onClick={handleDeleteSchedule}
                      className="flex-1 p-4 bg-error-container/30 text-error font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error-container/50 transition-colors"
                    >
                      <Trash2 size={18} /> 삭제하기
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Edit Mode Inputs */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">일정 분류</label>
                  <select
                    value={editScheduleData.type} onChange={(e) => setEditScheduleData({...editScheduleData, type: e.target.value})}
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
                    value={editScheduleData.title} onChange={(e) => setEditScheduleData({...editScheduleData, title: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">시간</label>
                  <input 
                    type="text" placeholder="(필수) 예: 20:00 - 22:00" 
                    value={editScheduleData.time} onChange={(e) => setEditScheduleData({...editScheduleData, time: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">장소</label>
                  <input 
                    type="text" placeholder="(필수) 예: 본당 2층" 
                    value={editScheduleData.location} onChange={(e) => setEditScheduleData({...editScheduleData, location: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
"""
    if "selectedScheduleForDetail && (" not in code:
        code = code.replace("    </div>\n  );\n};\n\nconst Toast =", modal_code + '\n    </div>\n  );\n};\n\nconst Toast =')

    with open('src/views/CalendarView.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
        
    print("Detail view injected successfully!")

except Exception as e:
    print("Error:", e)
