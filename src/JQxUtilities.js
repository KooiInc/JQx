import {
  after, applyStyle, assignAttrValues, before, checkProp, cloneAndDestroy, datasetKeyProxy,
  ElemArray2HtmlString, emptyElement, escHtml, findParentScrollDistance, input2Collection, insertPositions,
  IS, isArrayOfHtmlElements, isArrayOfHtmlStrings, isComment, isCommentOrTextNode, isHtmlString, isModal,
  isNode, isNonEmptyString, isText, isVisible, isWritable, logTime, maybe, randomNr, randomString,
  resolveEventTypeParameter, setData, styleFactory, systemLog, tagFNFactory, toCamelcase, toDashedNotation,
  truncate2SingleStr, truncateHtmlStr, createElementFromHtmlString, inject2DOMTree, cleanupHtml,
  PopupFactory, tagLib, HandlerFactory, getHandlerName,
} from "../Resource/Common/Utilities.js"

export {
  addHandlerId, after, applyStyle, assignAttrValues, before, checkProp, cloneAndDestroy, css, datasetKeyProxy,
  ElemArray2HtmlString, emptyElement, escHtml, ExamineElementFeatureFactory, findParentScrollDistance,
  input2Collection, insertPositions, IS, isArrayOfHtmlElements, isArrayOfHtmlStrings, isCommentOrTextNode,
  isHtmlString, isNode, isNonEmptyString, logTime, loop, maybe, randomNr, randomString, resolveEventTypeParameter,
  selectedFactoryHelpers, setCollectionFromCssSelector, setData, styleFactory, systemLog, tagFNFactory,
  toCamelcase, toDashedNotation, truncate2SingleStr, truncateHtmlStr, createElementFromHtmlString, inject2DOMTree,
  cleanupHtml, PopupFactory, tagLib, HandlerFactory, getHandlerName,
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
  let errorStr = undefined;

  try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
  catch (err) { errorStr = `Invalid CSS querySelector. [${!IS(input, String) ? `Nothing valid given!` : input}]`; }
  const collectionLen = self.collection.length;
  return collectionLen < 1
    ? `CSS querySelector "${input}", output: nothing`
    : errorStr ?? `CSS querySelector "${input}", output ${collectionLen} element${collectionLen > 1 ? `s` : ``}`;
}

function  addHandlerId(instance) {
  const handleId = `anonymous_${Math.random().toString(36).slice(2)}`;
  instance.data.add({hid: handleId});
  return `[data-hid="${handleId}"]`;
}

function selectedFactoryHelpers() {
  return {
    isCommentOrTextNode, isNode, isComment, isText, isHtmlString, isArrayOfHtmlElements,
    isArrayOfHtmlStrings, ElemArray2HtmlString, input2Collection, setCollectionFromCssSelector,
    addHandlerId, cssRuleEdit: styleFactory({createWithId: `JQxStylesheet`}) };
}

function ExamineElementFeatureFactory() {
  const notApplicable = `n/a`;
  const noElements = Object.freeze({
    notInDOM: true, writable: notApplicable, modal: notApplicable, empty: true,
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
