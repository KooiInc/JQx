import { createElementFromHtmlString, insertPositions, inject2DOMTree, cleanupHtml, ATTRS} from "./DOM.js";
import { debugLog, Log, systemLog } from "./JQxLog.js";
import allMethods from "./JQxMethods.js";
import PopupFactory from "./Popup.js";
import HandleFactory from "./HandlerFactory.js";
import tagLib from "./HTMLTags.js";
import {
  randomString, toDashedNotation, IS, truncateHtmlStr, tagFNFactory as $T,
  truncate2SingleStr, logTime, hex2RGBA, styleFactory, toCamelcase,
  isNonEmptyString,
} from "./Utilities.js";
let static4Docs = {};
const {
  instanceMethods, instanceGetters,isCommentOrTextNode, isNode,
  isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings, ElemArray2HtmlString,
  input2Collection, setCollectionFromCssSelector, addHandlerId, cssRuleEdit,
  addFn, elems4Docs } = smallHelpersFactory();

/* region functions */
function smallHelpersFactory() {
  const cssRuleEdit = styleFactory( { createWithId: `JQxStylesheet` } );
  const addFn = (name, fn) => instanceMethods[name] = (self, ...params) => fn(self, ...params);
  const instanceMethods = allMethods.instanceExtensions;
  const instanceGetters = allMethods.factoryExtensions;
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

    return errorStr ?? `CSS querySelector "${input}", output ${self.collection.length} element(s)`;
  };
  const addHandlerId = instance => {
    const handleId = instance.data.get(`hid`) || `HID${randomString()}`;
    instance.data.add({hid: handleId});
    return `[data-hid="${handleId}"]`;
  };
  const elems4Docs = Object.entries(tagLib.tagsRaw)
    .filter( ([,cando]) => cando)
    .map( ([key,]) => key)
    .sort( (a, b) => a.localeCompare(b));

  return {
    instanceMethods, instanceGetters,isCommentOrTextNode, isNode, isComment, isText,
    isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings, ElemArray2HtmlString,
    input2Collection, setCollectionFromCssSelector, addHandlerId, cssRuleEdit,
    addFn, elems4Docs };
}

function proxify(instance) {
  return new Proxy( instance, { get: (obj, key) => proxyKeyFactory(obj, key, instance) } );
}

function wrapExtension(method, instance) {
  return  (...args) => IS(method, Function) && method(proxify(instance), ...args);
}

function wrapGetter(method, instance) {
  return (...args) => IS(method, Function) && method(proxify(instance), ...args);
}

function proxyKeyFactory(self, key, instance) {
  switch(true) {
    case IS(key, Symbol): return self;
    case IS(+key, Number): return self.collection?.[key] || undefined;
    case !!(key in instanceGetters): return wrapGetter(instanceGetters[key], instance)();
    case !!(key in instanceMethods): return wrapExtension(instanceMethods[key], instance);
    default: return self[key];
  }
}

function addJQxStaticMethods(jqx) {
  const staticMethods = defaultStaticMethodsFactory(jqx);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(staticMethods))) {
    Object.defineProperty(jqx, key, descriptor);
    Object.defineProperty(static4Docs, key, descriptor); }
  return jqx;
}

function allowances(jqx) {
  return {
    allow: tagName => {
      const isWebComponent = /-/.test(tagName);
      const webComponentTagName = isWebComponent && tagName;
      tagName =  isWebComponent ? toCamelcase(tagName) : tagName.toLowerCase();
      tagLib.allowTag(tagName);

      if (!IS(jqx[tagName], Function)) {
        Object.defineProperties( jqx, addGetters(tagName, true, jqx, webComponentTagName) );
      }
    },
    prohibit: tagName => {
      tagName = tagName.toLowerCase();
      tagLib.prohibitTag(tagName);

      if (IS(jqx[tagName], Function)) {
        Object.defineProperties( jqx, addGetters(tagName, false, jqx) );
      }
    }
  }
}

function cssRemove(...rules) {
  if (rules.length === 1) {
    const ruleStr = String(rules.shift().trim());
    rules = !ruleStr.startsWith(`!`)
      ? ruleStr.split(`,`).map(v => v.trim())
      : [ruleStr.slice(1, -1)];
  }

  for (const rule of rules.map(rule => rule.startsWith(`!`) ? rule.slice(1, -1) : rule)) {
    cssRuleEdit(rule, {removeRule: 1});
  }
}

function delegateFactory(handle) {
  return function(type, origin, ...eventHandlers) {
    if (IS(origin, Function)) {
      eventHandlers.push(origin);
      origin = undefined;
    }

    for (const handler of eventHandlers) {
      handle({eventType: type, selector: origin, callback: handler})
    }
  }
}

function delegateCaptureFactory(handle) {
  return function(spec) {
    let {type, origin, selector, handlers, name, capture} = spec;
    if (!IS(handlers, Function, Array)) { return; }
    handlers = IS(handlers, Function) ? [handlers] : handlers;
    const params = {eventType: type, selector: selector || origin, capture, name};
    const doHandle = handler => IS(handler, Function) && handle({...params, callback: handler});

    if (IS(type, Array)) {
      const types = type.filter(t => isNonEmptyString(String));

      if (types.length > 0) {
        for (const type of types) {
          params.eventType = type;
          for (const handler of handlers) { doHandle(handler); }
        }

        return true;
      }
    }

    for (const handler of handlers) { doHandle(handler); }
  }
}

function virtualFactory(jqx) {
  return function(html, root, position) {
    root = root?.isJQx ? root?.[0] : root;
    position = position && Object.values(insertPositions).find(pos => position === pos) ? position : undefined;
    const virtualElem = jqx(html, document.createElement(`br`));
    if (root && !IS(root, HTMLBRElement)) {
      for (const elem of virtualElem.collection) {
        position ? root.insertAdjacentElement(position, elem) : root.append(elem);
      }
    }
    return virtualElem;
  }
}

function combineObjectSources(...sources) {
  const result = {};

  for (const source of sources) {
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      !(key in result) && Object.defineProperty(result, key, descriptor);
    }
  }

  return result;
}

function tagNotAllowed(tagName) {
  console.error(`JQx: "${tagName}" not allowed, not rendered`);
  return undefined;
}

function tagGetterFactory(tagName, cando, jqx, webComponentTagName) {
  tagName = toDashedNotation(webComponentTagName || tagName.toLowerCase());

  return {
    get() {
      return  (...args) => {
        if (!cando) { return tagNotAllowed(tagName) }
        return jqx.virtual(cleanupHtml($T[tagName](...args)));
      }
    },
    enumerable: false,
    configurable: true,
  }
}

function addGetters(tag, cando, jqx, webComponentTagName) {
  tag = tag.toLowerCase();
  const jqxGetterForThisTag = tagGetterFactory(tag, cando, jqx, webComponentTagName);

  return webComponentTagName
    ? { [webComponentTagName]: jqxGetterForThisTag, [toCamelcase(webComponentTagName)]: jqxGetterForThisTag, }
    : { [tag]: jqxGetterForThisTag, [tag.toUpperCase()]: jqxGetterForThisTag, };
}

function defaultStaticMethodsFactory(jqx) {
  return combineObjectSources(
    Object.entries(tagLib.tagsRaw).reduce(staticTagsLambda(jqx), {}),
    staticMethodsFactory(jqx));
}

function staticTagsLambda(jqx) {
  return function(acc, [tag, cando]) {
    cando && Object.defineProperties( acc, addGetters(tag, cando, jqx) );
    return acc;
  }
}

function staticMethodsFactory(jqx) {
  const editCssRule = (ruleOrSelector, ruleObject) => cssRuleEdit(ruleOrSelector, ruleObject);
  const allowProhibit = allowances(jqx);
  const handle = HandleFactory();
  return {
    debugLog,
    log: (...args) => Log(`fromStatic`, ...args),
    insertPositions,
    get at() { return insertPositions; },
    editCssRules: (...rules) => { for (const rule of rules) { cssRuleEdit(rule); } },
    editCssRule,
    get setStyle() { /*deprecated*/return editCssRule; },
    delegate: delegateFactory(handle),
    delegateCaptured: delegateCaptureFactory(handle),
    virtual: virtualFactory(jqx),
    get fn() { return addFn; },
    allowTag: allowProhibit.allow,
    prohibitTag: allowProhibit.prohibit,
    get lenient() { return tagLib.allowUnknownHtmlTags; },
    get IS() { return IS; },
    get Popup() {
      if (!jqx.activePopup) {
        Object.defineProperty(
          jqx, `activePopup`, {
            value: PopupFactory(jqx),
            enumerable: false
          } );
      }
      return jqx.activePopup;
    },
    popup: () => jqx.Popup,
    createStyle: id => styleFactory({createWithId: id || `jqx${randomString()}`}),
    editStylesheet: id => styleFactory({createWithId: id || `jqx${randomString()}`}),
    removeCssRule: cssRemove,
    removeCssRules: cssRemove,
    text: (str, isComment = false) => isComment ? jqx.comment(str) : document.createTextNode(str),
    node: (selector, root = document) => root.querySelector(selector, root),
    nodes: (selector, root = document) => [...root.querySelectorAll(selector, root)],
  };
}
/* endregion functions */

export {
  hex2RGBA,
  addHandlerId,
  isHtmlString,
  isNode,
  logTime,
  toDashedNotation,
  randomString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  isCommentOrTextNode,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  truncateHtmlStr,
  truncate2SingleStr,
  proxify,
  addJQxStaticMethods,
  createElementFromHtmlString,
  insertPositions,
  systemLog,
  IS,
  static4Docs,
  elems4Docs,
};
