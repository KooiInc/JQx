import {default as tagFNFactory} from "./tinyDOM.js";
import {default as IS, maybe} from "./TypeofAnything.js";
import styleFactory from "./LifeCSS.js";
import {ATTRS} from "./EmbedResources.js";

const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const systemLog = systemLogFactory();
const datasetKeyProxy = Object.freeze({
  get(obj, key) { return obj[toCamelcase(key)] || obj[key]; },
  enumerable: false,
  configurable: false
});
const insertPositions = Object.freeze(new Proxy({
  start: "afterbegin", afterbegin: "afterbegin",
  end: "beforeend", beforeend: "beforeend",
  before: "beforebegin", beforebegin: "beforebegin",
  after: "afterend", afterend: "afterend" }, {
  get(obj, key) { return obj[String(key).toLowerCase()] ?? obj[key]; }
}));

export {
  addHandlerId, after, applyStyle, assignAttrValues, before, checkProp, cloneAndDestroy, css, datasetKeyProxy,
  ElemArray2HtmlString, emptyElement, escHtml, ExamineElementFeatureFactory, findParentScrollDistance,
  input2Collection, insertPositions, IS, isArrayOfHtmlElements, isArrayOfHtmlStrings, isCommentOrTextNode,
  isHtmlString, isNode, isNonEmptyString, logTime, loop, maybe, randomNr, randomString, resolveEventTypeParameter,
  selectedExtensionHelpers, setCollectionFromCssSelector, setData, styleFactory, systemLog, tagFNFactory,
  toCamelcase, toDashedNotation, truncate2SingleStr, truncateHtmlStr,
};

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

function loop(instance, callback) {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i);
  }

  return instance;
}

function shuffle(array) {
  let i = array.length;
  while (i--) {
    const ri = randomNr(i);
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
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

function escHtml(html) {
  switch(true) {
    case IS(html, String):
      const tmpDiv = document.createElement("div");
      tmpDiv.append(html);
      return tmpDiv.innerHTML;
    default: return html;
  }
}

function isCommentOrTextNode(node) {
  return IS(node, Comment, Text);
}

function isNode(input) {
  return IS(input, Text, HTMLElement, Comment)
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

function ElemArray2HtmlString(elems) {
  return elems?.filter(el => el).reduce((acc, el) =>
    acc.concat(isComment(el) ? `<!--${el.data}-->`
      : isCommentOrTextNode(el) ?  el.textContent
        : el.outerHTML), ``);
}

function input2Collection(input) {
  return !input ? []
    : IS(input, Proxy) ? [input.EL]
      : IS(input, NodeList) ? [...input]
        : isNode(input) ? [input]
          : isArrayOfHtmlElements(input) ? input
            : input.isJQx ? input.collection : undefined;
}

function setCollectionFromCssSelector(input, root, self) {
  const selectorRoot = root !== document.body && (IS(input, String) && input.toLowerCase() !== "body") ? root : document;
  let errorStr = undefined;

  try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
  catch (err) { errorStr = `Invalid CSS querySelector. [${!IS(input, String) ? `Nothing valid given!` : input}]`; }
  const collectionLen = self.collection.length;
  return collectionLen < 1
    ? `CSS querySelector "${input}", output: nothing`
    : errorStr ?? `CSS querySelector "${input}", output ${collectionLen} element${collectionLen > 1 ? `s` : ``}`;
}

function  addHandlerId(instance) {
  const handleId = instance.data.get(`hid`) || `HID${randomString()}`;
  instance.data.add({hid: handleId});
  return `[data-hid="${handleId}"]`;
}

function selectedExtensionHelpers() {
  return {
    isCommentOrTextNode, isNode, isComment, isText, isHtmlString, isArrayOfHtmlElements,
    isArrayOfHtmlStrings, ElemArray2HtmlString, input2Collection, setCollectionFromCssSelector,
    addHandlerId, cssRuleEdit: styleFactory({createWithId: `JQxStylesheet`}) };
}

function isVisible(el) {
  if (!el) { return undefined; }
  const elStyle = el.style;
  const computedStyle = getComputedStyle(el);
  const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
  const noDisplay = [elStyle.display, computedStyle.display].includes("none");
  const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0
    || el.offsetLeft > document.body.offsetWidth;
  const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
  return !(offscreen || noOpacity || noDisplay || invisible);
}

function isWritable(elem) {
  return [...elem.parentNode.querySelectorAll(`:is(:read-write)`)]?.find(el => el === elem) ?? false;
}

function isModal(elem) {
  return [...elem.parentNode.querySelectorAll(`:is(:modal)`)]?.find(el => el === elem) ?? false;
}

function ExamineElementFeatureFactory() {
  const notApplicable = `n/a`;
  const noElements = Object.freeze({
    notInDOM: true, writable: notApplicable, modal: notApplicable, empty: true,
    open: notApplicable, visible: notApplicable, });

  return self => {
    const firstElem = self.node;

    return IS(firstElem, Node)
      ? Object.freeze({
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
      })
      : noElements;
  };
}

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

function cloneAndDestroy(elem) {
  const cloned = elem.cloneNode(true)
  cloned.removeAttribute && cloned.removeAttribute(`id`);
  elem.isConnected ? elem.remove() : elem = null;
  return cloned;
}

function setData(el, keyValuePairs) {
  if (el && IS(keyValuePairs, Object)) {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      el.setAttribute(`data-${toDashedNotation(key)}`, value);
    }
  }
}

function before (instance, elem2AddBefore) {
  return instance.andThen(elem2AddBefore, true);
}

function after(instance, elem2AddAfter) {
  return instance.andThen(elem2AddAfter);
}

function findParentScrollDistance(node, distance = 0, top = true) {
  node = node?.parentElement;
  const what = top ? `scrollTop` : `scrollLeft`;
  distance += node ? node[what] : 0;
  return !node ? distance : findParentScrollDistance(node, distance, top);
}

function emptyElement(el) {
  return el && (el.textContent = "");
}

function checkProp(prop) {
  return prop.startsWith(`data`) || ATTRS.html.find(attr => prop.toLowerCase() === attr);
}

function css(el, keyOrKvPairs, value, jqx) {
  if (value && IS(keyOrKvPairs, String)) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQxClass-`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQxClass-${randomString().slice(1)}`;
  jqx.editCssRule(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
}

function assignAttrValues(/*NODOC*/el, keyValuePairs) {
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
