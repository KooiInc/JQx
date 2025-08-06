import jqx from "../index.js";
import {isNonEmptyString} from "./Utilities.js";
const handlerStore = {};
const shouldCaptureEventTypes = [
  `load`, `unload`, `scroll`, `focus`, `blur`, `DOMNodeRemovedFromDocument`,
  `DOMNodeInsertedIntoDocument`, `loadstart`, `progress`, `error`, `abort`,
  `load`, `loadend`, `pointerenter`, `pointerleave`, `readystatechange`];
const getCapture = eventType => !!(shouldCaptureEventTypes.find(t => t === eventType));
export {handlerStore as listeners, HandleFactory as default};

function HandleFactory() {
  return function(spec) { /*NODOC*/
    let {eventType, selector, callback, name, capture, once, canRemove} = spec;

    switch(true) {
      case !isNonEmptyString(eventType) || !jqx.IS(callback, Function):
      default:
        name = name || (!/handlers$/.test(callback.name) && callback.name) || undefined;
        capture = jqx.IS(capture, Boolean) ? capture : false;
        once = jqx.IS(once, Boolean) ? once : false;
        canRemove = isNonEmptyString(name, 4) && jqx.IS(canRemove, Boolean) ? canRemove : false;
        const { handler, signal, remove } = wrapHandlerFunction({selector, callback, canRemove, name, eventType});
        return addAndStoreListener({eventType, handler, capture, once, signal, remove, name});
    }
  };

  function wrapHandlerFunction(spec) {
    const {selector, callback, canRemove, name, eventType} = spec;
    const abortcontroller = canRemove && new AbortController();
    const remove = removeHandlerFactory({abortcontroller, name, eventType});
    const listener = !selector
      ? { handler: evt => callback(evt, evt.target, remove), remove}
      : { handler: evt => {
            const target = evt.target?.closest?.(selector);
            return target && callback(evt, jqx(target), remove);
          }, remove
        };
    if (abortcontroller) { listener.signal = abortcontroller.signal; }
    return listener;
  }

  function removeHandlerFactory(spec) {
    const {abortcontroller, name, eventType} = spec;
    return !name
      ? function() { console.error(`An anonymous listener can not be removed`); }
      : !abortcontroller
        ? function(evt) {
            console.error(`Listener for [${evt?.type || `unknown event`} with name ${
              name} not marked as removable`);
          }
        : function removeHandler() {
          abortcontroller.abort();
          const toRemove = [...handlerStore[eventType].entries()].find(([k, v]) => v.name === name);
          handlerStore[eventType].delete(toRemove[0]);
          setTimeout( () =>
            console.warn(`Listener for event type [${eventType}] with name: [${
              name}] was removed`), 100 );
          }
  }

  function addAndStoreListener(spec) {
    const {eventType, handler, capture, once, signal, remove, name} = spec;
    if (once) { return addEventListener(eventType, handler, {once}); }
    if (!handlerStore[eventType]) { handlerStore[eventType] = new Map(); }
    const delegateExists = handlerStore[eventType].has(handler) ||
      [...handlerStore[eventType].values()].find(h => (h.name || ``) === name);
    if (!delegateExists) {
      const opts = {capture: capture || getCapture(eventType), once: once || false};
      if (signal) { opts.signal = signal; }
      document.addEventListener(eventType, handler, opts);
      const stored = { name, remove, capture: capture || getCapture(eventType), }
      handlerStore[eventType].set(handler, stored);
    }
  }
}
