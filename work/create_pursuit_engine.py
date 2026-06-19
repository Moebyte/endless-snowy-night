# -*- coding: utf-8 -*-
import os

pursuit_dir = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

# Remove the old Turn1 approach, use a centralized engine
for f in os.listdir(pursuit_dir):
    if f.startswith('Pursuit_Turn'):
        os.remove(os.path.join(pursuit_dir, f))
        print('Removed', f)

# Rewrite Pursuit_Start to link to Pursuit_Engine
start_content = """:: Pursuit_Start
<<run Game.startPursuit()>>
<<run Game.visit()>>
<h2>夜间追击战</h2>
<p>存活的人越来越少了。走廊里只剩下你的脚步声。</p>
<p>突然，大厅方向传来沉重的脚步声——不是人的脚步，是某种东西用前掌着地行走。</p>
<p>狼人不再遵守"一晚一间"的规则了。它们开始主动猎杀。</p>
<p class="system-hint">追击战开始。你需要撑过 5 个回合直到天亮。选择行动谨慎。</p>
<<set _wolf to Game.getPursuitWolf()>>
<<set _wolfName to GameState.PROFILES[_wolf].name>>
<p class="danger">追击你的是：<strong><<print _wolfName>></strong></p>
<div class="choice-list">
[[开始逃跑|Pursuit_Engine]]
</div>
"""
with open(os.path.join(pursuit_dir, 'Pursuit_Start.twee'), 'w', encoding='utf-8') as f:
    f.write(start_content)
print('Rewrote Pursuit_Start')

# Centralized pursuit engine passage
engine_content = """:: Pursuit_Engine
<<run Game.visit()>>
<<set _turn to $game.pursuit.turn>>
<<set _wolfName to GameState.PROFILES[Game.getPursuitWolf()].name>>
<<set _posName to GameState.MAP[$game.pursuit.playerPos].name>>
<<set _wolfPosName to GameState.MAP[$game.pursuit.wolfPos].name>>
<<set _moves to Game.getPursuitMoves()>>
<<set _dist to Game.pursuitDistance($game.pursuit.wolfPos, $game.pursuit.playerPos)>>

<h2>追击战 · 第 <<print _turn>> 回合</h2>

<<if $game.pursuit.playerInjured>>
<p class="danger">你受伤了。每一步都伴随着剧痛。</p>
<</if>>

<p>你在<strong><<print _posName>></strong>。<strong><<print _wolfName>></strong>在<strong><<print _wolfPosName>></strong>，距离你 <<print _dist>> 步。</p>

<<if _dist <= 1>>
<p class="danger">它就在附近！你能闻到它身上的血腥味。</p>
<<elseif _dist <= 3>>
<p class="warning">脚步声越来越近了。</p>
<</if>>

<<if Game.canHideAt($game.pursuit.playerPos) and not $game.pursuit.hiding>>
<p class="system-hint">这里可以躲藏。</p>
<</if>>

<div class="choice-list">
<<if Game.canHideAt($game.pursuit.playerPos) and not $game.pursuit.hiding>>
[[躲藏起来|Pursuit_Resolve][$game.pursuit.hiding to true]]
<</if>>
<<if $game.pursuit.hiding>>
[[继续躲藏|Pursuit_Resolve]]
[[放弃躲藏，继续逃跑|Pursuit_Resolve][$game.pursuit.hiding to false]]
<</if>>
<<if Game.hasItem('flashlight')>>
[[用手电筒照狼人|Pursuit_Item_flashlight]]
<</if>>
<<if Game.hasItem('lighter')>>
[[用打火机点燃障碍|Pursuit_Item_lighter]]
<</if>>
<<if Game.hasItem('wire')>>
[[布下金属丝绊索|Pursuit_Item_wire]]
<</if>>
<<if Game.hasItem('pocket_knife')>>
[[用折叠小刀反击|Pursuit_Item_pocket_knife]]
<</if>>
<<if Game.hasItem('ritual_dagger')>>
[[举起祭祀骨刀|Pursuit_Item_ritual_dagger]]
<</if>>
<<if Game.hasItem('first_aid_kit') and $game.pursuit.playerInjured>>
[[用急救包治疗伤口|Pursuit_Item_first_aid_kit]]
<</if>>
</div>

<div class="choice-list">
<<for _i to 0>>_REGION_END
<<if _i < _moves.length>>
[[前往 <<print GameState.MAP[_moves[_i]].name>>|Pursuit_Move_<<print _moves[_i]>>]
<<set _i to _i + 1>>
<<set _continue to true>>
<</if>>
_REGION_END
<</for>>
</div>
"""
with open(os.path.join(pursuit_dir, 'Pursuit_Engine.twee'), 'w', encoding='utf-8') as f:
    f.write(engine_content)
print('Created Pursuit_Engine')

# Item usage passages (redirect to resolve)
items = ['flashlight', 'lighter', 'wire', 'pocket_knife', 'ritual_dagger', 'first_aid_kit']
for item in items:
    content = f""":: Pursuit_Item_{item}
<<run Game.pursuitUseItem('{item}')>>
<<goto 'Pursuit_Resolve'>>
"""
    with open(os.path.join(pursuit_dir, f'Pursuit_Item_{item}.twee'), 'w', encoding='utf-8') as f:
        f.write(content)

# Move passages for all locations
all_locs = ['grand_hall', 'dining_room', 'kitchen', 'pantry', 'drawing_room', 'study', 'gallery',
            'master_bedroom', 'children_room', 'sewing_room', 'balcony', 'foyer',
            'courtyard', 'garden', 'chapel', 'well']
for loc in all_locs:
    content = f""":: Pursuit_Move_{loc}
<<run Game.pursuitMove('{loc}')>>
<<goto 'Pursuit_Resolve'>>
"""
    with open(os.path.join(pursuit_dir, f'Pursuit_Move_{loc}.twee'), 'w', encoding='utf-8') as f:
        f.write(content)
print(f'Created {len(all_locs)} move passages')

# Resolve passage - processes wolf turn and checks win/lose
resolve_content = """:: Pursuit_Resolve
<<set _result to Game.pursuitNextTurn()>>
<<run Game.visit()>>
<<set _wolfName to GameState.PROFILES[Game.getPursuitWolf()].name>>

<<if _result is 'defeated'>>
<h1 class="ending-bad">追击战失败</h1>
<p>你的理智彻底崩溃了。黑暗中传来 <<print _wolfName>> 的低笑。</p>
<p>你倒在地上，看着天花板上的水渍变成了无数只眼睛。</p>
<p class="system-hint">理智归零。追击战失败。</p>
<div class="choice-list">
[[继续|Chapter07_Bad]]
</div>
<<elseif _result is 'dawn'>>
<h2>黎明</h2>
<p>你撑过了这一夜。窗外的天空开始泛白，风雪的声音渐渐平息。</p>
<p class="thought">陈默（内心）：天亮了……我还活着。</p>
<<run Game.endPursuit()>>
<<if $game.pursuit.playerInjured>>
<p class="system-hint">你带着伤活了下来。但你知道，下一个夜晚会更难。</p>
<<else>>
<p class="system-hint">你毫发无伤地活了下来。这是胜利，但只是暂时的。</p>
<</if>>
<div class="choice-list">
[[继续新的一天|Chapter03_06_Framework]]
</div>
<<else>>
<h2>追击战 · 结算</h2>
<<if _result is 'found'>>
<p class="danger">你的躲藏被发现了！<<print _wolfName>> 扑了上来，你勉强挣脱，但受了伤。理智 -10。</p>
<<elseif _result is 'attacked'>>
<p class="danger"><<print _wolfName>> 追上了你！利爪划过你的肩膀。理智 -15。</p>
<<elseif _result is 'caught_up'>>
<p class="danger">它追到了你的位置！你被击倒，鲜血滴在地上。理智 -15。</p>
<<elseif _result is 'missed'>>
<p>它经过了你躲藏的地方，但没有发现你。你屏住呼吸，一动不动。</p>
<<elseif _result is 'moved'>>
<p>脚步声在移动。它正在搜索其他房间。</p>
<</if>>
<div class="choice-list">
[[下一回合|Pursuit_Engine]]
</div>
<</if>>
"""
with open(os.path.join(pursuit_dir, 'Pursuit_Resolve.twee'), 'w', encoding='utf-8') as f:
    f.write(resolve_content)
print('Created Pursuit_Resolve')

print('All pursuit passages done.')