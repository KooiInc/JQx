import { default as IS, maybe } from "./TypeofAnything.js";

const systemLog = systemLogFactory();
const insertPositions = Object.freeze(new Proxy({
  start: "afterbegin", afterbegin: "afterbegin",
  end: "beforeend", beforeend: "beforeend",
  before: "beforebegin", beforebegin: "beforebegin",
  after: "afterend", afterend: "afterend" }, {
  get(obj, key) { return obj[String(key).toLowerCase()] ?? obj[key]; }
}));

export {IS, maybe, isNonEmptyString, truncate2SingleStr, logTime, escHtml,
  systemLog, insertPositions, truncateHtmlStr, isNode, pad0 };

function isNonEmptyString(str, minlen = 1) {
  minlen = IS(minlen, Number) && minlen || 1;
  return IS(str, String) && str.length >= minlen;
}

function truncate2SingleStr(str, maxLength = 120) {
  return truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`);
}

function truncateHtmlStr(str, maxLength = 120) {
  return `${str}`
    .trim()
    .slice(0, maxLength)
    .replace(/>\s+</g, `><`)
    .replace(/</g, `&lt;`)
    .replace(/\s{2,}/g, ` `)
    .replace(/\n/g, `\\n`) + (str.length > maxLength ? ` &hellip;` : ``).trim();
}

function escHtml(html) {
  switch(true) {
    case IS(html, String):
      const tmpDiv = document.createElement("div");
      tmpDiv.append(html);
      return tmpDiv.innerHTML;
    default: return html;
  }
}

/* private */
function decodeForConsole(something) {
  return IS(something, String) &&
    Object.assign(
      document.createElement(`textarea`),
      {innerHTML: something}).textContent || something;
}

function systemLogFactory() {
  let on = false;
  const backLog = [];
  const systemLogger = {
    get on() { on = true; return systemLogger; },
    get off() { on = false; return systemLogger; },
    get backLog() { return backLog; },
  };
  
  function error(...args) {
    backLog.unshift(...args.map(arg => `${logTime()} ⨻ ${decodeForConsole(arg)}`));
    console.error(backLog.slice(0, args.length).join(`\n`));
    return systemLogger;
  }
  
  function log(...args) {
    backLog.unshift(...args.map(arg => `${logTime()} ✔ ${decodeForConsole(arg)}`));
    switch(on) {
      case true: console.log(backLog.slice(0, args.length).join(`\n`));
      default: return systemLogger;
    }
  }
  
  Object.defineProperties(systemLogger, {
    log: {value: log, enumerable: false},
    error: {value: error, enumerable: false},
  });
  
  return Object.freeze(systemLogger);
}

function logTime() {
  return ((d) =>
    `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
      pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
}

function isNode(input) {
  return IS(input, Text, HTMLElement, Comment)
}

/* private */
function pad0(nr, n=2) {
  return `${nr}`.padStart(n, `0`);
}
