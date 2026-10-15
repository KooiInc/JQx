import DOMPurify from "./DOMPurify.js";
import {systemLog, truncate} from "./Utilities.js";
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
    ADD_ATTR: [`_target`, `target`, `data-is-deprecated`],
    FORCE_BODY: true,
  };
  let forDebug = false;
  
  return {
    get current() { return baseConfig; },
    get forDebug() { return forDebug; },
    set forDebug(value) { forDebug = value; },
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

function sanitizeNow(HTMLStringOrElement, notInPlace) {
  let configClean = config.current;
  
  if (notInPlace) {
    configClean = {...config};
    config.IN_PLACE = false;
  }
  
  const sane = DOMPurify.sanitize(HTMLStringOrElement, configClean);
  
  if (DOMPurify.removed.length > 0) {
    logSanitation(DOMPurify.removed, HTMLStringOrElement);
  }
  
  return sane;
}

function sanitizeStringOrElement(HTMLStringOrElement) {
  try {
    return sanitizeNow(HTMLStringOrElement);
  } catch(err) {
    return sanitizeNow(HTMLStringOrElement, true);
  }
}

function getHtmlOrNodeNameString(value) {
  if (typeof value === "string") {
    return value;
  }
  
  if (value.outerHTML) {
    const html = value.outerHTML;
    return config.forDebug
      ? value.outerHTML : truncate(value.outerHTML, {at: 45, wordBoundary: true});
  }
  
  return value.nodeName;
}

function logSanitation(removed, initial) {
  initial = getHtmlOrNodeNameString(initial);
  
  for (let [, record] of Object.entries(removed)) {
    let isComment;
    const warnString = `JQx: sanitized input => ` +
      Object.entries(record).reduce((acc, [key, value]) => {
          return acc + `, ${key} ${value.nodeName} ${/from/i.test(key) ? `(${initial.trim()})` : `no value`}`;
        }, ``).slice(2).replace(/ , /g, `, `);
     systemLog.error(warnString);
  }
}
