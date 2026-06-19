# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/chapter03_06'

night_files = ['Chapter04_NightReturn.twee', 'Chapter05_NightReturn.twee', 'Chapter06_NightReturn.twee']

for fname in night_files:
    path = os.path.join(base, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add pursuit trigger before the first choice-list div
    pursuit_check = """<<if Game.canTriggerPursuit()>>
<p class="danger">存活的人已经不多了。今夜，狼人不会再遵守"一晚一间"的规则。</p>
<div class="choice-list">
[[准备迎战夜间追击|Pursuit_Start]]
</div>
<</if>>
"""
    
    # Insert before the first choice-list in the passage
    if 'Pursuit_Start' not in content:
        content = content.replace('<div class="choice-list">', pursuit_check + '<div class="choice-list">', 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added pursuit trigger to {fname}')
    else:
        print(f'{fname} already has pursuit trigger')

print('Done.')