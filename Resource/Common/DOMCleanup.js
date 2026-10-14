import DOMPurify from "./DOMPurify.js";
import {systemLog} from "./Utilities.js";
const config = sanitizerConfigFactory();
export { sanitizeStringOrElement as cleanupHtml, config as sanitizerConfig};

function sanitizerConfigFactory() {
  let baseConfig = {
    USE_PROFILES: { html: true, svg: true },
    IN_PLACE: true,
    KEEP_CONTENT: true,
    ADD_TAGS: [],
    FORBID_TAGS: [],
    FORBID_ATTR: [],
    ADD_ATTR: [`_target`, `target`],
    FORCE_BODY: true,
  };
  
  return {
    get current() { return baseConfig; },
    addTag(tagName) {
      baseConfig.ADD_TAGS.push(tagName);
      baseConfig.ADD_TAGS = [...new Set(baseConfig.ADD_TAGS)];
      
      baseConfig.FORBID_TAGS.includes(tagName) &&
         baseConfig.FORBID_TAGS.splice( baseConfig.FORBID_TAGS.findIndex(t => t === tagName), 1);
    },
    removeTag(tagName) {
      baseConfig.FORBID_TAGS.push(tagName);
      baseConfig.FORBID_TAGS = [...new Set(baseConfig.FORBID_TAGS)];
      
      baseConfig.ADD_TAGS.includes(tagName) &&
        baseConfig.ADD_TAGS.splice(baseConfig.ADD_TAGS.findIndex(t => t === tagName), 1);
    },
    addAttribute(attributeName) {
      baseConfig.ADD_ATTRIBUTE = baseConfig.ADD_ATTRIBUTE || []
      baseConfig.ADD_ATTRIBUTE.push(tagName);
    },
  }
}

function sanitizeStringOrElement(HTMLStringOrElement) {
  const sane = DOMPurify.sanitize(HTMLStringOrElement, config.current);
  
  if (DOMPurify.removed.length > 0) {
    logSanitation(DOMPurify.removed, HTMLStringOrElement);
  }
  
  return sane;
}

function getHtmlOrNodeNameString(value) {
  if (typeof value === "string") {
    return value;
  }
  
  if (value.outerHTML) {
    const html = value.outerHTML;
    return value.outerHTML.slice(0, 60) + (html.length > 60 ? `...` : ``);
  }
  
  return value.nodeName;
}

function logSanitation(removed, initial) {
  initial = getHtmlOrNodeNameString(initial);
  
  for (let [, record] of Object.entries(removed)) {
    let isComment;
    const warnString = `JQx: sanitized input => ` +
      Object.entries(record).reduce((acc, [key, value]) => {
          isComment = isComment || value.nodeName === `#comment`;
          
          return value.nodeName === `#comment`
            ? acc + initial : acc + `, ${key}: ${value.nodeName} ${/from/i.test(key) ? `(${initial})` : ``}`;
        }, ``).slice(2);
    !isComment && systemLog.error(warnString);
  }
}
