import jqx from "../index.js";
let handlers = {};
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

  const addListenerIfNotExisting = (eventType, capture) => {
    if (!handlers[eventType]) {
      addEventListener(eventType, metaHandler, getCapture(eventType));
    }
  };

  return (eventType, HIDselector, callback, capture = false) => { /*NODOC*/
    addListenerIfNotExisting(eventType, capture);
    const fn = !HIDselector ? callback : createHandlerForHID(HIDselector, callback);
    handlers = handlers[eventType]
      ? {...handlers, [eventType]: handlers[eventType].concat(fn)}
      : {...handlers, [eventType]: [fn]};
  };
};
