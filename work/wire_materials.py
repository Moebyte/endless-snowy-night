# -*- coding: utf-8 -*-
import os

base = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/chapter03_06'

# Map exploration passages that should give witch materials
material_sources = {
    'Explore_DiningRoom.twee': ('medicine_bottle', '药瓶', '你注意到餐柜角落有一个标签被撕掉的药瓶，含有化学药剂。叶知秋也许能用上。'),
    'Explore_MasterBedroom.twee': ('syringe', '注射器', '梳妆台的抽屉里有一支干净的注射器。叶知秋制作毒药时可能需要。'),
    'Explore_Conservatory.twee': ('herb_bundle', '草药束', '温室的角落里挂着几束干燥的草药。叶知秋也许能用来制作药剂。'),
    'Explore_Workshop.twee': ('chemical_vial', '化学试剂瓶', '工坊的架子上有一瓶化学试剂。叶知秋制作高级毒药可能需要。'),
}

for fname, (mat_id, mat_name, desc) in material_sources.items():
    fpath = os.path.join(base, fname)
    if not os.path.exists(fpath):
        print(f'SKIP {fname} (not found)')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'witchAddMaterial' not in content:
        # Add material pickup after the system-hint
        material_code = f"\n<<if not Game.witchHasMaterial('{mat_id}')>>\n<<run Game.witchAddMaterial('{mat_id}')>>\n<p class=\"system-hint\">你发现了女巫材料：{mat_name}。{desc}</p>\n<</if>>\n"
        # Insert before the first choice-list div
        content = content.replace('<div class="choice-list">', material_code + '<div class="choice-list">', 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added {mat_id} to {fname}')
    else:
        print(f'{fname} already has material')

print('Done wiring materials.')