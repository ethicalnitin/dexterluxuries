/**
 * lotus365.service.js — Puppeteer automation for Lotus365
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const SITE_URL = process.env.LOTUS365_URL || "https://lotus365.blue/dashboard";
const USERNAME = process.env.LOTUS365_USERNAME;
const PASSWORD = process.env.LOTUS365_PASSWORD;

let browserInstance = null;
let pageInstance = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log("[Lotus365] Launching browser...");
    browserInstance = await puppeteer.launch({
      headless: false,
      devtools: false,
      slowMo: 30,
      defaultViewport: null,
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

async function getPage() {
  const browser = await getBrowser();
  if (!pageInstance || pageInstance.isClosed()) {
    pageInstance = await browser.newPage();
    await pageInstance.setViewport({ width: 1280, height: 800 });
    await pageInstance.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    );
  }
  return pageInstance;
}

async function typeIntoFocused(page, text) {
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  for (const ch of String(text)) {
    await page.keyboard.type(ch, { delay: 40 });
  }
}

// ── Safe type into a frame input — uses JS focus + keyboard, never clicks ────
async function typeInFrameSafe(frame, page, selector, text) {
  // 1. Scroll into view and focus via JS (avoids "not clickable" errors)
  await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
    // Clear existing value
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, selector);
  await sleep(300);

  // 2. Type via keyboard (page keyboard works cross-frame when element is focused)
  await typeIntoFocused(page, text);
  await sleep(200);

  // 3. Verify value was set; if not, use native setter fallback
  const value = await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.value : "";
  }, selector);

  if (!value || value.trim() === "") {
    console.log(`[Lotus365] Keyboard type failed for ${selector} — using JS setter fallback`);
    await frame.evaluate(
      (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("keyup", { bubbles: true }));
      },
      selector,
      String(text)
    );
    await sleep(200);
  }

  const finalValue = await frame.evaluate(
    (sel) => (document.querySelector(sel) || {}).value || "",
    selector
  );
  console.log(`[Lotus365] Field ${selector} value: "${finalValue}"`);
}

// ── Legacy typeInFrame kept for amount input (works fine there) ───────────────
async function typeInFrame(frame, page, selector, text) {
  const elHandle = await frame.$(selector);
  if (!elHandle) throw new Error(`Selector not found in frame: ${selector}`);
  await elHandle.click({ clickCount: 3 });
  await sleep(150);
  await typeIntoFocused(page, text);
}

async function waitForAnySelector(ctx, selectors, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      try {
        const visible = await ctx.evaluate((s) => {
          const el = document.querySelector(s);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }, sel);
        if (visible) return sel;
      } catch (_) {}
    }
    await sleep(300);
  }
  return null;
}

async function saveDebugScreenshot(page, name) {
  const p = path.join(__dirname, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true }).catch(() => {});
  console.log(`[Lotus365] Screenshot saved: ${p}`);
}

async function saveDebugHTML(ctx, name) {
  try {
    const html = await ctx.content();
    const p = path.join(__dirname, `${name}.html`);
    fs.writeFileSync(p, html, "utf8");
    console.log(`[Lotus365] HTML saved: ${p}`);
  } catch (e) {
    console.log("[Lotus365] Could not save HTML:", e.message);
  }
}

// ─── Fetch image as base64 ────────────────────────────────────────────────────

function fetchImageAsBase64Node(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (url.startsWith("data:")) return resolve(url);

    const client = url.startsWith("https") ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://mahesh247.win/",
          Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchImageAsBase64Node(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) {
          console.log(`[Lotus365] Image fetch HTTP ${res.statusCode} for ${url}`);
          return resolve(null);
        }
        const contentType = res.headers["content-type"] || "image/jpeg";
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve(`data:${contentType};base64,${buf.toString("base64")}`);
        });
        res.on("error", () => resolve(null));
      }
    );

    req.on("error", (err) => {
      console.log(`[Lotus365] Image fetch error: ${err.message}`);
      resolve(null);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

// ─── Iframe Helper ────────────────────────────────────────────────────────────

async function getDepositFrame(page, timeout = 30000) {
  console.log("[Lotus365] Waiting for mahesh247 deposit iframe...");
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const url = frame.url();
        if (url && url.includes("mahesh247")) {
          console.log("[Lotus365] Found iframe via frames():", url);
          try {
            await frame.waitForFunction(
              () => document.readyState === "complete",
              { timeout: 8000 }
            );
          } catch (_) {}
          await sleep(1500);
          return frame;
        }
      } catch (_) {}
    }

    try {
      const iframeHandle = await page.evaluateHandle(() => {
        const all = Array.from(document.querySelectorAll("iframe"));
        return all.find((f) => f.src && f.src.includes("mahesh247")) || null;
      });
      if (iframeHandle && iframeHandle.asElement()) {
        const frame = await iframeHandle.contentFrame();
        if (frame) {
          console.log("[Lotus365] Found iframe via DOM query:", frame.url());
          try {
            await frame.waitForFunction(
              () => document.readyState === "complete",
              { timeout: 8000 }
            );
          } catch (_) {}
          await sleep(1500);
          return frame;
        }
      }
    } catch (_) {}

    await sleep(500);
  }

  console.log("[Lotus365] mahesh247 iframe not found within timeout.");
  return null;
}

// ─── Find amount input ────────────────────────────────────────────────────────

async function findAmountInput(ctx) {
  const candidates = [
    'input[placeholder="Enter amount"]',
    'input[placeholder*="amount" i]',
    'input[placeholder*="Amount" i]',
    'input[name="amount"]',
    'input#amount',
    'input[formcontrolname="amount"]',
    'input[formcontrolname="Amount"]',
    'input[type="number"]',
  ];

  for (const sel of candidates) {
    try {
      await ctx.waitForSelector(sel, { visible: true, timeout: 5000 });
      console.log(`[Lotus365] Amount input found (R1): ${sel}`);
      return sel;
    } catch (_) {}
  }

  const found2 = await waitForAnySelector(ctx, candidates, 15000);
  if (found2) {
    console.log(`[Lotus365] Amount input found (R2): ${found2}`);
    return found2;
  }

  const found3 = await ctx.evaluate(() => {
    const inputs = Array.from(
      document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])')
    );
    const el = inputs.find((inp) => {
      const rect = inp.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const ph = (inp.placeholder || "").toLowerCase();
      const nm = (inp.name || "").toLowerCase();
      return !ph.includes("search") && !nm.includes("search");
    });
    if (!el) return null;
    if (el.id) return `#${el.id}`;
    if (el.name) return `input[name="${el.name}"]`;
    if (el.placeholder) return `input[placeholder="${el.placeholder}"]`;
    return null;
  });

  if (found3) {
    console.log(`[Lotus365] Amount input found (R3): ${found3}`);
    return found3;
  }

  const page = await getPage();
  await saveDebugScreenshot(page, "deposit-debug");
  await saveDebugHTML(ctx, "deposit-iframe-debug");
  throw new Error("Deposit amount input not found");
}

// ─── Step 1: Login ────────────────────────────────────────────────────────────

async function login() {
  const page = await getPage();
  console.log("[Lotus365] Navigating to site...");

  await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(3000);

  await page.evaluate(() => {
    document.querySelectorAll("span, button, a").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const t = el.textContent.trim();
      if (t === "×" || t === "✕" || t === "✖") el.click();
    });
  });
  await sleep(1500);

  const needsLogin = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a, span, button, div")).some((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        el.textContent.trim().toLowerCase() === "log in"
      );
    });
  });

  if (!needsLogin) {
    console.log("[Lotus365] Already logged in.");
    return true;
  }

  console.log("[Lotus365] Clicking Log in...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("a, span, button, div")).find((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        el.textContent.trim().toLowerCase() === "log in"
      );
    });
    if (btn) btn.click();
  });

  await sleep(2000);

  const userSel = await waitForAnySelector(
    page,
    ['input[name="loginName"]', 'input.input-username', 'input[placeholder="Username"]'],
    10000
  );
  if (!userSel) {
    await saveDebugScreenshot(page, "login-debug");
    throw new Error("Username input not found");
  }

  const passSel = await waitForAnySelector(
    page,
    ['input[name="password"]', 'input.input-password', 'input[type="password"]'],
    5000
  );
  if (!passSel) throw new Error("Password input not found");

  console.log("[Lotus365] Entering credentials...");
  await page.click(userSel, { clickCount: 3 });
  await typeIntoFocused(page, USERNAME);
  await sleep(200);
  await page.click(passSel, { clickCount: 3 });
  await typeIntoFocused(page, PASSWORD);
  await sleep(400);

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => {
      const t = b.textContent.trim().toUpperCase();
      return t === "LOGIN" && !t.includes("DEMO") && !t.includes("WITH");
    });
    if (btn) btn.click();
  });

  await page.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll("a, span, button, div")).some((el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          el.textContent.trim().toLowerCase() === "log in"
        );
      }),
    { timeout: 25000 }
  );

  await sleep(3000);
  await page.evaluate(() => {
    document
      .querySelectorAll(".close, button.close, [aria-label='Close']")
      .forEach((b) => b.click());
  });
  await sleep(1000);

  console.log("[Lotus365] Login successful!");
  return true;
}

// ─── Step 2: Navigate to Deposit ─────────────────────────────────────────────

async function goToDeposit() {
  const page = await getPage();
  console.log("[Lotus365] Navigating to deposit page...");

  await page.goto("https://lotus365.blue/deposit", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  console.log("[Lotus365] Waiting for Angular...");
  try {
    await page.waitForFunction(
      () => document.body.classList.contains("loggged_page"),
      { timeout: 12000 }
    );
  } catch (_) {
    console.log("[Lotus365] loggged_page not found — continuing.");
  }

  await sleep(4000);
  console.log("[Lotus365] Current URL:", page.url());

  const frame = await getDepositFrame(page, 30000);

  if (frame) {
    const amountSel = await findAmountInput(frame);
    return { frame, amountSel };
  }

  console.log("[Lotus365] No mahesh247 iframe — trying main page...");
  const amountSel = await findAmountInput(page);
  return { frame: page, amountSel };
}

// ─── Step 3: Enter Amount ─────────────────────────────────────────────────────

async function enterAmount(amount) {
  const page = await getPage();
  const { frame, amountSel } = await goToDeposit();

  console.log(`[Lotus365] Entering amount: ${amount}`);

  await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, amountSel);
  await sleep(500);

  await typeInFrame(frame, page, amountSel, amount);
  await sleep(400);

  const enteredValue = await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.value : "";
  }, amountSel);
  console.log(`[Lotus365] Amount field value after typing: "${enteredValue}"`);

  if (!enteredValue || enteredValue.trim() === "") {
    await frame.evaluate(
      (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      amountSel,
      String(amount)
    );
    await sleep(300);
  }

  const submitted = await frame.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent.trim().toUpperCase() === "SUBMIT"
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!submitted) {
    console.log("[Lotus365] SUBMIT not found — pressing Enter...");
    const elHandle = await frame.$(amountSel);
    if (elHandle) await elHandle.click();
    await page.keyboard.press("Enter");
  }

  await sleep(3000);
  console.log("[Lotus365] Amount submitted.");
  return frame;
}

// ─── Step 4: Scrape ALL payment tabs ─────────────────────────────────────────

async function scrapeAllPaymentMethods(frame) {
  if (!frame) frame = await getPage();

  console.log("[Lotus365] Discovering payment tabs...");

  const tabs = await frame.evaluate(() => {
    return Array.from(
      document.querySelectorAll("#nav-tab button.nav-link, #nav-tab a.nav-link")
    )
      .map((btn) => {
        const raw = btn.textContent.trim().replace(/\s+/g, " ");
        const normalized = raw.toLowerCase().replace(/\s+/g, "");
        let method = null;
        if (normalized.includes("gpay") || normalized.includes("googlepay"))
          method = "gpay";
        else if (normalized.includes("phonepe")) method = "phonepe";
        else if (normalized.includes("paytm")) method = "paytm";
        else if (normalized.includes("upi")) method = "upi";
        if (!method) return null;
        return {
          method,
          label: raw.split(/\s+/)[0].trim(),
          tabId: btn.id || null,
          dataTarget:
            btn.getAttribute("data-target") || btn.getAttribute("href") || null,
        };
      })
      .filter(Boolean);
  });

  console.log(
    `[Lotus365] Found ${tabs.length} payment tab(s):`,
    tabs.map((t) => t.method)
  );

  if (tabs.length === 0) {
    const fallback = await scrapeVisiblePanel(frame);
    if (!fallback) return [];
    const qrBase64 = await fetchImageAsBase64Node(fallback.qrSrc);
    return [{ method: "gpay", label: "GPay", qrBase64, ...fallback }];
  }

  const results = [];

  for (const tab of tabs) {
    console.log(`[Lotus365] Clicking tab: ${tab.method}`);
    await frame.evaluate((tabId) => {
      const btn = document.getElementById(tabId);
      if (btn) btn.click();
    }, tab.tabId);
    await sleep(1800);

    const details = await scrapeVisiblePanel(frame, tab.dataTarget);
    if (!details) {
      console.log(`[Lotus365] No panel details for tab: ${tab.method}`);
      continue;
    }

    const qrBase64 = await fetchImageAsBase64Node(details.qrSrc);
    console.log(
      `[Lotus365] Scraped ${tab.method}: upiId=${details.upiId}, qr=${
        qrBase64
          ? "✓ (" + Math.round(qrBase64.length / 1024) + "KB)"
          : "✗"
      }`
    );

    results.push({
      method: tab.method,
      label: tab.label,
      qrBase64: qrBase64 || null,
      name: details.name,
      upiId: details.upiId,
      minAmount: details.minAmount,
      maxAmount: details.maxAmount,
    });
  }

  return results;
}

// ─── Scrape visible payment panel ────────────────────────────────────────────

async function scrapeVisiblePanel(frame, panelSelector = null) {
  return await frame.evaluate((panelSel) => {
    let panel = null;
    if (panelSel) panel = document.querySelector(panelSel);
    if (!panel) {
      panel =
        document.querySelector(".tab-pane.active .account-data") ||
        document.querySelector(".tab-pane.show .account-data") ||
        document.querySelector(".account-data");
    }
    if (!panel) return null;

    const text = panel.innerText || "";
    const nameMatch = text.match(/Name\s*[:\-]\s*([^\n]+)/i);
    const upiMatch =
      text.match(/Number\s*[:\-]\s*([^\n@]+@[^\n\s]+)/i) ||
      text.match(/UPI\s*ID?\s*[:\-]\s*([^\n\s]+@[^\n\s]+)/i);
    const minMatch = text.match(/Min(?:imum)?\s*Amount?\s*[:\-]\s*(\d+)/i);
    const maxMatch = text.match(/Max(?:imum)?\s*Amount?\s*[:\-]\s*(\d+)/i);

    const qrImg =
      panel.querySelector("img.qr-code") ||
      panel.querySelector('img[src*="s3.amazonaws"]') ||
      panel.querySelector('img[src*="qr" i]') ||
      panel.querySelector("img");

    return {
      name: nameMatch ? nameMatch[1].trim() : null,
      upiId: upiMatch ? upiMatch[1].trim() : null,
      minAmount: minMatch ? parseInt(minMatch[1]) : 300,
      maxAmount: maxMatch ? parseInt(maxMatch[1]) : 100000,
      qrSrc: qrImg ? qrImg.src : null,
    };
  }, panelSelector);
}

// ─── Public: refreshQR ───────────────────────────────────────────────────────

async function refreshQR(amount = 500) {
  console.log("[Lotus365] Refreshing all QR codes...");
  await login();
  const frame = await enterAmount(amount);
  const methods = await scrapeAllPaymentMethods(frame);
  console.log(`[Lotus365] Returning ${methods.length} payment method(s).`);
  return {
    methods,
    timestamp: Date.now(),
    nextRefreshAt: Date.now() + 10 * 60 * 1000,
  };
}

// ─── Public: submitDeposit ────────────────────────────────────────────────────

async function submitDeposit({ utr, screenshotPath, amount, method = "gpay" }) {
  console.log(
    `[Lotus365] Submitting deposit — UTR: ${utr}, Amount: ${amount}, Method: ${method}`
  );

  const page = await getPage();
  await login();

  // Navigate to deposit page and get frame
  const { frame, amountSel } = await goToDeposit();

  // ── Enter amount ──────────────────────────────────────────────────────────
  console.log(`[Lotus365] Entering amount: ${amount}`);
  await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, amountSel);
  await sleep(500);

  await typeInFrame(frame, page, amountSel, amount);
  await sleep(400);

  const enteredValue = await frame.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.value : "";
  }, amountSel);

  if (!enteredValue || enteredValue.trim() === "") {
    await frame.evaluate(
      (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      amountSel,
      String(amount)
    );
    await sleep(300);
  }

  // ── Submit amount form ────────────────────────────────────────────────────
  const amountSubmitted = await frame.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent.trim().toUpperCase() === "SUBMIT"
    );
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!amountSubmitted) {
    const elHandle = await frame.$(amountSel);
    if (elHandle) await elHandle.click();
    await page.keyboard.press("Enter");
  }

  await sleep(3000);
  console.log("[Lotus365] Amount submitted — waiting for deposit form...");

  // ── Click correct payment tab ─────────────────────────────────────────────
  console.log(`[Lotus365] Selecting payment tab: ${method}`);
  await frame.evaluate((targetMethod) => {
    const tabs = Array.from(
      document.querySelectorAll("#nav-tab button.nav-link, #nav-tab a.nav-link")
    );
    const tab = tabs.find((btn) => {
      const t = btn.textContent.trim().toLowerCase().replace(/\s+/g, "");
      return t.includes(targetMethod);
    });
    if (tab) tab.click();
  }, method);

  await sleep(2000);

  // ── Find and fill UTR input ───────────────────────────────────────────────
  console.log("[Lotus365] Looking for UTR input...");

  // Find the UTR selector (just to confirm it exists)
  const utrSelectors = [
    "#transactionId",
    'input[id*="transactionId" i]',
    'input[name*="transaction" i]',
    'input[name*="utr" i]',
    'input[placeholder*="UTR" i]',
    'input[placeholder*="Unique" i]',
    'input[placeholder*="transaction" i]',
    'input[placeholder*="6 to 12" i]',
  ];

  let utrSel = await waitForAnySelector(frame, utrSelectors, 10000);

  if (!utrSel) {
    // Fallback: find first visible, enabled text input in the right panel
    utrSel = await frame.evaluate(() => {
      const activePanel =
        document.querySelector(".tab-pane.active") ||
        document.querySelector(".tab-pane.show") ||
        document;
      const inputs = Array.from(
        activePanel.querySelectorAll('input[type="text"], input[type="number"], input:not([type])')
      );
      const el = inputs.find((inp) => {
        const rect = inp.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !inp.disabled &&
          !inp.readOnly &&
          inp.type !== "file" &&
          inp.type !== "checkbox"
        );
      });
      if (!el) return null;
      if (el.id) return `#${el.id}`;
      if (el.name) return `input[name="${el.name}"]`;
      if (el.placeholder) return `input[placeholder="${el.placeholder}"]`;
      return null;
    });
  }

  if (!utrSel) throw new Error("UTR input not found");
  console.log(`[Lotus365] Found UTR input: ${utrSel}`);

  // Use safe type (JS focus + keyboard) — avoids "not clickable" errors
  await typeInFrameSafe(frame, page, utrSel, utr);
  await sleep(500);

  // ── Upload screenshot ─────────────────────────────────────────────────────
  console.log("[Lotus365] Looking for file input inside iframe...");

  // Unhide all file inputs (they're hidden behind styled Choose File buttons)
  await frame.evaluate(() => {
    document.querySelectorAll('input[type="file"]').forEach((el) => {
      el.style.cssText =
        "display:block!important;opacity:1!important;visibility:visible!important;" +
        "position:static!important;width:1px!important;height:1px!important;";
    });
  });
  await sleep(300);

  let fileInputHandle = await frame.$('input[type="file"]');

  if (!fileInputHandle) {
    console.log("[Lotus365] File input not in iframe — trying main page...");
    await page.evaluate(() => {
      document.querySelectorAll('input[type="file"]').forEach((el) => {
        el.style.cssText =
          "display:block!important;opacity:1!important;visibility:visible!important;position:static!important;";
      });
    });
    await sleep(300);
    fileInputHandle = await page.$('input[type="file"]');
  }

  if (!fileInputHandle) {
    await saveDebugScreenshot(page, "file-input-debug");
    await saveDebugHTML(frame, "file-input-iframe-debug");
    throw new Error("File input not found — see file-input-iframe-debug.html");
  }

  console.log("[Lotus365] Uploading screenshot...");
  await fileInputHandle.uploadFile(screenshotPath);
  await sleep(2000);
  console.log("[Lotus365] Screenshot uploaded.");

  // ── Check terms & conditions checkbox ────────────────────────────────────
  console.log("[Lotus365] Checking terms checkbox...");

  const checkboxResult = await frame.evaluate(() => {
    // Find by name — most reliable since ID suffix is dynamic
    const cb =
      document.querySelector('input[name="terms_condition"]') ||
      document.querySelector('input[type="checkbox"]');

    if (!cb) return { found: false, checked: false };
    if (cb.checked) return { found: true, checked: true, note: "already checked" };

    // Must click the LABEL — the actual input is hidden (Bootstrap custom-control)
    const label = cb.id
      ? document.querySelector(`label[for="${cb.id}"]`)
      : null;

    if (label) {
      label.click();
    } else {
      cb.checked = true;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
      cb.dispatchEvent(new Event("click", { bubbles: true }));
    }

    return { found: true, checked: cb.checked };
  });

  console.log("[Lotus365] Checkbox result:", checkboxResult);
  await sleep(800);

  // Retry if still not checked
  const isChecked = await frame.evaluate(() => {
    const cb =
      document.querySelector('input[name="terms_condition"]') ||
      document.querySelector('input[type="checkbox"]');
    return cb ? cb.checked : false;
  });

  if (!isChecked) {
    console.log("[Lotus365] Checkbox not checked — retrying with native setter...");
    await frame.evaluate(() => {
      const cb =
        document.querySelector('input[name="terms_condition"]') ||
        document.querySelector('input[type="checkbox"]');
      if (!cb) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "checked"
      ).set;
      nativeSetter.call(cb, true);
      cb.dispatchEvent(new Event("change", { bubbles: true }));
      cb.dispatchEvent(new Event("input", { bubbles: true }));
      cb.dispatchEvent(new Event("click", { bubbles: true }));
    });
    await sleep(800);
  }

  const finalChecked = await frame.evaluate(() => {
    const cb =
      document.querySelector('input[name="terms_condition"]') ||
      document.querySelector('input[type="checkbox"]');
    return cb ? cb.checked : false;
  });
  console.log(`[Lotus365] Checkbox final state: ${finalChecked}`);

  // ── Debug screenshot before submit ────────────────────────────────────────
  await saveDebugScreenshot(page, "pre-submit-debug");

  // ── Click SUBMIT button ───────────────────────────────────────────────────
  console.log("[Lotus365] Clicking final SUBMIT button...");

  const finalSubmitted = await frame.evaluate(() => {
    const btn =
      document.querySelector("button#depositBtn") ||
      document.querySelector("button.depositBtn") ||
      Array.from(document.querySelectorAll("button[type='submit']")).find((b) => {
        const t = b.textContent.trim().toUpperCase();
        return t === "SUBMIT" || t === "CONFIRM";
      });

    if (!btn) return { clicked: false, reason: "button not found" };

    // Force-enable in case checkbox event didn't propagate
    btn.removeAttribute("disabled");
    btn.disabled = false;

    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    btn.click();
    return { clicked: true };
  });

  console.log("[Lotus365] Submit result:", finalSubmitted);

  if (!finalSubmitted?.clicked) {
    console.log("[Lotus365] Trying Enter key fallback...");
    await page.keyboard.press("Enter");
  }

  await sleep(4000);

  // ── Check result ──────────────────────────────────────────────────────────
  const result = await frame.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    const success =
      t.includes("success") || t.includes("approved") || t.includes("pending");
    return {
      success,
      message: success
        ? "Deposit submitted successfully"
        : "Submission status unknown — please verify on the site",
    };
  });

  console.log("[Lotus365] Deposit result:", result);
  return result;
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    pageInstance = null;
  }
}

module.exports = { login, refreshQR, submitDeposit, closeBrowser };