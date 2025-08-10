import { allTags } from "./EmbedResources.js";
import { IS } from "./Utilities.js";
let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};
export default {
  tagsRaw: allTags,
  allowUnknownHtmlTags,
  isAllowed(elem) {
    if (lenient) { return true; }
    const nodeName = IS(elem, String) ? elem.toLowerCase() : elem?.nodeName.toLowerCase() || `none`;
    return nodeName === `#text` || !!allTags[nodeName];
  },
  allowTag: tag2Allow => allTags[tag2Allow.toLowerCase()] = true,
  prohibitTag: tag2Prohibit => allTags[tag2Prohibit.toLowerCase()] = false,
};
