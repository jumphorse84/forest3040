import re
import math

file_path = 'src/App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ScheduleAddView starts around line 3816 "const ScheduleAddView = ..."
# We will just find and decode \\u escapes inside that block.
start_str = "const ScheduleAddView ="
end_str = "const Toast ="

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    block = content[start_idx:end_idx]
    
    # decode only \uXXXX
    def replacer(match):
        code = match.group(1)
        return chr(int(code, 16))
        
    decoded_block = re.sub(r'\\u([0-9a-fA-F]{4})', replacer, block)
    
    new_content = content[:start_idx] + decoded_block + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Decoded successfully.")
else:
    print("Could not find block.")
