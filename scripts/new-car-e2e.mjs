import { writeFile } from "node:fs/promises";

const port = 9228;
const baseUrl = "https://3000-i9osnkygn9e01duc0mwg9-b155e482.us3.manus.computer/";
const loginId = process.env.COMPANY_LOGIN_ID;
const password = process.env.COMPANY_LOGIN_PASSWORD;

if (!loginId || !password) {
  throw new Error("COMPANY_LOGIN_ID and COMPANY_LOGIN_PASSWORD are required for the verification session");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const listResponse = await fetch(`http://127.0.0.1:${port}/json/list`);
const pages = await listResponse.json();
const page = pages.find((entry) => entry.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("No Chrome page is available");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const resolver = pending.get(message.id);
  if (!resolver) return;
  pending.delete(message.id);
  if (message.error) resolver.reject(new Error(message.error.message));
  else resolver.resolve(message.result);
});

function command(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result?.value;
}

async function waitFor(expression, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await evaluate(expression);
    if (value) return value;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function clickAt(x, y, button = "left") {
  await command("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button, buttons: 0 });
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button, buttons: 1, clickCount: 1, pointerType: "mouse" });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button, buttons: 0, clickCount: 1, pointerType: "mouse" });
}

async function drag(from, to) {
  await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x, y: from.y, buttons: 0 });
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: from.x, y: from.y, button: "left", buttons: 1, clickCount: 1, pointerType: "mouse" });
  await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: to.x, y: to.y, button: "left", buttons: 1, clickCount: 1, pointerType: "mouse" });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: to.x, y: to.y, button: "left", buttons: 0, clickCount: 1, pointerType: "mouse" });
}

async function setInput(selector, value) {
  await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
}

const results = {
  url: baseUrl,
  image: {},
  canvas: {},
  print: {},
  passed: false,
};

try {
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1200, deviceScaleFactor: 1, mobile: false });
  await command("Page.navigate", { url: baseUrl });
  await sleep(800);
  await waitFor(`document.querySelectorAll('input').length >= 2`);

  await setInput('input[autocomplete="username"]', loginId);
  await setInput('input[autocomplete="current-password"]', password);
  await evaluate(`document.querySelector('button[type="submit"]')?.click()`);
  await waitFor(`Boolean(document.querySelector('.report-form') && document.querySelector('.damage-canvas'))`, 15000);
  await evaluate(`document.querySelector('.damage-canvas')?.scrollIntoView({ block: 'center', inline: 'center' })`);
  await sleep(400);

  results.image = await evaluate(`(() => {
    const image = document.querySelector('.damage-canvas-image');
    return { src: image?.getAttribute('src'), complete: Boolean(image?.complete), naturalWidth: image?.naturalWidth ?? 0, naturalHeight: image?.naturalHeight ?? 0 };
  })()`);

  const canvasRect = await evaluate(`(() => {
    const rect = document.querySelector('.damage-canvas')?.getBoundingClientRect();
    return rect && { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  })()`);
  if (!canvasRect) throw new Error("Canvas bounds unavailable");

  const firstPoint = { x: canvasRect.left + canvasRect.width * 0.5, y: canvasRect.top + canvasRect.height * 0.2 };
  results.canvas.hitTarget = await evaluate(`(() => { const node = document.elementFromPoint(${firstPoint.x}, ${firstPoint.y}); return node?.className || node?.tagName || null; })()`);
  await clickAt(firstPoint.x, firstPoint.y);
  await sleep(180);
  const marksAfterAdd = await waitFor(`document.querySelector('.damage-form-info strong')?.textContent?.includes('1') ? document.querySelector('.damage-form-info strong')?.textContent : false`);
  await clickAt(firstPoint.x, firstPoint.y);
  await sleep(180);
  const marksAfterRemove = await evaluate(`document.querySelector('.damage-form-info strong')?.textContent`);

  await evaluate(`document.querySelector('button[aria-label="拡大"]')?.click()`);
  await sleep(180);
  const zoomText = await evaluate(`document.querySelector('.damage-zoom-controls span:not(.damage-control-divider)')?.textContent`);
  const zoomedRect = await evaluate(`(() => {
    const rect = document.querySelector('.damage-canvas')?.getBoundingClientRect();
    return rect && { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  })()`);
  if (!zoomedRect) throw new Error("Zoomed canvas bounds unavailable");

  const dragFrom = { x: zoomedRect.left + zoomedRect.width * 0.5, y: zoomedRect.top + zoomedRect.height * 0.5 };
  const dragTo = { x: dragFrom.x + Math.min(70, zoomedRect.width * 0.12), y: dragFrom.y + Math.min(30, zoomedRect.height * 0.08) };
  await drag(dragFrom, dragTo);
  await sleep(180);
  const panState = await evaluate(`document.querySelector('.damage-canvas-stage')?.getAttribute('style')`);

  const afterPanRect = await evaluate(`(() => {
    const rect = document.querySelector('.damage-canvas')?.getBoundingClientRect();
    return rect && { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  })()`);
  const secondPoint = { x: afterPanRect.left + afterPanRect.width * 0.3, y: afterPanRect.top + afterPanRect.height * 0.55 };
  await clickAt(secondPoint.x, secondPoint.y);
  await sleep(180);
  const marksAfterPanAdd = await evaluate(`document.querySelector('.damage-form-info strong')?.textContent`);

  await evaluate(`document.querySelector('button[aria-label="傷マーク操作を元に戻す"]')?.click()`);
  await sleep(180);
  const marksAfterUndo = await evaluate(`document.querySelector('.damage-form-info strong')?.textContent`);
  await evaluate(`document.querySelector('button[aria-label="傷マーク操作をやり直す"]')?.click()`);
  await sleep(180);
  const marksAfterRedo = await evaluate(`document.querySelector('.damage-form-info strong')?.textContent`);

  results.canvas = {
    canvasAttributeSize: await evaluate(`(() => { const c = document.querySelector('.damage-canvas'); return { width: c?.width, height: c?.height }; })()`),
    marksAfterAdd,
    marksAfterRemove,
    zoomText,
    panState,
    marksAfterPanAdd,
    marksAfterUndo,
    marksAfterRedo,
  };

  await command("Emulation.setEmulatedMedia", { media: "print" });
  results.print = await evaluate(`(() => {
    const visiblePages = Array.from(document.querySelectorAll('.paper-page')).filter((page) => {
      let node = page;
      while (node) {
        if (getComputedStyle(node).display === 'none') return false;
        node = node.parentElement;
      }
      return true;
    });
    const printRoot = document.querySelector('.print-only');
    const personValue = printRoot?.querySelector('.record-person-line .record-cell-value');
    const recordLine = printRoot?.querySelector('.record-line');
    const categoryCell = printRoot?.querySelector('.inspection-table thead th');
    const inspectionTable = printRoot?.querySelector('.inspection-table');
    const damageBox = printRoot?.querySelector('.damage-report-box');
    const damageViewport = printRoot?.querySelector('.damage-canvas-viewport');
    return {
      paperPages: visiblePages.length,
      controls: getComputedStyle(document.querySelector('.damage-zoom-controls')).display,
      hint: getComputedStyle(document.querySelector('.damage-zoom-hint')).display,
      stageTransform: getComputedStyle(printRoot.querySelector('.damage-canvas-stage')).transform,
      personLabels: Array.from(printRoot.querySelectorAll('.record-person-line small')).slice(0, 2).map((node) => node.textContent),
      personValueAlign: personValue ? getComputedStyle(personValue).textAlign : null,
      recordValueAlign: recordLine ? getComputedStyle(recordLine).textAlign : null,
      categoryWidthRatio: categoryCell && inspectionTable ? categoryCell.getBoundingClientRect().width / inspectionTable.getBoundingClientRect().width : null,
      damageCanvasWidthRatio: damageViewport && damageBox ? damageViewport.getBoundingClientRect().width / damageBox.getBoundingClientRect().width : null,
      damageCanvasHeightRatio: damageViewport && damageBox ? damageViewport.getBoundingClientRect().height / damageBox.getBoundingClientRect().height : null,
    };
  })()`);
  const pdf = await command("Page.printToPDF", { landscape: true, printBackground: true, paperWidth: 11.6929, paperHeight: 8.2677, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
  await writeFile("/home/ubuntu/driver-daily-report/new-car-pdf-verification.pdf", Buffer.from(pdf.data, "base64"));
  await command("Emulation.setEmulatedMedia", { media: "" });

  const checks = [
    results.image.src === "/manus-storage/car_fdd56015.webp",
    results.image.naturalWidth === 1447 && results.image.naturalHeight === 2048,
    results.canvas.canvasAttributeSize?.width === 400 && results.canvas.canvasAttributeSize?.height === 566,
    results.canvas.marksAfterAdd?.includes("1") && results.canvas.marksAfterRemove?.includes("0"),
    Number.parseInt(results.canvas.zoomText ?? "0", 10) > 100 && Number.parseInt(results.canvas.zoomText ?? "0", 10) <= 300,
    results.canvas.marksAfterPanAdd?.includes("1"),
    results.canvas.marksAfterUndo?.includes("0") && results.canvas.marksAfterRedo?.includes("1"),
    results.print.paperPages === 2 && results.print.controls === "none" && results.print.hint === "none" && results.print.stageTransform !== "none",
    results.print.personLabels?.includes("（運転者）") && results.print.personLabels?.includes("（同乗者）"),
    results.print.personValueAlign === "center" && results.print.recordValueAlign === "center",
    typeof results.print.categoryWidthRatio === "number" && results.print.categoryWidthRatio < 0.22,
    typeof results.print.damageCanvasWidthRatio === "number" && results.print.damageCanvasWidthRatio > 0.6 && typeof results.print.damageCanvasHeightRatio === "number" && results.print.damageCanvasHeightRatio > 0.8,
  ];
  results.checks = checks;
  results.passed = checks.every(Boolean);
} finally {
  socket.close();
}

await writeFile("/home/ubuntu/new-car-e2e-results.json", JSON.stringify(results, null, 2));
if (!results.passed) {
  throw new Error(`New car E2E verification failed. Results saved to /home/ubuntu/new-car-e2e-results.json`);
}
console.log(JSON.stringify(results, null, 2));
