import { proxify, addJQxStaticMethods } from "./JQxCreatorFactory.js";
import {
  isHtmlString, isArrayOfHtmlStrings, isArrayOfHtmlElements,
  input2Collection, setCollectionFromCssSelector, IS, systemLog,
  insertPositions, inject2DOMTree, createElementFromHtmlString
} from "./JQxUtilities.js";

export default addJQxStaticMethods(JQxMainFactory());

function JQxMainFactory() {
  const logLineLength = 70;
  
  return function(input, root, position = insertPositions.BeforeEnd) {
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
    
    if (instance.collection.length && isRawElemCollection) {
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
        const elemsCreated = instance.collection.map(el => `${String(el.constructor).split(/function|\(/)[1].trim()}`);
        const multiple = elemsCreated.length > 1;
        const collectionLog = instance.collection.length
          ? elemsCreated.join(`, `)
          : "sanitized: no elements remaining";
        
        systemLog.log(`JQx: created ${instance.isVirtual ? `(virtual)` : ``} instance from ` +
          `${multiple ? `array of ` : ``}HTML string${multiple ? `s` : ``} (${collectionLog})`);
        
        if (!instance.isVirtual) {
          inject2DOMTree(instance.collection, root, position);
        }
      }
      
      return proxify(instance);
    }
    
    const forLog = setCollectionFromCssSelector(input, root, instance);
    input !== null && systemLog.log(`JQx: input => ${forLog}`);
    return proxify(instance);
  }
}
