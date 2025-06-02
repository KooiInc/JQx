import { popupStyling } from "./EmbedResources.js";
import { randomString } from "./Utilities.js";

export default newPopupFactory;

function newPopupFactory($) {
  const editRule = $.createStyle(`JQxPopupCSS`);
  popupStyling.forEach( rule => editRule(rule) );
  let callbackOnClose = {};
  let isModal, modalWarning, timeout;
  const warnTemplate = $.virtual(`<div class="popup-warn">`);
  const popupContainer = $(`<div class="popupContainer">`)
    .append( $(`<span class="closeHandleIcon">`) )
    .append( $(`<div class="content">`) );
  const [closer, txtBox] = [$(`.popupContainer > .closeHandleIcon`), $( `.popupContainer > .content` )];
  const positionCloser = () => {
    if ( closer.hasClass(`popup-active`) ) {
      const {x, y, width} = txtBox.dimensions;
      closer.style({top: `${y - 12}px`, left: `${x + width - 12}px`});
    } };
  const warn = () => {
    modalWarning && $(`.popup-warn`).clear().append($(`<div>${modalWarning}</div>`));
    txtBox.addClass(`popup-warn-active`); };
  const removeModal = () => { isModal = false; remove(closer.first()); };
  const timed = (seconds, callback) => timeout = setTimeout( () => remove(closer[0]), +seconds * 1000 );
  $.delegate(`click`, `.popupContainer, .closeHandleIcon`, evt => remove(evt.target));
  $.delegate(`click`, `.popupContainer .content`, (_, self) => isModal && self.removeClass(`popup-warn-active`));
  $.delegate(`resize`, positionCloser);

  return {
    show: createAndShowPupup,
    create: (message, isModalOrCallback, modalCallback, modalWarning) => { /*legacy*/
      const isModal = $.IS(isModalOrCallback, Boolean) ? isModalOrCallback : false;
      createAndShowPupup({
        content: message, modal: isModal,
        callback: isModal ? modalCallback : isModalOrCallback, warnMessage: modalWarning, }); },
    createTimed: (message, closeAfter, callback) => /*legacy*/
      createAndShowPupup({content: message, closeAfter, callback}),
    removeModal,
  };
  
  function createAndShowPupup( { content, modal, closeAfter, callback, warnMessage } ) {
    if (content) {
      content = $.IS(content, Node) ? jqx(content) : content;
      clearTimeout(timeout);
      isModal = modal ?? false;
      modalWarning = $.IS(warnMessage, String) && `${warnMessage?.trim()}`.length || warnMessage?.isJQx
        ? warnMessage : undefined;
      txtBox.clear().append(content.isJQx ? content : $(`<div>${content}</div>`));
      isModal && warnMessage && txtBox.append(warnTemplate.duplicate());
      popupContainer.addClass(`popup-active`);
      
      if ($.IS(callback, Function)) {
        const tmpId = randomString();
        popupContainer.data.set( {callbackId:  tmpId} );
        callbackOnClose[tmpId] = callback;
      }

      if (!isModal) {
        if ($.IS(+closeAfter, Number)) {
          const callbackId = popupContainer.data.get(`callbackId`);
          const callback = callbackId && callbackOnClose[callbackId];
          timed(closeAfter, callback);
        }
        closer.addClass(`popup-active`);
        positionCloser();
      }

      return true;
    }
    return console.error(`Popup creation needs at least some text to show`);
  }

  function remove(origin) {
    if (!isModal && !origin.closest(`.content`)) {
      clearTimeout(timeout);
      txtBox.clear();
      const callbackId = popupContainer.data.get(`callbackId`);
      popupContainer.data.remove(`callbackId`);
      $(`.popup-active`).removeClass(`popup-active`);
      const cb = callbackId && callbackOnClose[callbackId];
      if ($.IS(cb, Function)) { cb(); }
      if (callbackId) { delete callbackOnClose[callbackId]; }
      modalWarning = ``;
      return;
    }
    return isModal && warn();
  }
}
