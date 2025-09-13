import {
  after, applyStyle, assignAttrValues, before, checkProp, cleanupHtml, clearAllTimers, cloneAndDestroy, convert2Bool,
  createElementFromHtmlString, datasetKeyProxy, ElemArray2HtmlString, emptyElement, escHtml, findParentScrollDistance,
  getHandlerName, HandlerFactory, inject2DOMTree, input2Collection, insertPositions, IS, isArrayOfHtmlElements,
  isArrayOfHtmlStrings, isComment, isCommentOrTextNode, isHtmlString, isModal, isNode, isNonEmptyString, isText,
  isVisible, isWritable, logTime, maybe, PopupFactory, randomNr, randomString, resolveEventTypeParameter,
  setData, styleFactory, systemLog, tagFNFactory, tagLib, toCamelcase, toDashedNotation, truncate2SingleStr,
  truncateHtmlStr,
} from "../Resource/Common/Utilities.js"

export {
  after, applyStyle, assignAttrValues, before, checkProp, cleanupHtml, clearAllTimers, cloneAndDestroy,
  convert2Bool, createElementFromHtmlString, css, datasetKeyProxy, ElemArray2HtmlString, emptyElement, escHtml,
  ExamineElementFeatureFactory, findParentScrollDistance, getHandlerName, HandlerFactory, inject2DOMTree,
  input2Collection, insertPositions, IS, isArrayOfHtmlElements, isArrayOfHtmlStrings, isCommentOrTextNode,
  isHtmlString, isNode, isNonEmptyString, logTime, loop, maybe, PopupFactory, randomNr, randomString,
  resolveEventTypeParameter, selectedFactoryHelpers, setCollectionFromCssSelector, setData, styleFactory,
  systemLog, tagFNFactory, tagLib, toCamelcase, toDashedNotation, truncate2SingleStr, truncateHtmlStr,
};

function loop(instance, callback) {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i);
  }

  return instance;
}

function setCollectionFromCssSelector(input, root, self) {
  const selectorRoot = root !== document.body && (IS(input, String) && input.toLowerCase() !== "body") ? root : document;
  try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
  catch (err) { systemLog.warn(`JQx: Invalid CSS querySelector. [${!IS(input, String) ? `Not a string!` : input}]`); }
}

function selectedFactoryHelpers() {
  return {
    isCommentOrTextNode, isNode, isComment, isText, isHtmlString, isArrayOfHtmlElements,
    isArrayOfHtmlStrings, ElemArray2HtmlString, input2Collection, setCollectionFromCssSelector,
    cssRuleEdit: styleFactory({createWithId: `JQxStylesheet`}) };
}

function ExamineElementFeatureFactory() {
  const notApplicable = `n/a`;
  const noElements = Object.freeze({
    notInDOM: notApplicable, writable: notApplicable, modal: notApplicable, empty: true,
    open: notApplicable, visible: notApplicable, });

  return self => {
    const firstElem = self.node;

    return IS(firstElem, Node)
      ? Object.freeze({
        get writable() {
          return isWritable(firstElem);
        },
        get modal() {
          return isModal(firstElem);
        },
        get inDOM() {
          return firstElem.isConnected;
        },
        get open() {
          return firstElem.open ?? false;
        },
        get visible() {
          return isVisible(firstElem);
        },
        get disabled() {
          return firstElem.hasAttribute("readonly") || firstElem.hasAttribute("disabled");
        },
        get empty() {
          return self.collection.length < 1;
        },
        get virtual() {
          return self.isVirtual;
        }
      })
      : noElements;
  };
}

function css(el, keyOrKvPairs, value, jqx) {
  if (value && IS(keyOrKvPairs, String)) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQxClass-`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQxClass-${randomString().slice(1)}`;
  jqx.editCssRule(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
}
