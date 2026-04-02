import re

def decode_unicode(text):
    return re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), text)

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('src/App.tsx.temp', 'r', encoding='utf-8') as f:
    temp_content = f.read()

schedule_add_view = decode_unicode(temp_content)

for i, line in enumerate(lines):
    # Update CalendarView signature
    if line.strip() == "const CalendarView = ({ schedules, onShowToast }: any) => {":
        lines[i] = "const CalendarView = ({ schedules, user, onNavigateToAdd, onShowToast }: any) => {\n"
    
    # Update routing
    if "{!subPage && activeTab === 'calendar' && <CalendarView" in line:
        original_spaces = len(line) - len(line.lstrip())
        indent = " " * original_spaces
        new_route = f"{indent}{{!subPage && activeTab === 'calendar' && <CalendarView user={{currentUser}} schedules={{schedules.length > 0 ? schedules : mockDb.schedules}} onNavigateToAdd={{() => setSubPage('schedule_add')}} onShowToast={{showToast}} />}}\n"
        new_route += f"{indent}{{subPage === 'schedule_add' && (\n"
        new_route += f"{indent}  <ScheduleAddView user={{currentUser}} onBack={{() => setSubPage(null)}} onShowToast={{showToast}} />\n"
        new_route += f"{indent})}}\n"
        lines[i] = new_route

# Find the end of CalendarView. It is right before "const Toast ="
toast_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith("const Toast ="):
        toast_idx = i
        break

if toast_idx != -1:
    # Walk back to find the closing brackets of CalendarView
    # It should be:
    #         </div>
    #       </div>
    #     </div>
    #   );
    # };
    # We will replace these 5 lines with our new ending.
    end_idx = toast_idx - 1
    while end_idx >= 0 and lines[end_idx].strip() == "":
        end_idx -= 1
        
    # end_idx is now the `};` line
    if lines[end_idx].strip() == "};":
        start_replace_idx = end_idx - 4
        
        new_ending = """        </div>
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
};
"""
        # Replace the 5 lines with new ending
        lines[start_replace_idx:end_idx+1] = [new_ending]
        
        # We need to find the new toast_idx since array size changed
        for i, line in enumerate(lines):
            if line.strip().startswith("const Toast ="):
                toast_idx = i
                break
                
        # Insert ScheduleAddView right before Toast
        lines.insert(toast_idx, schedule_add_view + "\n\n")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Rebuild perfect via python array manipulation!")
