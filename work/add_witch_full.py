# -*- coding: utf-8 -*-
import os

# ============ 1. Update state.js: add witch materials + potions ============
sp = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/scripts/state.js'
f = open(sp, 'r', encoding='utf-8')
sc = f.read()
f.close()

# Add to witch godSkills
old_witch = """        witch: {
          uses: 0,              // 已使用次数（复活+投毒合计）
          maxUses: 3,           // 上限
          broken: false,        // 是否精神崩溃
          hasReviveTarget: null,// 当前可复活的目标
          curses: []            // 已施加的诅咒列表 [{target, type}]
        },"""

new_witch = """        witch: {
          uses: 0,              // 已使用次数（复活+诅咒合计）
          maxUses: 3,           // 上限
          broken: false,        // 是否精神崩溃
          curses: [],           // 已施加的诅咒列表 [{target, type}]
          // 毒药系统（不消耗额度，需要材料）
          materials: {},        // 拥有的材料 {material_id: count}
          potions: {},          // 拥有的毒药 {potion_id: count}
          // 生命感知
          sensedDeath: null     // 今夜感知到的死亡目标（charId）
        },"""

if old_witch in sc and 'materials' not in sc.split('witch:')[1].split('knight:')[0]:
    sc = sc.replace(old_witch, new_witch)
    f = open(sp, 'w', encoding='utf-8')
    f.write(sc)
    f.close()
    print('Updated witch state with materials + potions')
else:
    print('Witch state already updated or marker not found')

# ============ 2. Add WITCH_MATERIALS + WITCH_POTIONS constants ============
# Insert after BREAKING_CLUES definition
materials_const = """

  // 女巫毒药材料目录
  GameState.WITCH_MATERIALS = {
    medicine_bottle: { name: '药瓶', desc: '标签被撕掉的药瓶，含化学药剂。', sources: ['dining_room'] },
    syringe: { name: '注射器', desc: '干净的注射器，可用于注射药液。', sources: ['master_bedroom'] },
    herb_bundle: { name: '草药束', desc: '温室里找到的干燥草药。', sources: ['conservatory'] },
    chemical_vial: { name: '化学试剂瓶', desc: '工坊里的化学试剂。', sources: ['workshop'] }
  };

  // 毒药配方目录（不杀人，只控制）
  GameState.WITCH_POTIONS = {
    sleeping_potion: {
      name: '安眠药',
      desc: '让目标当晚深度睡眠，不会醒来，不会目击夜间事件。',
      recipe: { medicine_bottle: 1 },
      effect: 'sleep'
    },
    paralytic: {
      name: '麻痹剂',
      desc: '让目标当晚身体无法动弹，无法行动。',
      recipe: { syringe: 1, medicine_bottle: 1 },
      effect: 'paralyze'
    },
    deep_sedative: {
      name: '强效镇静剂',
      desc: '同时麻痹和安眠，目标当晚完全失去行动能力。',
      recipe: { syringe: 1, herb_bundle: 1, chemical_vial: 1 },
      effect: 'deep_sedation'
    },
    truth_serum: {
      name: '吐真剂',
      desc: '让目标在白天对话中不自觉地泄露真实想法。一次性。',
      recipe: { herb_bundle: 1, chemical_vial: 1 },
      effect: 'truth'
    }
  };
"""

# Insert before MAP definition
map_marker = "\n  GameState.MAP = {"
if 'WITCH_MATERIALS' not in sc:
    sc = sc.replace(map_marker, materials_const + map_marker)
    f = open(sp, 'w', encoding='utf-8')
    f.write(sc)
    f.close()
    print('Added WITCH_MATERIALS + WITCH_POTIONS constants')
else:
    print('WITCH_MATERIALS already exists')