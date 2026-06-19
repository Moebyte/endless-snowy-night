const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'scripts', 'game.js');
let text = fs.readFileSync(filePath, 'utf8');

const oldBlock = '    g.alive = {\n      lu_chen: true,\n      su_wan: true,\n      chen_mo: true,\n      zhou_ye: true,\n      lin_xiaoman: true,\n      shen_zhiheng: true,\n      lao_zhou: true,\n      han_lie: true,\n      gu_yan: true,\n      tang_xiaotang: true\n    };\n    g.roles = {\n      lu_chen: \'memory\',\n      su_wan: \'villager\',\n      chen_mo: \'knight\',\n      zhou_ye: \'wolf\',\n      lin_xiaoman: \'villager\',\n      shen_zhiheng: \'prophet\',\n      lao_zhou: \'villager\',\n      han_lie: \'guardian\',\n      gu_yan: \'villager\',\n      tang_xiaotang: \'wolf\'\n    };';

const newBlock = '    g.alive = {\n      lu_chen: true,\n      su_wan: true,\n      chen_mo: true,\n      shen_zhiheng: true,\n      han_lie: true,\n      ye_zhiqiu: true,\n      lao_zhou: true,\n      lin_xiaoman: true,\n      gu_yan: true,\n      zhou_ye: true,\n      tang_xiaotang: true,\n      zhao_mingcheng: true\n    };\n    g.roles = {\n      lu_chen: \'memory\',\n      su_wan: \'villager\',\n      chen_mo: \'knight\',\n      shen_zhiheng: \'prophet\',\n      han_lie: \'magician\',\n      ye_zhiqiu: \'witch\',\n      lao_zhou: \'villager\',\n      lin_xiaoman: \'villager\',\n      gu_yan: \'mechanical_wolf\',\n      zhou_ye: \'wolf_king\',\n      tang_xiaotang: \'hidden_wolf\',\n      zhao_mingcheng: \'wolf\'\n    };';

if (text.includes(oldBlock)) {
  text = text.replace(oldBlock, newBlock);
} else {
  console.warn('WARN: game reset block not found');
}

fs.writeFileSync(filePath, text, 'utf8');
console.log('done');
