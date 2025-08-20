import { isNonEmptyString, getCaptureValue } from "./Utilities.js";

export { HandlerFactory  };

function HandlerFactory(jqx) {
  const store = {};
  const idCache = {};
  const anon = `anonymous_`;
  
  function setListener(listener) {
    if (listener) {
      const {handler, capture, type} = listener;
      document.addEventListener(type, handler, {capture});
    }
  }
  
  function removeListener(listener) {
    if (listener) {
      const {type, handler, capture} = listener;
      document.removeEventListener(type, handler, {capture});
    }
  }
  
  function wrapFn4Selector(fn, selector, once, handlerName) {
    return function(evt) {
        if (!isNonEmptyString(selector)) {
          return fn({evt});
        }
        
        const elemFound = evt.target.closest(selector);
        if (elemFound) {
          const me = jqx(elemFound);
          fn({self: me, me, evt});
          // to avoid listener removal on capturing/bubbling, once is
          // handled manually
          if (once) { remove(evt.type, handlerName); }
        }
        return true;
      }
  }
  
  function uniqueID() {
    const anonID = `${anon}${Math.random().toString(36).slice(2)}`;
    return idCache[anonID] ? uniqueID() : anonID;
  }
  
  function storedEventType(eventType) {
    store[eventType] = store[eventType] || {};
    return store[eventType];
  }
  
  function retrieve(eventType, name) {
    return Object.entries(storedEventType(eventType))
      .find( ([key, ]) => key  === name );
  }
  
  function remove(eventType, name) {
    const listener = retrieve(eventType, name)
    if (listener) {
      removeListener(listener[1]);
      delete store[eventType][name];
      delete idCache[name];
      
      if (Object.keys(store[eventType]).length < 1) {
        delete store[eventType];
      }
      
      console.warn(`Removed listener [${name}] for event type [${eventType}].`);
    }
  }
  
  function getHandlerFunctionName(name) {
    return !/^handler$|^handlers$/i.test(name) && name;
  }
  
  function storeHandler(spec) {
    let { type, handler, name, capture, once, selector, node, about } = spec;
    store[type] = store[type] || {};
    let handlerName = getHandlerFunctionName(handler.name) || name;
    
    if (!handlerName) { handlerName = uniqueID(); }
    
    if (node instanceof HTMLElement) {
      // Note: for multiple event types dataset.hid may be defined already
      const handlerID = node.dataset.hid || handlerName;
      node.dataset.hid = handlerID;
      selector = `[data-hid=${handlerID}]`;
    }
    
    switch(true) {
      case !store[type][handlerName]:
        idCache[handlerName] = 1;
        store[type][handlerName] = {
          name: handlerName,
          handler: wrapFn4Selector(handler, selector, once, handlerName),
          capture: getCaptureValue(type, capture),
          once: !!once,
          type: type,
          selector: !!selector && selector || false,
          about: !!about && about || false,
          unListen() { remove(type, handlerName); },
        };
        return store[type][handlerName];
      default: return console.error(`The name [${handlerName}] for [${
        type}] exists. Use unique (function) names.`);
    }
  }
  
  return {
    remove(...args) { return remove(...args); },
    listen: function(spec) {
      const { type, handler } = spec;
      if ( !isNonEmptyString(type) || !jqx.IS(handler, Function) ) { return; }
      const nwHandler = storeHandler(spec);
      if (nwHandler) {
        setListener(nwHandler);
        return {
          name: nwHandler.name,
          type,
          unListen() { remove(eType, nwHandler.name); },
        };
      }
    },
    get ListenerStore() { return Object.freeze({...store}); }
  };
}
