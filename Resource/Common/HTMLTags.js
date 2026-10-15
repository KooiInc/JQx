import { sanitizerConfig } from "./DOMCleanup.js";

let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};

function allowOrProhibit(tag, allow) {
  return allow ? sanitizerConfig.addTag(tag) : sanitizerConfig.removeTag(tag);
}

export default {
  allowTag(tag) { allowOrProhibit(tag, true); },
  prohibitTag(tag) { allowOrProhibit(tag, false); }
};
