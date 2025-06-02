// JQx adapted from https://github.com/KooiInc/tinyDOM
import { IS, maybe } from "./Utilities.js";
const defaultTinyDOM = tinyDOM();
const converts = { html: `innerHTML`, text: `textContent`,  class: `className` };

export default defaultTinyDOM;

function tinyDOM() {
  const tinyDOMProxyGetter = { get(obj, key) {
      const tag = String(key)?.toLowerCase();
      switch(true) {
        case tag in obj: return obj[tag];
        case validateTag(tag): return createTagFunctionProperty(obj, tag, key);
        default: return createTagFunctionProperty(obj, tag, key, true);
      }
    }, enumerable: false, configurable: false
  };
  return new Proxy({}, tinyDOMProxyGetter);
}

function createTagFunctionProperty(obj, tag, key, isError = false) {
  Object.defineProperty(obj, tag, { get() { return isError ? _ => errorElement(key) : tag2FN(tag); } } );
  return obj[tag];
}

function processNext(root, next, tagName) {
  next = next?.isJQx && next.first() || next;
  
  return maybe({
    trial: _ => containsHTML(next) ? root.insertAdjacentHTML(`beforeend`, next) : root.append(next),
    whenError: err => console.info(`${tagName} (for root ${root}) not created, reason\n`, err)
  });
}

function tagFN(tagName, initial, ...nested) {
  const elem = retrieveElementFromInitial(initial, tagName);
  nested?.forEach(arg => processNext(elem, arg, tagName));
  return elem;
}

function retrieveElementFromInitial(initial, tag) {
  initial = isComment(tag) ? cleanupComment(initial) : initial?.isJQx ? initial.first() : initial;
  
  switch(true) {
    case IS(initial, String): return createElement(tag, containsHTML(initial, tag) ? {html: initial} : {text: initial});
    case IS(initial, Node): return createElementAndAppend(tag, initial);
    default: return createElement(tag, initial);
  }
}

function cleanupProps(props) {
  delete props.data;
  if (Object.keys(props).length < 1) {
    return props;
  }
  
  Object.keys(props).forEach(key => {
    const keyLowercase = key.toLowerCase();
    
    if (keyLowercase in converts) {
      props[converts[keyLowercase]] = props[key];
      delete props[key];
    }
  });
  
  return props;
}

function createElementAndAppend(tag, element2Append) {
  const elem = createElement(tag);
  elem.append(element2Append);
  return elem;
}

function createElement(tagName, props = {}) {
  props = isObjectCheck(props, {});
  const data = Object.entries(props.data ?? {});
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    cleanupProps( props ) );
  data.length && data.forEach(([key, value]) => elem.dataset[key] = String(value));
  return elem;
}

function isObjectCheck(someObject, defaultValue) {
  return defaultValue
    ? IS(someObject, {isTypes: Object, notTypes: [Array, null, NaN, Proxy], defaultValue})
    : IS(someObject, {isTypes: Object, notTypes: [Array, null, NaN, Proxy]});
}

function cleanupComment(initial) { return isObjectCheck(initial) ? initial?.text ?? initial?.textContent ?? `` : String(initial); }
function errorElement(key) { return createElement(`b`, {style:`color:red`,text:`'${key}' is not a valid HTML-tag`}); }
function containsHTML(str, tag) { return !isComment(tag) && IS(str, String) && /<.*>|&[#|0-9a-z]+[^;];/i.test(str); }
function isComment(tag) { return /comment/i.test(tag); }
function validateTag(name) { return !IS(createElement(name), HTMLUnknownElement); }
function tag2FN(tagName) { return (initial, ...args) => tagFN(tagName, initial, ...args); }
