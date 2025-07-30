import { popupStyling as styleRules } from "./EmbedResources.js";

export default function($) {
  if (!$(`#jqxPopup`).isEmpty()) { return; }

  $.dialog({id: `jqxPopup`}, $.div({ id: "jqxPopupContent" })).render;
  $.editCssRules(...styleRules);
  const [popupContent, popupNode] = [$(`#jqxPopupContent`), $.node(`#jqxPopup`)];
  let currentProps = {};
  [`click`, `keydown`].forEach(evtType =>
    document.addEventListener(evtType, genericPopupCloseHandler, true));
  return Object.freeze({show: initPopup, removeModal});

  function initPopup(props) {
    if (popupNode.open) { return; }
    currentProps = {...props};
    let {content} = currentProps;
    return !($.IS(content, String, HTMLElement) || content?.isJQx) ? true : showPopup();
  }

  function initHidePopup() {
    return currentProps.modal ? failModalClose(currentProps.warnMessage) : hidePopup();
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
    return $.IS(currentProps.callback, Function) ? currentProps.callback(currentProps.returnValue) : true;
  }

  function removeModal({callback, value} = {}) {
    currentProps.returnValue = value;
    currentProps.modal = false;
    currentProps.callback = callback || currentProps.callback;
    initHidePopup();
  }

  function genericPopupCloseHandler(evt) {
    currentProps.activeTimer && clearTimeout(currentProps.activeTimer);
    const escPressed = evt.key === `Escape`;
    escPressed && evt.preventDefault();
    if (escPressed || evt.target.closest(`#closeHandleIcon`) ||
      (evt.type !== `keydown` && !evt.target.closest(`#jqxPopupContent`))) { initHidePopup() }
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
    switch(true) {
      case modalWarningBox.is.empty: modalWarningBox = $.div({class: `warn`}, warnMessage);
      default: popupContent.append(modalWarningBox.addClass(`active`));
        createTimer(() => popupContent.find$(`.warn`).removeClass(`active`), 2);
    }
  }
}
