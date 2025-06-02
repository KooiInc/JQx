/**
  This code is classfree object oriented. No this. No prototype. No class.
  Inspired by Douglas Crockford (see https://youtu.be/XFTOG895C7c?t=2562)
 2025/05/31 overhaul ...
*/

import {
  isHtmlString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  truncateHtmlStr,
  proxify,
  addJQLStaticMethods,
  createElementFromHtmlString,
  insertPositions,
  systemLog,
  IS,
} from "./src/JQxExtensionHelpers.js";

export default addJQLStaticMethods(JQLFactory());

function JQLFactory() {
  const logLineLength = 70;

  return function JQLDefault(input, root, position = insertPositions.BeforeEnd) {
    const isVirtual = IS(root, HTMLBRElement);
    root = (!isVirtual && root && root.isJQL ? root[0] : root) || document.body;
    position = position && Object.values(insertPositions).find(pos => position === pos) ? position : undefined;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = !isRawHtml && isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml;
    let instance = {
      collection: input2Collection(input) ?? [],
      isVirtual,
      isJQL: true,
      isJQx: true,
    };

    const isRawElemCollection = isArrayOfHtmlElements(instance.collection);

    if (location.host.startsWith(`dev`)) {
      instance.params = { virtual: instance.isVirtual, jql: instance.isJQL, isRawHtml, isRawHtmlArray, isRawElemCollection };
    }

    const logStr = `input =&gt; ${
      isRawHtmlArray
        ? `"${truncateHtmlStr(input.join(`, `), logLineLength)}"`
        : !shouldCreateElements && isRawElemCollection ? `element collection [${
            truncateHtmlStr( instance.collection.map(el => `${
              IS(el, Comment, Text) ? `Comment|Text @` : ``} ${
                el?.outerHTML || el?.textContent}`).join(`, `), logLineLength)}]`
          : `"${truncateHtmlStr(input, logLineLength)}"`}`;

    if (instance.collection.length && isRawElemCollection) {
      systemLog(logStr);

      if (!isVirtual) {
        instance.collection.forEach(el => {
          if (!root.contains(el)) {
            inject2DOMTree([el], root, position);
          }
        });
      }

      return proxify(instance);
    }

    if (shouldCreateElements) {
      [input].flat().forEach(htmlStringOrComment =>
        instance.collection.push(createElementFromHtmlString(htmlStringOrComment)));

      if (instance.collection.length > 0) {
        const errors = instance.collection.filter( el => el?.dataset?.jqlcreationerror );
        instance.collection = instance.collection.filter(el => !el?.dataset?.jqlcreationerror);

        systemLog(`${logStr}`);
        systemLog(`*Created ${instance.isVirtual ? `VIRTUAL ` : ``}[${
          truncateHtmlStr(ElemArray2HtmlString(instance.collection) ||
            "sanitized: no elements remaining", logLineLength)}]`);

        if (errors.length) {
          console.error(`JQL: illegal html, not rendered: "${
            errors.reduce( (acc, el) => acc.concat(`${el.textContent}\n`), ``).trim()}"` );
        }

        if (!instance.isVirtual) {
          inject2DOMTree(instance.collection, root, position);
        }
      }

      return proxify(instance);
    }

    const forLog = setCollectionFromCssSelector(input, root, instance);
    systemLog(`input => ${forLog}`);
    return proxify(instance);
  }
}
