import jqx from "../index.js";
const handlers = {};
const shouldCaptureEventTypes = [
  `load`, `unload`, `scroll`, `focus`, `blur`, `DOMNodeRemovedFromDocument`,
  `DOMNodeInsertedIntoDocument`, `loadstart`, `progress`, `error`, `abort`,
  `load`, `loadend`, `pointerenter`, `pointerleave`, `readystatechange`];
const getCapture = eventType => !!(shouldCaptureEventTypes.find(t => t === eventType));
export default function() {
  const wrapHandlerFunction = (selector, callback) => {
    return evt => {
      const target = evt.target?.closest?.(selector);
      return target && callback(evt, jqx(target));
    };
  };

  const addAndStoreListener = (eventType, handler, capture, once, name) => {
    if (!handlers[eventType]) { handlers[eventType] = new Map(); }
    const delegateExists = handlers[eventType].has(handler) ||
      [...handlers[eventType].values()].find(h => h.name && h.name === name);

    if (!delegateExists) {
      addEventListener(eventType, handler, {capture: capture || getCapture(eventType), once});
      const handlerValue = { name: name || handler.name, capture: capture || getCapture(eventType) };
      handlers[eventType].set(handler, handlerValue);
    }
  };

  return function(spec) { /*NODOC*/
    let {eventType, selector, callback, name, capture, once} = spec;
    if (!(jqx.IS(eventType, String) || eventType?.length < 1) || !jqx.IS(callback, Function)) { return; }
    capture = jqx.IS(capture, Boolean) ? capture : false;
    const handler = !jqx.IS(selector, String) ? evt => callback(evt, evt.target) : wrapHandlerFunction(selector, callback);
    addAndStoreListener(eventType, handler, capture, once, name);
  };
};
