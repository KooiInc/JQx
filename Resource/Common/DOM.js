import { cleanupHtml, getRestricted, } from "./DOMCleanup.js";
import {ATTRS, IS, insertPositions, isNode, truncateHtmlStr} from "./Utilities.js";

export {
  getRestricted, createElementFromHtmlString, element2DOM,
  cleanupHtml, inject2DOMTree, ATTRS
};

function htmlToVirtualElement(htmlString) {
  const placeholderNode = document.createElement("div");
  placeholderNode.insertAdjacentHTML(insertPositions.end, htmlString);
  return placeholderNode.childNodes.length
    ? cleanupHtml(placeholderNode)
    : undefined;
}

function characterDataElement2DOM(elem, root, position) {
  switch(true) {
    case IS(elem, Comment): return root.insertAdjacentHTML(position, `<!--${elem.data}-->`);
    case IS(elem, Text): return root.insertAdjacentText(position, elem.data || elem.textContent);
    default: return;
  }
}

function inject2DOMTree( collection = [], root = document.body, position = insertPositions.BeforeEnd ) {
  position = position || insertPositions.BeforeEnd;
  root = root?.isJQx ? root.node : root || document.body;
  return collection.reduce( (acc, elem) => {
    const created = isNode(elem) && element2DOM(elem, root, position);
    return created ? [...acc, created] : acc;
  }, []);
}

function element2DOM(elem, root = document.body, position = insertPositions.BeforeEnd) {
  position = position || insertPositions.BeforeEnd;
  root = root?.isJQx ? root?.[0] : root;

  return IS(elem, Comment, Text)
    ? characterDataElement2DOM(elem, root, position)
    : IS(elem, HTMLElement) ? root.insertAdjacentElement(position, elem) : undefined;
}

function createElementFromHtmlString(htmlStrOrText) {
  if (IS(htmlStrOrText, Text, Comment)) {
    return htmlStrOrText;
  }
  
  const testStr = htmlStrOrText?.trim();
  let text = testStr?.split(/<text>|<\/text>/i) ?? [];

  if (text?.length) {
    text = text.length > 1 ? text.filter(v => v.length).shift() : undefined;
  }

  if (testStr.startsWith(`<!--`) && testStr.endsWith(`-->`)) {
    return document.createComment(htmlStrOrText.replace(/<!--|-->$/g, ''));
  }
  
  if (!!text || (IS(testStr, String) && !/^<(.+)[^>]+>/m.test(testStr))) {
    return document.createTextNode(text ?? testStr);
  }

  const nwElem = htmlToVirtualElement(htmlStrOrText);

  if (nwElem.childNodes.length < 1) {
    return createElementFromHtmlString(`<span data-jqxcreationerror="1">${truncateHtmlStr(htmlStrOrText, 60)}</span>`);
  }

  return nwElem.children[0];
}
