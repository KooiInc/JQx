import { popupStyling as styleRules } from "./EmbedResources.js";

export default function($) {
  if ($.node(`#jqxPopup`)) { return; }
  $.logger.log(`JQx: [JQx].Popup first call. Dialog element created.`);
  $.dialog({id: `jqxPopup`}, $.div({ id: "jqxPopupContent" })).render;
  $.editCssRules(...styleRules);
  const [popupContent, popupNode] = [$(`#jqxPopupContent`), $.node(`#jqxPopup`)];
  let currentProps = {};
  $.handle( { type: `click, keydown`, handlers: genericPopupCloseHandler, capture: true } );
  return Object.freeze({show: initPopup, removeModal});

  function initPopup(props) {
    if (popupNode.open) { return; }
    currentProps = {...props};
    let {content} = currentProps;
    return !($.IS(content, String, HTMLElement) || content?.isJQx) ? true : showPopup();
  }

  function initHidePopup() {
    if (currentProps.modal) {
      return failModalClose(currentProps.warnMessage)
    }

    return hidePopup();
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
    if ($.IS(currentProps.callback, Function)) { return currentProps.callback(currentProps.returnValue); }
    currentProps = {};
  }

  function removeModal({callback, value} = {}) {
    currentProps.returnValue = value;
    currentProps.modal = false;
    currentProps.callback = callback || currentProps.callback;
    initHidePopup();
  }

  function genericPopupCloseHandler(evt) {
    if ( Object.keys(currentProps).length < 1 || !popupNode.open ) { return; }

    if (evt.key === `Escape`) {
      evt.preventDefault();
    }

    currentProps.activeTimer && clearTimeout(currentProps.activeTimer);

    if (evt.target.closest(`#closeHandleIcon`) || !evt.target.closest(`#jqxPopupContent`)) {
      initHidePopup();
    }

    return document.activeElement.blur();
  }

  function createTimer(callback, seconds) {
    if ($.IS(callback, Function) && $.IS(seconds, Number) && seconds > 0) {
      currentProps.activeTimer = setTimeout(callback, seconds * 1000);
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
