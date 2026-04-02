import os

brain_dir = r"C:\Users\admin\.gemini\antigravity\brain"
for root, dirs, files in os.walk(brain_dir):
    for f in files:
        if f.endswith(".txt") or f.endswith(".json") or f.endswith(".md"):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    if "ScheduleAddView" in content or "Upcoming Schedule Section" in content:
                        print(f"FOUND IN: {path}")
            except Exception as e:
                pass
