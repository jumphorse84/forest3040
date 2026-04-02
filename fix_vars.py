import os, glob

with open('src/App.tsx.backup', 'r', encoding='utf-8') as f:
    content = f.read()

def find_block(start_str, end_str):
    start = content.find(start_str)
    if start == -1: return ""
    end = content.find(end_str, start) + len(end_str)
    return content[start:end]

op_code = find_block('enum OperationType {', '}')
hf_code = find_block('function handleFirestoreError(', '\n}')
sg_code = find_block('const SmallGroupCard =', '};')

to_append = f"\nexport {op_code}\nexport {hf_code}\nexport {sg_code}\n"

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()
if 'enum OperationType {' not in app_content:
    with open('src/App.tsx', 'a', encoding='utf-8') as f:
        f.write(to_append)

print("Exported variables to App.tsx")

imports = "import { OperationType, handleFirestoreError, SmallGroupCard } from '../App';\n"
for view in glob.glob('src/views/*.tsx'):
    with open(view, 'r', encoding='utf-8') as f:
        t = f.read()
    if 'import { OperationType' not in t:
        lines = t.split('\n')
        # Insert after last import
        for i, l in enumerate(lines):
            if l.startswith('const '):
                lines.insert(i, imports)
                break
        with open(view, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print("Updated imports in", view)
