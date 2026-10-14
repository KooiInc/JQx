import DOMPurify from "./DOMPurify.js";
import {systemLog} from "./Utilities.js";

export { sanitizeStringOrElement as cleanupHtml};

function sanitizeStringOrElement(HTMLStringOrElement) {
  const sane = DOMPurify.sanitize(HTMLStringOrElement, {
    USE_PROFILES: { html: true, svg: true },
    IN_PLACE: true,
    KEEP_CONTENT: true,
  });
  
  if (DOMPurify.removed.length > 0) {
    logSanitation(DOMPurify.removed)
  }
  
  return sane;
}

function logSanitation(removed) {
  for (let [, record] of Object.entries(removed)) {
    systemLog.warn( `JQx: sanitized input => ` +
      Object.entries(record).reduce((acc, [key, value]) => acc + `, ${key}: ${value.nodeName}`, ``)
      .slice(2));
  }
}
