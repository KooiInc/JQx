import { sanitizerConfig } from "./DOMCleanup.js";

let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};

function allowOrProhibitTag(tag, allow) {
  return allow ? sanitizerConfig.addTag(tag) : sanitizerConfig.removeTag(tag);
}

function allowOrProhibitAttribute(attribute, allow) {
  return allow ? sanitizerConfig.addAttribute(tag) : sanitizerConfig.removeAttribute(tag);
}

export default {
  allowTag(tag) { allowOrProhibitTag(tag, true); },
  prohibitTag(tag) { allowOrProhibitTag(tag, false); },
  allowAttributes(attribute) { allowOrProhibitAttribute(attribute, true); },
  prohibitAttributes(attribute) { allowOrProhibitAttribute(attribute, false); },
};
