import {default as IS, maybe} from "./TypeofAnything.js";
import {ATTRS} from "./EmbedResources.js";
import {default as tagFNFactory} from "./tinyDOM.js";
import styleFactory from "./LifeCSS.js";
import {createElementFromHtmlString, inject2DOMTree, cleanupHtml} from "./DOM.js";
import PopupFactory from "./Popup.js";
import { HandlerFactory } from "./HandlerFactory.js";
import tagLib from "./HTMLTags.js";

const systemLog = systemLogFactory();
const allwaysCaptureEventTypes = [
  `load`, `unload`, `scroll`, `focus`, `blur`, `DOMNodeRemovedFromDocument`,
  `DOMNodeInsertedIntoDocument`, `loadstart`, `progress`, `error`, `abort`,
  `load`, `loadend`, `pointerenter`, `pointerleave`, `readystatechange`];
const insertPositions = Object.freeze(new Proxy({
  start: "afterbegin", afterbegin: "afterbegin",
  end: "beforeend", beforeend: "beforeend",
  before: "beforebegin", beforebegin: "beforebegin",
  after: "afterend", afterend: "afterend" }, {
  get(obj, key) { return obj[String(key).toLowerCase()] ?? obj[key]; }
}));
const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const datasetKeyProxy = Object.freeze({
  get(obj, key) { return obj[toCamelcase(key)] || obj[key]; },
  enumerable: false,
  configurable: false
});
const handlerIdCache = {};

export {
  after, applyStyle, assignAttrValues, ATTRS, before, checkProp, cleanupHtml, clearAllTimers, cloneAndDestroy,
  convert2Bool, createElementFromHtmlString, datasetKeyProxy, ElemArray2HtmlString, emptyElement, escHtml,
  findParentScrollDistance, getCaptureValue, getHandlerName, HandlerFactory, handlerIdCache, inject2DOMTree,
  input2Collection, insertPositions, IS, isArrayOfHtmlElements, isArrayOfHtmlStrings, isComment, isCommentOrTextNode,
  isHtmlString, isModal, isNode, isNonEmptyString, isText, isVisible, isWritable, logTime, maybe, pad0,
  PopupFactory, randomNr, randomString, resolveEventTypeParameter, setData, styleFactory, systemLog,
  tagFNFactory, tagLib, toCamelcase, toDashedNotation, truncate2SingleStr, truncateHtmlStr, ucFirst,
};

function clearAllTimers() {
  let id = setTimeout(() => {});
  while (id >= 0) { clearTimeout(id--); }
}

function getHandlerName(name) {
  const validName = isNonEmptyString(name) && !/^handler|handlers$/gi.test(name.trim())
  return validName ? name.trim() : uniqueHandlerID();
}

function uniqueHandlerID(idCache) {
  const anonID = `anonymous_${Math.random().toString(36).slice(2)}`;
  
  if (!handlerIdCache[anonID]) {
    handlerIdCache[anonID] = anonID;
    return anonID;
  }
  
  return uniqueHandlerID();
}

function getCaptureValue(eventType, captureValue) {
  return !!(allwaysCaptureEventTypes.find(t => t === eventType)) || !!captureValue;
}

function checkProp(prop) {
  return prop.startsWith(`data`) || ATTRS.html.find(attr => prop.toLowerCase() === attr);
}

function emptyElement(el) {
  return el && (el.textContent = "");
}

function findParentScrollDistance(node, distance = 0, top = true) {
  node = node?.parentElement;
  const what = top ? `scrollTop` : `scrollLeft`;
  distance += node ? node[what] : 0;
  return !node ? distance : findParentScrollDistance(node, distance, top);
}

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
  
  function warn(...args) {
    backLog.unshift(...args.map(arg => `${logTime()} ⚠ ${decodeForConsole(arg)}`));
    console.warn(backLog.slice(0, args.length).join(`\n`));
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
    warn: {value: warn, enumerable: false},
  });
  
  return Object.freeze(systemLogger);
}

function logTime() {
  return ((d) =>
    `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
      pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
}

function assignAttrValues(el, keyValuePairs) {
  if (el) {
    for (let [key, value] of Object.entries(keyValuePairs)) {
      key = toDashedNotation(key);
      if (key.startsWith(`data`)) {
        return setData(el, value);
      }
      
      if (IS(value, String) && checkProp(key)) {
        el.setAttribute(key, value.split(/[, ]/)?.join(` `));
      }
    }
  }
}

function setData(el, keyValuePairs) {
  if (el && IS(keyValuePairs, Object)) {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      el.setAttribute(`data-${toDashedNotation(key)}`, value);
    }
  }
}

function input2Collection(input) {
  return !input ? []
    : IS(input, Proxy) ? [input.EL]
      : IS(input, NodeList) ? [...input]
        : isNode(input) ? [input]
          : isArrayOfHtmlElements(input) ? input
            : input.isJQx ? input.collection : undefined;
}

function after(instance, elem2AddAfter) {
  return instance.andThen(elem2AddAfter);
}

function before (instance, elem2AddBefore) {
  return instance.andThen(elem2AddBefore, true);
}

function isNode(input) {
  return IS(input, Text, HTMLElement, Comment)
}

function applyStyle(el, rules) {
  if (IS(rules, Object)) {
    for (let [key, value] of Object.entries(rules)) {
      let priority;
      if (/!important/i.test(value)) {
        value = value.slice(0, value.indexOf(`!`)).trim();
        priority = 'important';
      }
      
      el.style.setProperty(toDashedNotation(key), value, priority)
    }
  }
}

function cloneAndDestroy(elem) {
  const cloned = elem.cloneNode(true)
  cloned.removeAttribute && cloned.removeAttribute(`id`);
  elem.isConnected ? elem.remove() : elem = null;
  return cloned;
}


function isVisible(el) {
  if (!el) { return undefined; }
  const elStyle = el.style;
  const computedStyle = getComputedStyle(el);
  const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
  const noDisplay = [elStyle.display, computedStyle.display].includes("none");
  const hidden = el.hidden;
  const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0
    || el.offsetLeft > document.body.offsetWidth;
  const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
  return !(hidden || offscreen || noOpacity || noDisplay || invisible);
}

function isWritable(elem) {
  if (elem?.isConnected) {
    return !![...document.querySelectorAll(`:is(:read-write)`)]
      .find(el => el === elem);
  }
  
  return false;
}

function ElemArray2HtmlString(elems) {
  return elems?.filter(el => el).reduce((acc, el) =>
    acc.concat(isComment(el) ? `<!--${el.data}-->`
      : isCommentOrTextNode(el) ?  el.textContent
        : el.outerHTML), ``);
}

/* private */
function pad0(nr, n=2) {
  return `${nr}`.padStart(n, `0`);
}

function randomNr(max, min = 0) {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( ([...crypto.getRandomValues(new Uint32Array(1))].shift() / 2 ** 32 ) * (max - min + 1) + min );
}

function randomString() {
  return `_${shuffle(characters4RandomString).slice(0, 8).join(``)}`;
}

function resolveEventTypeParameter (maybeTypes) {
  maybeTypes = IS(maybeTypes, String) && /,/.test(maybeTypes)
    ? maybeTypes
      .split(`,`)
      .map(t => t.trim().toLowerCase())
      .filter( t => t.length > 0)
    : maybeTypes;
  return IS(maybeTypes, Array)
    ? maybeTypes
    : IS(maybeTypes, String) && maybeTypes?.trim().toLowerCase() || ``;
}

function isModal(elem) {
  if (elem?.isConnected) {
    return !![...document.querySelectorAll(`:is(:modal)`)]
      .find(el => el === elem) ? true : false;
  }
  
  return false;
}

function convert2Bool(value, defaultValue) {
  // Valid input values: 0|false|f|1|true|t (case insensitive)
  value = String(value).trim();
  switch (true) {
    case /^(0|false|f)$/i.test(value):
      return false;
    case /^(1|true|t)$/i.test(value):
      return true;
    default:
      return defaultValue;
  }
}

/* private */
function shuffle(array) {
  let i = array.length;
  while (i--) {
    const ri = randomNr(i);
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
}

function toCamelcase(str2Convert) {
  return IS(str2Convert, String)
    ? str2Convert.toLowerCase()
      .split(`-`)
      .map( (str, i) => i && `${ucFirst(str)}` || str)
      .join(``)
    : str2Convert;
}

function toDashedNotation(str2Convert) {
  return str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
}

function ucFirst([first, ...theRest]) {
  return `${first.toUpperCase()}${theRest.join(``)}`;
}

function isCommentOrTextNode(node) {
  return IS(node, Comment, Text);
}

function isComment(input) {
  IS(input, Comment);
}

function isText(input) {
  return IS(input, Text);
}

function isHtmlString(input) {
  return IS(input, String) && /^<|>$/.test(`${input}`.trim());
}

function isArrayOfHtmlElements(input) {
  return IS(input, Array) && !input?.find(el => !isNode(el));
}

function isArrayOfHtmlStrings(input) {
  return IS(input, Array) && !input?.find(s => !isHtmlString(s));
}
