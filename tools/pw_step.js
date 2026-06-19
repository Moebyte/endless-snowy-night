const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });

  const fileUrl = "file:///" + path.join(__dirname, "..", "dist", "index.html").replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  console.log("loaded");

  async function gotoPassage(name) {
    try {
      await page.evaluate((n) => { window.SugarCube.Engine.play(n); }, name);
    } catch (e) { console.log("  goto " + name + " ERROR: " + e.message.substring(0,80)); return false; }
    await page.waitForTimeout(500);
    return true;
  }

  console.log("step1: Chapter01_Start");
  await gotoPassage("Chapter01_Start");
  console.log("step2: Chapter01_Evening");
  await gotoPassage("Chapter01_Evening");
  console.log("step3: Chapter01_NightReturn");
  await gotoPassage("Chapter01_NightReturn");
  console.log("step4: Chapter01_LaoZhouDeath");
  await gotoPassage("Chapter01_LaoZhouDeath");
  console.log("step5: Chapter02_Start");
  await gotoPassage("Chapter02_Start");
  console.log("step6: Chapter02_NightReturn");
  await gotoPassage("Chapter02_NightReturn");
  console.log("step7: Common_NightResolution");
  const ok = await gotoPassage("Common_NightResolution");
  console.log("night resolution ok=" + ok);

  if (ok) {
    const txt = await page.locator("#passages").innerText().catch(() => "(no #passages)");
    console.log("\n=== NIGHT RESOLUTION TEXT ===");
    console.log(txt.substring(0, 2000));
    await page.screenshot({ path: path.join(__dirname, "pw_night1.png") }).catch(()=>{});
    const nl = await page.locator("details.night-log").count();
    console.log("night-log panels: " + nl);
    if (nl > 0) console.log("open: " + await page.locator("details.night-log[open]").count());
  }

  console.log("\nERRORS: " + errors.length);
  errors.slice(0,5).forEach(e => console.log(" " + e));
  await browser.close();
  console.log("DONE");
})().catch(e => { console.error("FATAL:", e.message.substring(0,200)); process.exit(1); });
