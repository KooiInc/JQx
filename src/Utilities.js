import {default as tagFNFactory} from "./tinyDOM.js";
import {default as IS, maybe} from "./TypeofAnything.js";
import styleFactory from "./LifeCSS.js";

const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const systemLog = systemLogFactory();

function pad0(nr, n=2) {
  return `${nr}`.padStart(n, `0`);
}

function randomNr(max, min = 0) {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( ([...crypto.getRandomValues(new Uint32Array(1))].shift() / 2 ** 32 ) * (max - min + 1) + min );
}

function isNonEmptyString(str, minlen = 1) {
  minlen = IS(minlen, Number) && minlen || 1;
  return IS(str, String) && str.length >= minlen;
}

function resolveEventTypeParameter (maybeTypes) {
  maybeTypes = IS(maybeTypes, String) && /,/.test(maybeTypes) ? maybeTypes.split(`,`) : maybeTypes;
  return IS(maybeTypes, Array)
    ? maybeTypes.filter(t => isNonEmptyString(t)).map(t => t.trim().toLowerCase())
    : IS(maybeTypes, String) && maybeTypes?.trim().toLowerCase() || ``;
}

function shuffle(array) {
  let i = array.length;
  while (i--) {
    const ri = randomNr(i);
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
}

function hex2Full(hex) {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
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

function toDashedNotation(str2Convert) {
  return str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
}

function ucFirst([first, ...theRest]) {
  return `${first.toUpperCase()}${theRest.join(``)}`;
}

function toCamelcase(str2Convert) {
  return IS(str2Convert, String)
    ? str2Convert.toLowerCase()
      .split(`-`)
      .map( (str, i) => i && `${ucFirst(str)}` || str)
      .join(``)
    : str2Convert;
}

function randomString() {
  return `_${shuffle(characters4RandomString).slice(0, 8).join(``)}`;
}

function truncate2SingleStr(str, maxLength = 120) {
  return truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`);
}

function logTime() {
  return ((d) =>
    `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
      pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
}

function hex2RGBA(hex, opacity = 100) {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity / 100}` : ""})`;
}

function escHtml(html) {
  return html.replace(/</g, `&lt;`).replace(/>/g, `&gt;`);
}

function extensionHelpers() {
  const isCommentOrTextNode = elem => IS(elem, Comment, Text);
  const isNode = input => IS(input, Text, HTMLElement, Comment);
  const isComment = input => IS(input, Comment);
  const isText = input => IS(input, Text);
  const isHtmlString = input => IS(input, String) && /^<|>$/.test(`${input}`.trim());
  const isArrayOfHtmlStrings = input => IS(input, Array) && !input?.find(s => !isHtmlString(s));
  const isArrayOfHtmlElements = input => IS(input, Array) && !input?.find(el => !isNode(el));
  const ElemArray2HtmlString = elems => elems?.filter(el => el).reduce((acc, el) =>
    acc.concat(isComment(el) ? `<!--${el.data}-->`
      : isCommentOrTextNode(el) ?  el.textContent
        : el.outerHTML), ``);
  const input2Collection = input =>
    !input ? []
      : IS(input, Proxy) ? [input.EL]
        : IS(input, NodeList) ? [...input]
          : isNode(input) ? [input]
            : isArrayOfHtmlElements(input) ? input
              : input.isJQx ? input.collection : undefined;
  const setCollectionFromCssSelector = (input, root, self) => {
    const selectorRoot = root !== document.body && (IS(input, String) && input.toLowerCase() !== "body") ? root : document;
    let errorStr = undefined;

    try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
    catch (err) { errorStr = `Invalid CSS querySelector. [${!IS(input, String) ? `Nothing valid given!` : input}]`; }
    const collectionLen = self.collection.length;
    return collectionLen < 1
      ? `CSS querySelector "${input}", output: nothing`
      : errorStr ?? `CSS querySelector "${input}", output ${collectionLen} element${collectionLen > 1 ? `s` : ``}`;
  };
  const addHandlerId = instance => {
    const handleId = instance.data.get(`hid`) || `HID${randomString()}`;
    instance.data.add({hid: handleId});
    return `[data-hid="${handleId}"]`;
  };

  return {
    isCommentOrTextNode, isNode, isComment, isText, isHtmlString, isArrayOfHtmlElements,
    isArrayOfHtmlStrings, ElemArray2HtmlString, input2Collection, setCollectionFromCssSelector,
    addHandlerId };
}

function ExamineElementFeatureFactory() {
  const isVisible = function(el) {
    if (!el) { return undefined; }
    const elStyle = el.style;
    const computedStyle = getComputedStyle(el);
    const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
    const noDisplay = [elStyle.display, computedStyle.display].includes("none");
    const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0
      || el.offsetLeft > document.body.offsetWidth;
    const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
    return !(offscreen || noOpacity || noDisplay || invisible);
  };
  const notApplicable = `n/a`;
  const isWritable = function(elem) {
    return [...elem.parentNode.querySelectorAll(`:is(:read-write)`)]?.find(el => el === elem) ?? false;
  };

  const isModal = function(elem) {
    return [...elem.parentNode.querySelectorAll(`:is(:modal)`)]?.find(el => el === elem) ?? false;
  };

  const noElements = { notInDOM: true, writable: notApplicable, modal: notApplicable, empty: true, open: notApplicable, visible: notApplicable, };

  return self => {
    const firstElem = self.node;

    return IS(firstElem, Node) ? {
      get writable() {
        return isWritable(firstElem);
      },
      get modal() {
        return isModal(firstElem);
      },
      get inDOM() {
        return firstElem.isConnected;
      },
      get open() {
        return firstElem.open ?? false;
      },
      get visible() {
        return isVisible(firstElem);
      },
      get disabled() {
        return firstElem.hasAttribute("readonly") || firstElem.hasAttribute("disabled");
      },
      get empty() {
        return self.collection.length < 1;
      },
      get virtual() {
        return self.isVirtual;
      }
    } : noElements;
  };
}

function decodeForConsole(something) {
  return IS(something, String) &&
    Object.assign(document.createElement(`textarea`), {innerHTML: something}).textContent || something;
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
    if (!on) { return systemLogger; }
    console.log(backLog.slice(0, args.length).join(`\n`));
    return systemLogger;
  }

  Object.defineProperties(systemLogger, {
    log: {value: log, enumerable: false},
    error: {value: error, enumerable: false},
  });

  return Object.freeze(systemLogger);
}

const insertPositions = new Proxy({
  start: "afterbegin", afterbegin: "afterbegin",
  end: "beforeend", beforeend: "beforeend",
  before: "beforebegin", beforebegin: "beforebegin",
  after: "afterend", afterend: "afterend" }, {
  get(obj, key) { return obj[String(key).toLowerCase()] ?? obj[key]; }
});

export {
  IS,
  maybe,
  randomString,
  isNonEmptyString,
  insertPositions,
  toDashedNotation,
  toCamelcase,
  truncateHtmlStr,
  truncate2SingleStr,
  logTime,
  randomNr,
  hex2RGBA,
  escHtml,
  ExamineElementFeatureFactory,
  styleFactory,
  tagFNFactory,
  resolveEventTypeParameter,
  extensionHelpers,
  systemLog,
};
