/**
 * 极简 CDP 客户端，给 scripts/ 下的检查脚本共用。
 *
 * 只做三件事：起一个带调试端口的 headless Chrome、连上某个标签页、收发命令。
 * 需要更复杂的协议能力时，别在这里堆，直接在调用方用 send() 发原始命令。
 */
import { spawn } from 'node:child_process';
import { rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 等调试端口就绪 */
async function waitForDevTools(port, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) return;
    } catch {
      /* 还没起来 */
    }
    await sleep(500);
  }
  throw new Error(`Chrome 调试端口 ${port} 没有就绪`);
}

/**
 * 起一个 headless Chrome。
 * 返回的 close() 会一并清掉临时 profile 目录。
 */
export async function launch({ chrome, port = 9333, args = [] }) {
  if (!chrome) throw new Error('请通过 CHROME 环境变量指定 chrome 可执行文件路径');

  const profileDir = join(tmpdir(), `cdp-profile-${Date.now()}`);
  await mkdir(profileDir, { recursive: true });

  const child = spawn(
    chrome,
    [
      '--headless',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      ...args,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  await waitForDevTools(port);

  return {
    port,
    async close() {
      child.kill();
      await sleep(400);
      await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

/** 连上 CDP 的 WebSocket，返回 send / once / close */
export function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
      return;
    }
    const waiters = listeners.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const once = (method) =>
    new Promise((resolve) => {
      const waiters = listeners.get(method) ?? [];
      waiters.push(resolve);
      listeners.set(method, waiters);
    });

  return { ready, send, once, close: () => ws.close() };
}

/** 开一个新标签页并连上它 */
export async function newTab(port, { width = 1280, height = 900, mobile = false } = {}) {
  const created = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`,
    { method: 'PUT' },
  ).then((response) => response.json());

  const cdp = connect(created.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });

  return {
    id: created.id,
    cdp,
    async close() {
      cdp.close();
      await fetch(`http://127.0.0.1:${port}/json/close/${created.id}`).catch(() => {});
    },
  };
}

/** 导航并等 load 事件 */
export async function goto(cdp, url) {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url });
  await loaded;
}

/** 在页面里跑一段表达式，返回求值结果 */
export async function evaluate(cdp, expression, { awaitPromise = false } = {}) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? '页面求值失败');
  }
  return result.result.value;
}
