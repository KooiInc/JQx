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
    ADD_ATTR: [],
    FORCE_BODY: false,
    SANITIZE_DOM: true,
  };
  let forDebug = false;
  
  return {
    get current() { return baseConfig; },
    get notInPlaceConfig() {
      return {...baseConfig, IN_PLACE: false};
    },
    get forDebug() { return forDebug; },
    set forDebug(value) { forDebug = value; },
    
    addTag(tagName) {
      addRemoveHelper(tagName, `ADD_TAGS`, `FORBID_TAGS`);
    },
    removeTag(tagName) {
      addRemoveHelper(tagName, `FORBID_TAGS`, `ADD_TAGS`);
    },
    addAttribute(attributeName) {
      addRemoveHelper(attributeName, `ADD_ATTR`, `FORBID_ATTR`);
    },
    removeAttribute(attributeName) {
      addRemoveHelper(attributeName, `FORBID_ATTR`, `ADD_ATTR`);
    },
  }
  
  function addRemoveHelper(namely, pushTo, removeFrom) {
    baseConfig[pushTo].push(namely);
    baseConfig[pushTo] = [...new Set(baseConfig[pushTo])];
    baseConfig[removeFrom].includes(namely) &&
    baseConfig[removeFrom].splice( baseConfig[removeFrom].findIndex(t => t === namely), 1);
  }
}

function sanitizeNow(HTMLStringOrElement, notInPlace) {
  const configClean = notInPlace || typeof HTMLStringOrElement === `string` ? config.notInPlaceConfig : config.current;
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
    systemLog.log(`JQX: sanitition NOT in place`);
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
      ? value.outerHTML
      : truncate(value.outerHTML.replace(/\n/g, ``).replace(/ {2,}/g, ` `), {at: 45, wordBoundary: true});
  }
  
  return value.nodeName;
}

function logSanitation(removed, initial) {
  initial = getHtmlOrNodeNameString(initial);
  
  for (let [, record] of Object.entries(removed)) {
    let isComment;
    const warnString = `JQx: sanitized input => ` +
      Object.entries(record).reduce((acc, [key, value]) => {
          return acc + `, ${key} ${value.nodeName} ${/from/i.test(key) ? `(${initial.trim()})` : ``}`;
        }, ``).slice(2).replace(/ , /g, `, `);
     systemLog.error(warnString);
  }
}
