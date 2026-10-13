import {
  cleanupHtml,
  clearAllTimers,
  convert2Bool,
  escHtml,
  getAttributesForLogging,
  HandlerFactory,
  insertPositions,
  IS,
  isNonEmptyString,
  maybe,
  PopupFactory,
  proxyWrapper,
  randomString,
  resolveEventTypeParameter,
  selectedFactoryHelpers,
  styleFactory,
  systemLog,
  tagFNFactory as $T,
  tagLib,
  toCamelcase,
  toDashedNotation,
} from "./JQxUtilities.js";
import allMethodsFactory from "./JQxInstanceMethods.js";

let instanceGetters, instanceMethods;
const {
  isComment, isText, isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings,
  ElemArray2HtmlString, cssRuleEdit, addFn
} = selectedUtilitiesFactory();

export { proxify, addJQxStaticMethods };

function selectedUtilitiesFactory() {
   return {
    ...selectedFactoryHelpers(),
    addFn: addInstanceMethodOrGetter };
}

function addInstanceMethodOrGetter(name, extensionMethod, isGetter) {
  name = name?.trim();
  if (!isNonEmptyString(name) || !IS(extensionMethod, Function) ) {
    return systemLog.error("JQx.fn: method invalid parameter(s)");
  }
  switch(!!isGetter) {
    case true: instanceGetters[name] = self => extensionMethod(self); break;
    default: instanceMethods[name] = (self, ...params) => extensionMethod(self, ...params);
  }
  return systemLog.log(`JQx: added instance extension ${isGetter ? `getter` : `function`} [${name}]`);
}

function addCTORMethodOrGetterFactory(jqx) {
  return function(name, extensionMethod, isGetter) {
    name = name?.trim();
    if (!isNonEmptyString(name) || !IS(extensionMethod, Function) ) {
      return jqx.error("JQx.staticFn: invalid parameter(s)");
    }
    
    const ext = !!isGetter
      ? { get() { return extensionMethod(); } }
      : { value(...args) { return extensionMethod(...args); } };
    
    try { Object.defineProperty(jqx, name, ext); }
    catch(err) {
      return jqx.warn(`JQx.staticFn: extension [${name}] already exists`);
    }
    
    return systemLog.log(`JQx: added static extension ${!!isGetter ? `getter` : `function`} [${name}]`);
  }
}

function proxify(instance) {
  return new Proxy(
    instance, { get: (target, key) => proxyTrapFactory(target, key, instance) }
  );
}

function maybeReProxify(method, instance, isGetter = false) {
  instance = !!instance[Symbol.proxy] ? instance : proxify(instance);
  const returnValue = function(...args) { return method(instance, ...args); }
  return isGetter ? returnValue() : returnValue;
}

function proxyReporter(instance) {
  return `Proxy for JQx${instance.collection.length < 1 ? ` (empty)` : ``} instance`;
}

function proxyTrapFactory(JQxtarget, key, instance) {
  switch(true) {
    case key === Symbol.proxy: return proxyReporter(instance);
    case typeof key === `symbol`: return maybe({trial: () => JQxtarget[key], whenError: () => JQxtarget });
    case !Number.isNaN(+key) && typeof +key === `number`: return JQxtarget.collection?.[key] || undefined;
    case (instanceGetters.hasOwnProperty(key)): return maybeReProxify(instanceGetters[key], instance, true);
    case (instanceMethods.hasOwnProperty(key)): return maybeReProxify(instanceMethods[key], instance);
    default: return Reflect.get(JQxtarget, key);
  }
}

function addJQxStaticMethods(jqx) {
  const { factoryExtensions, instanceExtensions } = allMethodsFactory(jqx);
  instanceGetters = factoryExtensions;
  instanceMethods = instanceExtensions;
  
  for (const [key, descriptor] of
      Object.entries(Object.getOwnPropertyDescriptors(staticMethodsFactory(jqx)))) {
    Object.defineProperty(jqx, key, descriptor);
  }

  return jqx;
}

function allowances(jqx) {
  return {
    allow(tagName) {
      const isWebComponent = /-/.test(tagName);
      const webComponentTagName = isWebComponent && tagName;
      tagLib.allowTag(tagName);
      if (isWebComponent) {
        $T[webComponentTagName];
        tagName =  isWebComponent ? toCamelcase(tagName) : tagName.toLowerCase();
        tagLib.allowTag(tagName)
        tagLib.allowTag(webComponentTagName);
        console.log(tagName, webComponentTagName);
        
      }
      
    },
    prohibit(tagName) {
      tagName = tagName.toLowerCase();
      tagLib.prohibitTag(tagName);
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


function defaultStaticMethodsFactory(jqx) {
  return staticMethodsFactory(jqx);
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
    handlerWrapper.listen({...params, handler});
  }
}

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
  const createStyle = function(id) {return styleFactory({createWithId: id || `jqx${randomString()}`}); };
  const editCssRules = function(...rules) { for (const rule of rules) { cssRuleEdit(rule); } };
  const allowProhibit = allowances(jqx);
  const handlerWrapper = HandlerFactory(jqx);
  const capturedHandling = delegateCaptureFactory(handlerWrapper);
  const log = (...line) => systemLog.on.log(...line).off;
  const warn = (...line) => systemLog.on.warn(...line).off;
  const error = (...line) => systemLog.on.error(...line).off;
  return {
    editCssRule, createStyle, editCssRules, allowProhibit, handle: capturedHandling, capturedHandling,
    log, warn, error, handlerWrapper};
}

function staticMethodsFactory(jqx) {
  const {
    editCssRule, createStyle, editCssRules, allowProhibit, handle,
    capturedHandling, log, warn, error, handlerWrapper
  } = getSelectedStaticMethods(jqx);
  const getNamedListener = getNamedListenerFactory(jqx);
  const staticFN = addCTORMethodOrGetterFactory(jqx);
  
  return {
    log,
    warn,
    error,
    editCssRules,
    createStyle,
    editStylesheet: createStyle,
    editCssRule,
    escHtml,
    logger: systemLog,
    proxyWrapper,
    text(str, isComment = false) { return isComment ? jqx(`<!--${str}-->`) : document.createTextNode(str); },
    node(selector, root = document) { return root.querySelector(selector, root); },
    nodes(selector, root = document) { return [...root.querySelectorAll(selector, root)]; },
    clearAllTimers,
    get staticFn() { return function(name, method, isGetter) { return staticFN(name, method, isGetter); } },
    get toBool() { return convert2Bool; },
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
