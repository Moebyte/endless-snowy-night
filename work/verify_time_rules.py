# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

# Update God_Panel description to reflect "神职任意时间可用"
panel_path = os.path.join(base, 'God_Panel.twee')
with open(panel_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<p class="system-hint">你可以私下联络已确认的神职，请他们使用能力。注意：神职不知道彼此身份，除非你告诉他们。</p>',
    '<p class="system-hint">你可以联络已确认的神职，请他们使用能力。神职能力来源于村民，<strong>白天和夜晚均可发动</strong>。</p>\n<p class="muted">但白天当众使用能力会暴露身份。狼人能力仅夜晚可用，除非机械狼已弑神偷取神力。</p>'
)

with open(panel_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated God_Panel with time rules')