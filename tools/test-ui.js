/*
 * tools/test-ui.js
 * Playwright UI test for the SugarCube build.
 * Loads dist/index.html, drives the story, and asserts the progressive map.
 *
 * Run: node tools/test-ui.js
 * Requires: Playwright chromium installed (ms-playwright).
 */
const fs = require('fs');
const path = require('path');

const PW_PATH = 'C:/Users/xhvai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright';
const pw = require(PW_PATH);

const DIST_HTML = path.resolve(__dirname, '..', 'dist', 'index.html');
const SHOT_DIR = path.resolve(__dirname, '..', 'dist', 'shots');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

const FILE_URL = 'file:///' + DIST_HTML.replace(/\\/g, '/');

let passed = 0, failed = 0;
function ok(name) { passed++; console.log('  PASS: ' + name); }
function bad(name, detail) { failed++; console.log('  FAIL: ' + name + (detail ? ' -- ' + detail : '')); }

function clickLink(page, text) {
  return page.locator('a', { hasText: text }).first().click();
}

// Read game state through the SugarCube global (State is not a bare global).
function getGameState(page) {
  return page.evaluate(() => {
    const g = window.SugarCube && window.SugarCube.State && window.SugarCube.State.variables && window.SugarCube.State.variables.game;
    return g || null;
  });
}

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  await page.goto(FILE_URL, { waitUntil: 'load' });
  await page.waitForSelector('#passages', { timeout: 10000 });

  // --- Test 1: Start passage renders ---
  const startText = await page.locator('#passages').innerText();
  if (startText.length > 50) ok('Start passage renders (' + startText.length + ' chars)');
  else bad('Start passage renders', 'text too short');

  // --- Test 2: click into chapter, then unlock map ---
  await clickLink(page, '开始游戏'); // 开始游戏
  await page.waitForSelector('#passages h2', { timeout: 8000 });
  await clickLink(page, '检查山庄结构'); // 检查山庄结构
  // wait for the CheckExit passage to render (sets flag via <<run>>)
  await page.waitForSelector('#passages a:has-text("回到大厅")', { timeout: 8000 }); // 回到大厅
  const st = await getGameState(page);
  const mapUnlocked = !!(st && st.flags && st.flags.map_unlocked);
  if (mapUnlocked) ok('map_unlocked flag set after Chapter01_CheckExit');
  else bad('map_unlocked flag set', 'flag not true, flags=' + JSON.stringify(st && st.flags));

  // open map from sidebar (StoryCaption link 地图)
  await clickLink(page, '地图'); // 地图
  await page.waitForSelector('#passages h2', { timeout: 8000 });
  const mapH2 = await page.locator('#passages h2').first().innerText();
  if (mapH2.includes('庄园地图')) ok('entered Common_Map'); // 庄园地图
  else bad('entered Common_Map', 'h2=' + mapH2);

  // --- Test 3: initially, most zones unknown ---
  const unknownCards = await page.locator('.zone-card.unknown').count();
  const knownCards = await page.locator('.zone-card.known').count();
  if (unknownCards >= 5 && knownCards === 0) ok('progressive map: ' + unknownCards + ' unknown, 0 known initially');
  else bad('progressive map initial', 'unknown=' + unknownCards + ' known=' + knownCards);

  await page.screenshot({ path: path.join(SHOT_DIR, 'map-initial.png'), fullPage: true });

  // --- Test 4: simulate visiting grand_hall, reopen map, main_1f should be known ---
  await page.evaluate(() => { window.Game.visitLocation('grand_hall'); });
  await clickLink(page, '返回'); // 返回
  await page.waitForTimeout(200);
  await clickLink(page, '地图'); // 地图
  await page.waitForSelector('#passages h2', { timeout: 8000 });

  const knownAfter = await page.locator('.zone-card.known').count();
  const main1fKnown = await page.locator('.zone-card.known h3', { hasText: '主楼一层' }).count(); // 主楼一层
  if (knownAfter >= 1 && main1fKnown >= 1) ok('after visiting grand_hall, main_1f zone revealed');
  else bad('zone reveal after visit', 'known=' + knownAfter + ' main1f=' + main1fKnown);

  await page.screenshot({ path: path.join(SHOT_DIR, 'map-after-visit.png'), fullPage: true });

  // --- Test 5: enter the known zone, verify location card shows name not ??? ---
  await clickLink(page, '进入'); // 进入
  await page.waitForSelector('#passages h2', { timeout: 8000 });
  const zoneH2 = await page.locator('#passages h2').first().innerText();
  const knownLoc = await page.locator('.location-card.known h4', { hasText: '大厅' }).count(); // 大厅
  const unknownLoc = await page.locator('.location-card.unknown').count();
  if (zoneH2.includes('主楼一层') && knownLoc >= 1) ok('zone detail shows visited location name'); // 主楼一层
  else bad('zone detail', 'h2=' + zoneH2 + ' knownLoc=' + knownLoc);
  if (unknownLoc >= 1) ok('zone detail still hides unvisited locations, count=' + unknownLoc);
  else bad('zone detail hides unvisited', 'unknownLoc=' + unknownLoc);

  await page.screenshot({ path: path.join(SHOT_DIR, 'zone-detail.png'), fullPage: true });

  // --- Test 6: return navigation (ZoneMap -> Common_Map) ---
  await clickLink(page, '返回地图'); // 返回地图
  await page.waitForSelector('#passages h2', { timeout: 8000 });
  const backToMap = await page.locator('#passages h2').first().innerText();
  if (backToMap.includes('庄园地图')) ok('return from zone to map works'); // 庄园地图
  else bad('return zone->map', 'h2=' + backToMap);

  // --- Test 7: console errors ---
  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Deprecation'));
  if (realErrors.length === 0) ok('no console errors');
  else bad('console errors', JSON.stringify(realErrors.slice(0, 3)));

  await browser.close();

  console.log('\n=== UI Test Summary ===');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  console.log('Screenshots in: ' + SHOT_DIR);
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('TEST CRASH:', e); process.exit(2); });
