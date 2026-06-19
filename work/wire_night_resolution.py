# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages'

# For Chapter04/05/06 NightReturn: add a "等待天亮" option that uses AI resolution
# before going to the next day's start
night_files = [
    (os.path.join(base, 'chapter03_06', 'Chapter04_NightReturn.twee'), 'Chapter05_Start'),
    (os.path.join(base, 'chapter03_06', 'Chapter05_NightReturn.twee'), 'Chapter06_Start'),
    (os.path.join(base, 'chapter03_06', 'Chapter06_NightReturn.twee'), 'Chapter03_06_Framework'),
]

for fpath, next_chapter in night_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'Common_NightResolution' not in content:
        # Add a night resolution link before the existing choices
        resolution_link = """<div class="choice-list">
[[等待天亮（让狼人行动）|Common_NightResolution]]
</div>
"""
        # Insert before the last </div> or before existing choice-list
        content = resolution_link + content
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added Common_NightResolution to {os.path.basename(fpath)}')
    else:
        print(f'{os.path.basename(fpath)} already has it')

# Also fix Common_DayTransition to route properly
# It currently uses dynamic goto which check-links ignores (that's fine)
# But Chapter04_Hall etc may not exist - check
hall_files = ['Chapter03_Hall', 'Chapter04_Hall', 'Chapter05_Hall', 'Chapter06_Hall']
for h in hall_files:
    path = os.path.join(base, 'chapter03_06', h + '.twee')
    if os.path.exists(path):
        print(f'{h} exists')
    else:
        print(f'{h} MISSING')

print('Done.')