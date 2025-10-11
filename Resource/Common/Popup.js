import { popupStyling as styleRules } from "./EmbedResources.js";

export default function($) {
  if ($.node(`#jqxPopup`)) { return; }
  $.logger.log(`JQx: [JQx].Popup first call. Dialog element created.`);
  $.dialog({id: `jqxPopup`}, $.div({ id: "jqxPopupContent" })).render;
  $.editCssRules(...styleRules);
  let timers = [];
  const [popupContent, popupNode] = [$(`#jqxPopupContent`), $.node(`#jqxPopup`)];
  let currentProps = {};
  $.handle( {
    type: `click, cancel`,
    handlers: genericPopupCloseHandler,
    name: "genericPopupCloseHandler",
    capture: true,
    about: "A generic handler for JQx popups"} );
  return Object.freeze({show: initPopup, remove: initHidePopup, removeModal});

  function initPopup(props) {
    if (popupNode.open) {
      switch(true) {
        case isCurrent(props): return;
        default:
          initHidePopup();
          return setTimeout(() => initPopup(props), 200);
      }
    }
    
    currentProps = {...props};
    let {content} = currentProps;
    return !($.IS(content, String, HTMLElement) || content?.isJQx) ? true : showPopup();
  }

  function initHidePopup() {
    if (currentProps.modal) {
      return failModalClose(currentProps.warnMessage);
    }

    return hidePopup();
  }
  
  function isCurrent(props) {
    for (const [key, value] of Object.entries(currentProps)) {
      if (value !== props[key]) { return false; }
    }
    return true;
  }
  
  function showPopup() {
    popupContent.clear();
    let {content, modal, closeAfter} = currentProps;
    modal = $.IS(modal, Boolean) ? modal : false;
    const closerIcon = modal ? "" : $.div({ id: "closeHandleIcon"});
    popupContent.append(closerIcon, $.IS(content, String) ? $.div(content) : content);
    popupNode.showModal();
    if (!modal && $.IS(closeAfter, Number)) { createTimer(initHidePopup, closeAfter); }
  }

  function hidePopup() {
    popupNode.close(currentProps.returnValue);
    clearTimers();
    if ($.IS(currentProps.callback, Function)) {
      return timers.push(setTimeout(() => currentProps.callback(currentProps.returnValue), 200));
    }
    currentProps = {};
  }
  
  function clearTimers() {
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
  }

  function removeModal({callback, value} = {}) {
    currentProps.returnValue = value;
    currentProps.modal = false;
    currentProps.callback = callback || currentProps.callback;
    initHidePopup();
  }

  function genericPopupCloseHandler({evt}) {
    if ( Object.keys(currentProps).length < 1 || !popupNode.open ) { return; }
    
    if (evt.type === `cancel` && currentProps.modal) { evt.preventDefault(); }
    
    if (evt.target.closest(`#closeHandleIcon`) || !evt.target.closest(`#jqxPopupContent`)) {
      currentProps.activeTimer && clearTimeout(currentProps.activeTimer);
      return initHidePopup();
    }
  }

  function createTimer(callback, seconds) {
    if ($.IS(callback, Function) && $.IS(seconds, Number) && seconds > 0) {
      clearTimers();
      timers.push(setTimeout(callback, seconds * 1000));
    }
  }

  function failModalClose(warnMessage) {
    if (!$.IS(warnMessage, String, HTMLElement, Proxy)) { return; }
    let modalWarningBox = popupContent.find$(`.warn`);
    // note: fall through is intentional.
    switch(true) {
      case modalWarningBox.is.empty: modalWarningBox = $.div({class: `warn`}, warnMessage);
      default: popupContent.append(modalWarningBox.addClass(`active`));
        createTimer(() => popupContent.find$(`.warn`).removeClass(`active`), 2);
    }
  }
}
