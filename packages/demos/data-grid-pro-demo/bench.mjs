// Opens the built demo in headless Chromium and measures Data Grid Pro on generated rows:
// time to first rows, frame times while scrolling the whole list, and how many rows stay in the page.
// Usage: pnpm bench [-- --rows 20000 --screenshot out.png]
import { chromium } from "playwright-core";
import { preview } from "vite";

const args = Object.fromEntries(
    process.argv
        .slice(2)
        .join(" ")
        .split("--")
        .filter(Boolean)
        .map(pair => pair.trim().split(/\s+/))
);
const rows = Number(args.rows ?? 20000);

const server = await preview({ preview: { port: 4173, strictPort: true } });
const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium"
});
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const started = Date.now();
    await page.goto(`http://localhost:4173/?rows=${rows}&latency=120`);
    await page.waitForSelector(".dgp-row:not(.dgp-row--loading)");
    const firstRowsMs = Date.now() - started;

    if (args.screenshot) {
        await page.waitForTimeout(500);
        await page.screenshot({ path: args.screenshot });
    }

    // Two scroll patterns, recording the time between frames:
    // "wheel" moves 100 px per frame like a mouse wheel or trackpad; "fling" jumps one screen per frame
    // from top to bottom, the worst case, where every frame shows only new rows.
    const measure = (stepPx, maxFrames) =>
        page.evaluate(
            async ([step, limit]) => {
                const el = document.querySelector(".dgp-scroll");
                const frames = [];
                let maxRows = 0;
                let last = performance.now();
                while (frames.length < limit && el.scrollTop + el.clientHeight < el.scrollHeight - 1) {
                    el.scrollTop += step || el.clientHeight;
                    await new Promise(requestAnimationFrame);
                    const now = performance.now();
                    frames.push(now - last);
                    last = now;
                    maxRows = Math.max(maxRows, document.querySelectorAll(".dgp-row").length);
                }
                frames.sort((a, b) => a - b);
                const round = n => Math.round(n * 10) / 10;
                return {
                    frames: frames.length,
                    avgFrameMs: round(frames.reduce((a, b) => a + b, 0) / frames.length),
                    p95FrameMs: round(frames[Math.floor(frames.length * 0.95)]),
                    maxRowsInPage: maxRows
                };
            },
            [stepPx, maxFrames]
        );
    const wheel = await measure(100, 600);
    const fling = await measure(0, 100000);

    // Let the last window load, then check the bottom rows are real data.
    await page.waitForFunction(() => document.querySelectorAll(".dgp-row--loading").length === 0, null, {
        timeout: 10000
    });
    const requests = await page.textContent("#requests");

    const result = { rows, firstRowsMs, wheel, fling, requests: Number(requests) };
    console.log(JSON.stringify(result, null, 2));
} finally {
    await browser.close();
    server.httpServer.close();
}
