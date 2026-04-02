#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Patch VISIT_CATEGORIES Korean strings in App.tsx"""

import re

path = r"src\App.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace only the VISIT_CATEGORIES block with correct Korean
old = """const VISIT_CATEGORIES = [
  { id: 'spiritual', label: '?곸쟻 ?뚮큵', icon: '?앾툘', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'family', label: '媛??愿怨?, icon: '?룧', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'job', label: '吏곸옣/吏꾨줈', icon: '?뮳', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'finance', label: '?ъ젙', icon: '?뮥', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'health', label: '嫄닿컯', icon: '?룯', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'other', label: '湲고?', icon: '?뱷', color: 'bg-surface-container text-on-surface-variant border-surface-container-high' },
];"""

new = """const VISIT_CATEGORIES = [
  { id: 'spiritual', label: '영적 돌봄', icon: '✝️', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'family', label: '가정/관계', icon: '🏠', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'job', label: '직장/진로', icon: '💼', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'finance', label: '재정', icon: '💰', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'health', label: '건강', icon: '🏥', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'other', label: '기타', icon: '📝', color: 'bg-surface-container text-on-surface-variant border-surface-container-high' },
];"""

if old in content:
    content = content.replace(old, new, 1)
    print("VISIT_CATEGORIES fixed!")
else:
    print("WARNING: Could not find VISIT_CATEGORIES block - trying regex...")
    # Fallback: replace between markers
    pattern = r'(const VISIT_CATEGORIES = \[)[\s\S]*?(\];)'
    replacement = new
    content_new = re.sub(pattern, replacement, content, count=1)
    if content_new != content:
        content = content_new
        print("Fixed via regex.")
    else:
        print("FAILED to fix VISIT_CATEGORIES.")

# Also fix any corrupted Korean in the rest of the patch areas
# (other strings in the new modal were written correctly because they came from replace_file_content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
