import { allTags, } from "./EmbedResources.js";
import { IS } from "./Utilities.js";

let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};

function allowOrProhibit(tag, allow, isWebComponent) {
  allTags[tag] = allow;
}

export default {
  tagsRaw: allTags,
  allowUnknownHtmlTags,
  isAllowed(elem) {
    if (lenient) { return true; }
    const WCName = IS(elem, String) ? elem : elem?.nodeName || `none`
    const nodeName = IS(elem, String) ? elem.toLowerCase() : elem?.nodeName.toLowerCase() || `none`;
    return nodeName === `#text` || allTags[WCName] || !!allTags[nodeName];
  },
  allowTag: (tag) => {
    allowOrProhibit(tag, true);
},
  prohibitTag: tag => allowOrProhibit(tag, false),
};
