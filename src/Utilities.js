import jqx from "../index.js";
import {default as tagFNFactory} from "./tinyDOM.js";
import {default as IS, maybe} from "./TypeofAnything.js";
import styleFactory from "./LifeCSS.js";
const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const pad0 = (nr, n=2) => `${nr}`.padStart(n, `0`);
const randomNr = (max, min = 0) => {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( ([...crypto.getRandomValues(new Uint32Array(1))].shift() / 2 ** 32 ) * (max - min + 1) + min );
};
const isNonEmptyString = (str, minlen = 1) => {
  minlen = IS(minlen, Number) && minlen || 1;
  return IS(str, String) && str.length >= minlen;
};
const shuffle = array => {
  let i = array.length;
  while (i--) {
    const ri = randomNr(i);
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
};
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};
const truncateHtmlStr = (str, maxLength = 120) => `${str}`.trim()
  .slice(0, maxLength)
  .replace(/>\s+</g, `><`)
  .replace(/</g, `&lt;`)
  .replace(/\s{2,}/g, ` `)
  .replace(/\n/g, `\\n`) + (str.length > maxLength ? ` &hellip;` : ``).trim();
const toDashedNotation = str2Convert =>str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
const ucFirst = ([first, ...theRest]) => `${first.toUpperCase()}${theRest.join(``)}`;
const toCamelcase = str2Convert =>
  IS(str2Convert, String) ? str2Convert.toLowerCase()
    .split(`-`)
    .map( (str, i) => i && `${ucFirst(str)}` || str)
    .join(``) : str2Convert;
const randomString = () => `_${shuffle(characters4RandomString).slice(0, 8).join(``)}`;
const truncate2SingleStr = (str, maxLength = 120) =>
  truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`);
const logTime = () => ((d) =>
  `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
    pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
const hex2RGBA = function (hex, opacity = 100) {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity / 100}` : ""})`;
};
const escHtml = html => html.replace(/</g, `&lt;`);

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
    return elem.parentNode
      ? !!jqx.nodes(`:is(:read-write)`, elem?.parentNode)?.find(el => el === elem) : false;
  };

  const isModal = function(elem) {
    return elem.parentNode
      ? !!jqx.nodes(`:is(:modal)`, elem?.parentNode)?.find(el => el === elem) : false;
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

export {
  IS,
  maybe,
  randomString,
  isNonEmptyString,
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
};
