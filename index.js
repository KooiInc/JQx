/**
  This code is classfree object oriented. No this. No prototype. No class.
  Inspired by Douglas Crockford (see https://youtu.be/XFTOG895C7c?t=2562)
*/

import { proxify, addJQxStaticMethods } from "./src/JQxFactory.js";
import { inject2DOMTree, createElementFromHtmlString } from "./src/DOM.js";
import {
  isHtmlString, truncateHtmlStr, isArrayOfHtmlStrings, isArrayOfHtmlElements,
  ElemArray2HtmlString, input2Collection, setCollectionFromCssSelector,
  IS, systemLog, insertPositions } from "./src/Utilities.js";

export default addJQxStaticMethods(JQxFactory());

function JQxFactory() {
  const logLineLength = 70;

  return function JQx(input, root, position = insertPositions.BeforeEnd) {
    if (input?.isJQx) { return input; }
    const isVirtual = IS(root, HTMLBRElement);
    root = (!isVirtual && root && root.isJQx ? root[0] : root) || document.body;
    position = position && Object.values(insertPositions).find(pos => position === pos) ? position : undefined;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = !isRawHtml && isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml;

    let instance = {
      collection: input2Collection(input) ?? [],
      isVirtual,
      isJQx: true,
    };

    const isRawElemCollection = isArrayOfHtmlElements(instance.collection);

    const logStr = `input =&gt; ${
      isRawHtmlArray
        ? `"${truncateHtmlStr(input.join(`, `), logLineLength)}"`
        : !shouldCreateElements && isRawElemCollection ? `element collection [${
            truncateHtmlStr( instance.collection.map(el => `${
              IS(el, Comment, Text) ? `Comment|Text @` : ``} ${
                el?.outerHTML || el?.textContent}`).join(`, `), logLineLength)}]`
          : `"${truncateHtmlStr(input, logLineLength)}"`}`;

    if (instance.collection.length && isRawElemCollection) {
      systemLog.log(logStr);

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
        const errors = instance.collection.filter( el => el?.dataset?.jqxcreationerror );
        instance.collection = instance.collection.filter(el => !el?.dataset?.jqxcreationerror);

        systemLog.log(`${logStr}`);
        systemLog.log(`*Created ${instance.isVirtual ? `VIRTUAL ` : ``}[${
          truncateHtmlStr(ElemArray2HtmlString(instance.collection).trim() ||
            "sanitized: no elements remaining", logLineLength)}]`);

        if (!instance.isVirtual) {
          inject2DOMTree(instance.collection, root, position);
        }
      }

      return proxify(instance);
    }

    const forLog = setCollectionFromCssSelector(input, root, instance);
    systemLog.log(`input => ${forLog}`);
    return proxify(instance);
  }
}
