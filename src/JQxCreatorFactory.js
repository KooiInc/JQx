import {
  randomString, toDashedNotation, IS, tagFNFactory as $T, styleFactory, toCamelcase, systemLog,
  escHtml, isNonEmptyString, resolveEventTypeParameter, selectedFactoryHelpers, insertPositions,
  cleanupHtml, PopupFactory, tagLib, HandlerFactory, getHandlerName,
} from "./JQxUtilities.js";
import allMethodsFactory from "./JQxInstanceMethods.js";

let instanceGetters, instanceMethods;
const {
  isComment, isText, isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings,
  ElemArray2HtmlString, addHandlerId, cssRuleEdit, addFn
} = selectedUtilitiesFactory();

export { proxify, addJQxStaticMethods };

function selectedUtilitiesFactory() {
   return {
    ...selectedFactoryHelpers(),
    addFn: function(name, extensionMethod) {
      systemLog.log(`JQx: added extension function [${name}]`);
      return instanceMethods[name] = (self, ...params) => extensionMethod(self, ...params);
    } };
}

function proxify(instance) {
  return new Proxy( instance, Object.freeze({ get: (obj, key) => proxyKeyFactory(obj, key, instance) }) );
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
      !(key in result) && Object.defineProperty(result, key, {...descriptor, enumerable: false});
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

/* region __WIP */
function delegateCaptureFactory(handlerWrapper) {
  return function(spec) {
    let {type, types, origin, selector, handler, handlers, node, name, capture, once, about} = spec;
    // <legacy>
    handler = handlers || handler;
    type = types || type;
    selector = origin || selector;
    // </legacy>
    const typesResolved = resolveEventTypeParameter(type);
    const specifiedName = name;
    handler = IS(handler, Function) ? [handler] : handler;
    const params = {
      type: typesResolved, selector: selector || origin, capture,
      name: specifiedName, once, node, about };
    
    switch(true) {
      case IS(typesResolved, Array) && typesResolved.length > 0:
        for (const type of typesResolved) {
          params.type = type;
          assignListeners(handler, params, handlerWrapper);
        }
        break;
      default: return assignListeners(handler, params, handlerWrapper);
    }
  }
}

function assignListeners(handlerFns, params, handlerWrapper) {
  for (const handler of handlerFns) {
    params.name = getHandlerName(params.name || handler.name);
    handlerWrapper.listen({...params, handler});
  }
}
/* endregion __WIP */

function getNamedListenerFactory(jqx) {
  return function(type, name) {
    name = isNonEmptyString(name) && name;
    type = isNonEmptyString(type) && type;
    return name && type && jqx.listenerStore[type][name];
  };
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
  const handlerWrapper = HandlerFactory(jqx);
  const capturedHandling = delegateCaptureFactory(handlerWrapper);
  const log = (...line) => systemLog.on.log(...line).off;
  return {
    editCssRule, createStyle, editCssRules, allowProhibit, handle: capturedHandling, capturedHandling,
    log, handlerWrapper};
}

function staticMethodsFactory(jqx) {
  const { factoryExtensions, instanceExtensions } = allMethodsFactory(jqx);
  instanceGetters = factoryExtensions;
  instanceMethods = instanceExtensions;
  const { editCssRule, createStyle, editCssRules, allowProhibit, handle, capturedHandling, log, handlerWrapper } =
    getSelectedStaticMethods(jqx);
  const getNamedListener = getNamedListenerFactory(jqx);
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
    get listen() { return handlerWrapper.listen; },
    get at() { return insertPositions; },
    get setStyle() { /*deprecated*/return editCssRule; },
    get fn() { return addFn; },
    get lenient() { return tagLib.allowUnknownHtmlTags; },
    get IS() { return IS; },
    get Popup() { return popupGetter(jqx); },
    get listenerStore() { return handlerWrapper.ListenerStore; },
  };
}
