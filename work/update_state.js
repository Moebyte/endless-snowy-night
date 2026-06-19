const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'scripts', 'state.js');
let text = fs.readFileSync(filePath, 'utf8');

const oldRoles = '  // 身份常量\n  GameState.ROLES = {\n    MEMORY: \'memory\',   // 无限记忆者（主角专属）\n    KNIGHT: \'knight\',   // 骑士\n    PROPHET: \'prophet\', // 先知\n    GUARDIAN: \'guardian\', // 守卫\n    VILLAGER: \'villager\', // 村民\n    WOLF: \'wolf\'        // 狼\n  };';

const newRoles = '  // 身份常量\n  GameState.ROLES = {\n    MEMORY: \'memory\',           // 无限记忆者（主角专属，归类为特殊村民）\n    PROPHET: \'prophet\',         // 预言家\n    WITCH: \'witch\',             // 女巫\n    KNIGHT: \'knight\',           // 骑士\n    MAGICIAN: \'magician\',       // 魔术师\n    VILLAGER: \'villager\',       // 普通村民\n    WOLF_KING: \'wolf_king\',     // 狼王\n    HIDDEN_WOLF: \'hidden_wolf\', // 隐狼\n    WOLF: \'wolf\',               // 狼\n    MECHANICAL_WOLF: \'mechanical_wolf\' // 机械狼\n  };';

if (text.includes(oldRoles)) {
  text = text.replace(oldRoles, newRoles);
} else {
  console.warn('WARN: roles block not found');
}

const oldChars = '  // 角色常量\n  GameState.CHARACTERS = {\n    LU_CHEN: \'lu_chen\',\n    SU_WAN: \'su_wan\',\n    CHEN_MO: \'chen_mo\',\n    ZHOU_YE: \'zhou_ye\',\n    LIN_XIAOMAN: \'lin_xiaoman\',\n    SHEN_ZHIHENG: \'shen_zhiheng\',\n    LAO_ZHOU: \'lao_zhou\',\n    HAN_LIE: \'han_lie\',\n    GU_YAN: \'gu_yan\',\n    TANG_XIAOTANG: \'tang_xiaotang\'\n  };';

const newChars = '  // 角色常量\n  GameState.CHARACTERS = {\n    LU_CHEN: \'lu_chen\',         // 男主角 / 无限记忆者\n    SU_WAN: \'su_wan\',           // 村民\n    CHEN_MO: \'chen_mo\',         // 骑士\n    SHEN_ZHIHENG: \'shen_zhiheng\', // 预言家\n    HAN_LIE: \'han_lie\',         // 魔术师\n    YE_ZHIQIU: \'ye_zhiqiu\',     // 女巫\n    LAO_ZHOU: \'lao_zhou\',       // 村民\n    LIN_XIAOMAN: \'lin_xiaoman\', // 村民\n    GU_YAN: \'gu_yan\',           // 机械狼\n    ZHOU_YE: \'zhou_ye\',         // 狼王\n    TANG_XIAOTANG: \'tang_xiaotang\', // 隐狼\n    ZHAO_MINGCHENG: \'zhao_mingcheng\' // 狼\n  };';

if (text.includes(oldChars)) {
  text = text.replace(oldChars, newChars);
} else {
  console.warn('WARN: characters block not found');
}

const oldAlive = '      alive: {\n        lu_chen: true,\n        su_wan: true,\n        chen_mo: true,\n        zhou_ye: true,\n        lin_xiaoman: true,\n        shen_zhiheng: true,\n        lao_zhou: true,\n        han_lie: true,\n        gu_yan: true,\n        tang_xiaotang: true\n      },\n\n      // 当前身份（用于多周目变化追踪）\n      roles: {\n        lu_chen: \'memory\',\n        su_wan: \'villager\',\n        chen_mo: \'knight\',\n        zhou_ye: \'wolf\',\n        lin_xiaoman: \'villager\',\n        shen_zhiheng: \'prophet\',\n        lao_zhou: \'villager\',\n        han_lie: \'guardian\',\n        gu_yan: \'villager\',\n        tang_xiaotang: \'wolf\'\n      },';

const newAlive = '      alive: {\n        lu_chen: true,\n        su_wan: true,\n        chen_mo: true,\n        shen_zhiheng: true,\n        han_lie: true,\n        ye_zhiqiu: true,\n        lao_zhou: true,\n        lin_xiaoman: true,\n        gu_yan: true,\n        zhou_ye: true,\n        tang_xiaotang: true,\n        zhao_mingcheng: true\n      },\n\n      // 当前身份（用于多周目变化追踪）\n      roles: {\n        lu_chen: \'memory\',\n        su_wan: \'villager\',\n        chen_mo: \'knight\',\n        shen_zhiheng: \'prophet\',\n        han_lie: \'magician\',\n        ye_zhiqiu: \'witch\',\n        lao_zhou: \'villager\',\n        lin_xiaoman: \'villager\',\n        gu_yan: \'mechanical_wolf\',\n        zhou_ye: \'wolf_king\',\n        tang_xiaotang: \'hidden_wolf\',\n        zhao_mingcheng: \'wolf\'\n      },';

if (text.includes(oldAlive)) {
  text = text.replace(oldAlive, newAlive);
} else {
  console.warn('WARN: alive/roles block not found');
}

fs.writeFileSync(filePath, text, 'utf8');
console.log('done');
