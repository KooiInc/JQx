import { truncate2SingleStr, IS } from "./JQLExtensionHelpers.js";
import cleanupTagInfo from "./HTMLTags.js";
import {ATTRS} from "./EmbedResources.js";
import {debugLog} from "./JQLLog.js";
import {escHtml} from "./Utilities.js";

let logElementCreationErrors2Console = true;
const attrRegExpStore = {
  data: /data-[\-\w.\p{L}]/ui, // data-* minimal 1 character after dash
  validURL: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  whiteSpace: /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g,
  notAllowedValues: /javascript|injected|noreferrer|alert|DataURL/gi
};
const logContingentErrors = elCreationInfo => {
  if (logElementCreationErrors2Console && Object.keys(elCreationInfo.removed).length) {
    const msgs = Object.entries(elCreationInfo.removed)
      .reduce( (acc, [k, v]) => [...acc, `${escHtml(k)} => ${v}`], [])
      .join(`\\000A`);
    debugLog.log(`JQL HTML creation errors: ${debugLog.isConsole ? msgs : escHtml(msgs)}`);
  }
};
const elementCheck = function(child) {
  const name = child.nodeName.toLowerCase();
  const notAllowedCustomElementNames = [
    `annotation-xml`, `color-profile`, `font-face`, `font-face-src`,
    `font-face-uri`, `font-face-format`, `font-face-name`, `missing-glyph` ];
  return /-/.test(name) && !notAllowedCustomElementNames.find(v => v === name) || cleanupTagInfo.isAllowed(name);
};
const cleanupHtml = el2Clean => {
  const elCreationInfo = {
    rawHTML: el2Clean?.parentElement?.getHTML() ?? `no html`,
    removed: { },
  }
  
  if (IS(el2Clean, HTMLElement)) {
    [...el2Clean.childNodes].forEach(child => {
      if (child?.children?.length) {
        cleanupHtml(child);
      }
      if (child?.attributes) {
        const attrStore = IS(child, SVGElement) ? ATTRS.svg : ATTRS.html;

        [...(child ?? {attributes: []}).attributes]
          .forEach(attr => {
            const name = attr.name.trim().toLowerCase();
            const value = attr.value.trim().toLowerCase().replace(attrRegExpStore.whiteSpace, ``);
            const evilValue = name === "href"
              ? !attrRegExpStore.validURL.test(value)
              : attrRegExpStore.notAllowedValues.test(value);
            const evilAttrib = name.startsWith(`data`) ? !attrRegExpStore.data.test(name) : !!attrStore[name];

            if (evilValue || evilAttrib) {
              let val = truncate2SingleStr(attr.value || `none`, 60);
              val += val.length === 60 ? `...` : ``;
              elCreationInfo.removed[`${attr.name}`] = `attribute/property (-value) not allowed, removed. Value: ${
                val}`;
              child.removeAttribute(attr.name);
            }
          });
      }
      
      const allowed = elementCheck(child);
      
      if (!allowed) {
        const tag = (child?.outerHTML || child?.textContent).trim();
        let tagValue = truncate2SingleStr(tag, 60) ?? `EMPTY`;
        tagValue += tagValue.length === 60 ? `...` : ``;
        elCreationInfo.removed[`<${child.nodeName?.toLowerCase()}>`] = `not allowed, not rendered. Value: ${
          tagValue}`;
        child.remove();
      }
    });
  }
  logContingentErrors(elCreationInfo);

  return el2Clean;
};
const emphasize = str => `***${str}***`;
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc, []);
const logElementCreationErrors = onOff => logElementCreationErrors2Console = onOff;

export { cleanupHtml, getRestricted, logElementCreationErrors, ATTRS};
