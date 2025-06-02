import {
  cleanupHtml,
  getRestricted,
  ATTRS, } from "./DOMCleanup.js";
import {truncateHtmlStr, IS, isNode} from "./JQxExtensionHelpers.js";
const insertPositions = new Proxy({
  start: "afterbegin", afterbegin: "afterbegin",
  end: "beforeend", beforeend: "beforeend",
  before: "beforebegin", beforebegin: "beforebegin",
  after: "afterend", afterend: "afterend" }, {
    get(obj, key) { return obj[String(key).toLowerCase()] ?? obj[key]; }
  });
const htmlToVirtualElement = htmlString => {
  const placeholderNode = document.createElement("div");
  placeholderNode.insertAdjacentHTML(insertPositions.end, htmlString);
  return placeholderNode.childNodes.length
    ? cleanupHtml(placeholderNode)
    : undefined;
};
const characterDataElement2DOM = (elem, root, position) => {
  if (IS(elem, Comment)) {
    return root.insertAdjacentHTML(position, `<!--${elem.data}-->`);
  }
  return root.insertAdjacentText(position, elem.data);
};
const inject2DOMTree = (
  collection = [],
  root = document.body,
  position = insertPositions.BeforeEnd ) =>
  collection.reduce( (acc, elem) => {
    const created = isNode(elem) && element2DOM(elem, root, position);
    return created ? [...acc, created] : acc;
  }, []);
const element2DOM = (elem, root = document.body, position = insertPositions.BeforeEnd) => {
  root = root?.isJQx ? root?.[0] : root;

  return IS(elem, Comment, Text) ?
    characterDataElement2DOM(elem, root, position) : root.insertAdjacentElement(position, elem);
};
const createElementFromHtmlString = htmlStr => {
  if (IS(htmlStr, Text, Comment)) {
    return htmlStr;
  }
  
  const testStr = htmlStr?.trim();
  let text = testStr?.split(/<text>|<\/text>/i) ?? [];
  
  if (text?.length) {
    text = text.length > 1 ? text.filter(v => v.length).shift() : undefined;
  }
  
  if (testStr.startsWith(`<!--`) && testStr.endsWith(`-->`)) {
    return document.createComment(htmlStr.replace(/<!--|-->$/g, ''));
  }

  if (text || !/^<(.+)[^>]+>/m.test(testStr)) {
    return document.createTextNode(text);
  }

  const nwElem = htmlToVirtualElement(htmlStr);

  if (nwElem.childNodes.length < 1) {
    return createElementFromHtmlString(`<span data-jqxcreationerror="1">${truncateHtmlStr(htmlStr, 60)}</span>`);
  }

  return nwElem.children[0];
};

export {
  getRestricted,
  createElementFromHtmlString,
  element2DOM,
  cleanupHtml,
  inject2DOMTree,
  insertPositions,
  ATTRS,
};
