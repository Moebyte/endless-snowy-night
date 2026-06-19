import os

ROOT = 'C:\\Users\\xhvai\\Documents\\Codex\\2026-06-19\\files-mentioned-by-the-user-md'
hall_path = os.path.join(ROOT, 'src', 'passages', 'chapter03_06', 'Chapter06_Hall.twee')

with open(hall_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
inserted = False
for line in lines:
    if not inserted and 'Chapter06_Observe]]' in line:
        new_lines.append("<<if Game.hasItem('old_key') and Game.hasClue('ritual_tablet') and Game.isAlive('shen_shen')>>\n")
        new_lines.append("[[\u628a\u6c88\u614e\u5f15\u5230\u796d\u575b\u7a7a\u95f4\uff0c\u5c1d\u8bd5\u5f11\u795e\u593a\u4f4d|Chapter06_KillGod]]\n")
        new_lines.append("<</if>>\n")
        inserted = True
    new_lines.append(line)

with open(hall_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Inserted kill-god choice into Chapter06_Hall' if inserted else 'FAILED to insert kill-god choice')
