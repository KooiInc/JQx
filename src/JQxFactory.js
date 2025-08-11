import { cleanupHtml } from "./DOM.js";
import allMethodsFactory from "./JQxMethods.js";
import PopupFactory from "./Popup.js";
import { listeners, default as HandleFactory } from "./HandlerFactory.js";
import tagLib from "./HTMLTags.js";
import {
  randomString, toDashedNotation, IS, tagFNFactory as $T, styleFactory, toCamelcase, systemLog, escHtml,
  isNonEmptyString, resolveEventTypeParameter, selectedExtensionHelpers, insertPositions
} from "./Utilities.js";

let instanceGetters, instanceMethods;
const {
  isComment, isText, isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings,
  ElemArray2HtmlString, addHandlerId, cssRuleEdit, addFn
} = selectedUtilitiesFactory();

export { proxify, addJQxStaticMethods };

/* region functions */
function selectedUtilitiesFactory() {
  const cssRuleEdit = styleFactory({createWithId: `JQxStylesheet`});
  const addFn = (name, fn) => instanceMethods[name] = (self, ...params) => fn(self, ...params);
  return { ...selectedExtensionHelpers(), ...{ cssRuleEdit, addFn } };
}

function proxify(instance) {
  return new Proxy( instance, { get: (obj, key) => proxyKeyFactory(obj, key, instance) } );
}

function wrap(method, instance) {
  return (...args) => IS(method, Function) && method(proxify(instance), ...args);
}

function proxyKeyFactory(self, key, instance) {
  switch(true) {
    case IS(key, Symbol): return self;
    case IS(+key, Number): return self.collection?.[key] || undefined;
    case (key in instanceGetters): return wrap(instanceGetters[key], instance)();
    case (key in instanceMethods): return wrap(instanceMethods[key], instance);
    default: return self[key];
  }
}

function addJQxStaticMethods(jqx) {
  const staticMethods = defaultStaticMethodsFactory(jqx);

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(staticMethods))) {
    Object.defineProperty(jqx, key, descriptor);
  }

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

function virtualFactory(jqx) {
  return function(html, root, position) {
    root = root?.isJQx ? root?.[0] : root;
    position = position && Object.values(insertPositions).find(pos => position === pos);
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

function tagGetterFactory(tagName, cando, jqx, webComponentTagName) {
  tagName = toDashedNotation(webComponentTagName || tagName.toLowerCase());
  return {
    get() {
      return (...args) => {
        return cando && jqx.virtual(cleanupHtml($T[tagName](...args)));
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

function delegateFactory(listen) {
  return function(type, selector, ...listeners) {
    if (IS(selector, Function)) {
      listeners.push(selector);
      selector = undefined;
    }

    listen({type, selector: selector, handlers: listeners});
  }
}

function delegateCaptureFactory(listen) {
  return function(spec) {
    let {type, origin, selector, handlers, name, capture, once, canRemove} = spec;
    const typesResolved = resolveEventTypeParameter(type);
    const specifiedName = name;
    handlers = IS(handlers, Function) ? [handlers] : handlers;
    canRemove = IS(canRemove, Boolean) ? canRemove : false;
    const params = { eventType: typesResolved, selector: selector || origin, capture,
      name: specifiedName, once, canRemove };
    switch(true) {
      case IS(typesResolved, Array) && typesResolved.length > 0:
        for (const type of typesResolved) {
          params.eventType = type;
          for (const handler of handlers) { doHandle(handler); }
        }
        return;
      default: for (const handler of handlers) { doHandle(handler); }
    }

    function doHandle(handler) {
      params.name = specifiedName;
      IS(handler, Function) && listen({...params, callback: handler});
    }
  }
}

function getNamedListener(type, name) {
  name = isNonEmptyString(name) && name;
  type = isNonEmptyString(type) && type;
  return name && type && [...listeners[type].values()].find(h => (h.name || ``) === name);
}

function popupGetter(jqx) {
  if (!jqx.activePopup) {
    Object.defineProperty(
      jqx, `activePopup`, {
        value: PopupFactory(jqx),
        enumerable: false
      } );
  }
  return jqx.activePopup;
}

function getSelectedStaticMethods(jqx) {
  const editCssRule = (ruleOrSelector, ruleObject) => cssRuleEdit(ruleOrSelector, ruleObject);
  const createStyle = id => styleFactory({createWithId: id || `jqx${randomString()}`});
  const editCssRules = (...rules) => { for (const rule of rules) { cssRuleEdit(rule); } };
  const allowProhibit = allowances(jqx);
  const handle = HandleFactory(jqx);
  const capturedHandling = delegateCaptureFactory(handle);
  const log = (...line) => systemLog.on.log(...line).off;
  return {editCssRule, createStyle, editCssRules, allowProhibit, handle, capturedHandling,log};
}

function staticMethodsFactory(jqx) {
  const { factoryExtensions, instanceExtensions } = allMethodsFactory(jqx);
  instanceGetters = factoryExtensions;
  instanceMethods = instanceExtensions;
  const { editCssRule, createStyle, editCssRules, allowProhibit, handle, capturedHandling, log } =
    getSelectedStaticMethods(jqx);

  return {
    log,
    editCssRules,
    createStyle,
    editStylesheet: createStyle,
    editCssRule,
    escHtml,
    logger: systemLog,
    text: (str, isComment = false) => isComment ? jqx.comment(str) : document.createTextNode(str),
    node: (selector, root = document) => root.querySelector(selector, root),
    nodes: (selector, root = document) =>  [...root.querySelectorAll(selector, root)],
    get getNamedListener() { return getNamedListener; },
    get virtual() { return virtualFactory(jqx); },
    get allowTag() { return allowProhibit.allow; },
    get prohibitTag() { return allowProhibit.prohibit; },
    get removeCssRule() { return cssRemove; },
    get removeCssRules() { return cssRemove; },
    get delegate()  { return delegateFactory(capturedHandling); },
    get delegateCaptured() { return capturedHandling; } ,
    get handle() { return  capturedHandling; },
    get at() { return insertPositions; },
    get setStyle() { /*deprecated*/return editCssRule; },
    get fn() { return addFn; },
    get lenient() { return tagLib.allowUnknownHtmlTags; },
    get IS() { return IS; },
    get Popup() { return popupGetter(jqx); },
  };
}
/* endregion functions */
