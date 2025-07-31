import jqx from "../index.js";
const handlers = {};
const shouldCaptureEventTypes = [
  `load`, `unload`, `scroll`, `focus`, `blur`, `DOMNodeRemovedFromDocument`,
  `DOMNodeInsertedIntoDocument`, `loadstart`, `progress`, `error`, `abort`,
  `load`, `loadend`, `pointerenter`, `pointerleave`, `readystatechange`];
const getCapture = eventType => !!(shouldCaptureEventTypes.find(t => t === eventType));
export default () => {
  const metaHandler = evt => handlers[evt.type].forEach(handler => handler(evt));

  const createHandlerForHID = (HID, callback) => {
    return evt => {
      const target = evt.target?.closest?.(HID);
      return target && callback(evt, jqx(target));
    };
  };

  const addAndStoreListener = (eventType, handler, capture, name) => {
    if (!handlers[eventType]) { handlers[eventType] = new Map(); }
    const delegateExists = handlers[eventType].has(handler) ||
      [...handlers[eventType].values()].find(h => h.name && h.name === name);

    if (!delegateExists) {
      addEventListener(eventType, handler, capture || getCapture(eventType));
      const handlerValue = { name: name || handler.name, capture: capture || getCapture(eventType) };
      handlers[eventType].set(handler, handlerValue);
    }
  };

  return ( {eventType, selector, callback, name, capture = false} = {} ) => { /*NODOC*/
    if (!(jqx.IS(eventType, String) || eventType?.length < 1) || !jqx.IS(callback, Function)) { return; }
    eventType = eventType.toLowerCase();
    capture = jqx.IS(capture, Boolean) ? capture : false;
    const fn = !jqx.IS(selector, String) ? callback : createHandlerForHID(selector, callback);
    addAndStoreListener(eventType, fn, capture, name);
  };
};
