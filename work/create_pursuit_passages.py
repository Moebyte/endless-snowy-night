# -*- coding: utf-8 -*-
import os

pursuit_dir = 'C:/Users/xhvai/Documents/Codex/2026-06-19/files-mentioned-by-the-user-md/src/passages/common'

passages = {
    'Pursuit_Start.twee': """:: Pursuit_Start
<<run Game.startPursuit()>>
<<run Game.visit()>>
<h2>\u591c\u95f4\u8ffd\u51fb\u6218</h2>
<p>\u5b58\u6d3b\u7684\u4eba\u8d8a\u6765\u8d8a\u5c11\u4e86\u3002\u8d70\u5eca\u91cc\u53ea\u5269\u4e0b\u4f60\u7684\u811a\u6b65\u58f0\u3002</p>
<p>\u7a81\u7136\uff0c\u5927\u5385\u65b9\u5411\u4f20\u6765\u6c89\u91cd\u7684\u811a\u6b65\u58f0\u2014\u2014\u4e0d\u662f\u4eba\u7684\u811a\u6b65\uff0c\u662f\u67d0\u79cd\u4e1c\u897f\u5728\u7528\u524d\u638c\u7740\u5730\u884c\u8d70\u3002</p>
<p>\u72fc\u4eba\u4e0d\u518d\u9075\u5b88\u201c\u4e00\u665a\u4e00\u95f4\u201d\u7684\u89c4\u5219\u4e86\u3002\u5b83\u4eec\u5f00\u59cb\u4e3b\u52a8\u730e\u6740\u3002</p>
<p class="system-hint">\u8ffd\u51fb\u6218\u5f00\u59cb\u3002\u4f60\u9700\u8981\u649e\u8fc7 5 \u4e2a\u56de\u5408\u7b49\u5230\u5929\u4eae\u3002\u9009\u62e9\u884c\u52a8\u8c28\u614e\u3002</p>
<<set _wolf to Game.getPursuitWolf()>>
<<set _wolfName to GameState.PROFILES[_wolf].name>>
<p class="danger">\u8ffd\u51fb\u4f60\u7684\u662f\uff1a<strong><<print _wolfName>></strong></p>
<div class="choice-list">
[[\u7b2c\u4e00\u56de\u5408|Pursuit_Turn1]]
</div>
""",
    'Pursuit_Turn1.twee': """:: Pursuit_Turn1
<<run Game.visit()>>
<h2>\u8ffd\u51fb\u6218 \u00b7 \u7b2c 1 \u56de\u5408</h2>
<<set _wolfName to GameState.PROFILES[Game.getPursuitWolf()].name>>
<p>\u4f60\u7ad9\u5728\u5ba2\u623f\u8d70\u5eca\u3002\u8d70\u5eca\u5c3d\u5934\u7684\u843d\u5730\u955c\u53cd\u5c04\u7740\u4f60\u60ca\u6050\u7684\u8138\u3002</p>
<p><strong><<print _wolfName>></strong> \u7684\u8eab\u5f71\u5728\u5927\u5385\u91cc\u95ea\u73b0\uff0c\u6b63\u6cbf\u7740\u8d70\u5eca\u9760\u8fd1\u3002</p>
<p class="system-hint">\u5f53\u524d\u4f4d\u7f6e\uff1a\u5ba2\u623f\u8d70\u5eca\u3002\u53ef\u524d\u5f80\u5927\u5385\u3001\u4e3b\u5367\u3001\u7f1d\u7ea2\u5ba4\u3001\u9633\u53f0\u3002</p>
<div class="choice-list">
<<if Game.canHideAt('guest_corridor')>>
[[\u8eb2\u85cf\u5728\u8d70\u5eca\u9634\u5f71\u91cc|Pursuit_Turn2][$game.pursuit.hiding to true]]
<</if>>
[[\u524d\u5f80\u4e3b\u5367|Pursuit_Turn2_M1]]
[[\u524d\u5f80\u7f1d\u7ea2\u5ba4|Pursuit_Turn2_M2]]
[[\u8dd1\u5411\u9633\u53f0|Pursuit_Turn2_M3]]
</div>
""",
}

for name, content in passages.items():
    path = os.path.join(pursuit_dir, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Created', name)

print('Pursuit passages created.')