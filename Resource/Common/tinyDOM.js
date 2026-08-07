// Standalone available @ https://www.npmjs.com/package/tinydom-es
// Src/helpers.js
var checkType = typeCheckFactory();
var maybe = maybeFactory();
var converts = { html: `innerHTML`, text: `textContent`, class: `className` };
function typeCheckFactory() {
  const collate = new Intl.Collator(`en`, { sensitivity: "base" });
  const nameOf = (type2Check) => {
    return typeof type2Check?.constructor === `function` ? type2Check?.name || type2Check?.constructor?.name : typeof type2Check === `string` ? type2Check : typeof type2Check;
  };
  const isNothing = (obj) => [null, void 0, Infinity, NaN].some((v) => v === obj);
  function checkSingleType(obj, type2Check) {
    switch (true) {
      case (type2Check !== obj && (isNothing(obj) || type2Check === Number && (Number.isNaN(obj) || !Number.isFinite(obj)))):
        return false;
      default:
        const [objName, typeName] = [nameOf(obj), nameOf(type2Check)];
        return obj?.[Symbol.proxy] === type2Check || type2Check === obj?.name || 0 === collate.compare(objName, typeName) || 0 === collate.compare(obj.constructor?.name, type2Check?.name) || obj.constructor?.name === type2Check || objName === type2Check || 0 === collate.compare(Object.prototype.toString.call(obj), `[object ${typeName}]`);
    }
  }
  return function checkType2(obj, ...type2Check) {
    if (Array.isArray(type2Check) && type2Check.length > 1) {
      for (const chkType of type2Check) {
        if (checkSingleType(obj, chkType)) {
          return true;
        }
      }
      return false;
    }
    return checkSingleType(obj, type2Check?.[0]);
  };
}
function ucFirst([first, ...theRest]) {
  return `${first.toUpperCase()}${theRest.join(``)}`;
}
function toDashedNotation(str2Convert) {
  return str2Convert.replace(/[A-Z]/g, (a) => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
}
function toCamelcase(str2Convert) {
  return checkType(str2Convert, String) ? str2Convert.toLowerCase().split(`-`).map((str, i) => i && `${ucFirst(str)}` || str).join(``) : str2Convert;
}
function maybeFactory() {
  const errFn = (err) => void 0;
  return function({ trial, whenError = errFn } = {}) {
    try {
      return trial();
    } catch (err) {
      return whenError(err);
    }
  };
}
function cloneExact(elementFunctionCollection2) {
  return Object.fromEntries(
    Object.entries(Object.getOwnPropertyDescriptors(elementFunctionCollection2))
  );
}
function cleanupProps(props) {
  if (Object.keys(props).length < 1) {
    return { assignable: {}, specials: [...Array(3)] };
  }
  const specials = retrieveSpecialProps(props);
  Object.keys(props).forEach((key) => {
    const keyCI = key.toLowerCase();
    keyCI in converts && (props[converts[keyCI]] = props[key]) && delete props[key];
  });
  return { assignable: props, specials };
}
function retrieveSpecialProps(props) {
  props = checkType(props, Object) && props || void 0;
  if (!props) {
    return Array(3);
  }
  const data = Object.entries(props.data ?? {});
  const attributes = Object.entries(props.attributes ?? {});
  const classList = props.class?.split(/[ ,]/).map((v) => v.trim()).filter((v) => v.length > 1);
  delete props.data;
  delete props.attributes;
  delete props.class;
  return [data, attributes, classList];
}
function cleanupComment(initial) {
  return initial?.constructor === Comment ? initial?.textContent : String(initial);
}
function isComment(tag) {
  return /comment/i.test(tag);
}
function containsHTML(str, tag) {
  return !isComment(tag) && checkType(str, String) && /<.*>|&[#|0-9a-z]+[^;];/i.test(str);
}
function validateElementTagName(tagName) {
  tagName = tagName.toLowerCase();
  return typeof tagName === `string` && tagName.length > 0 && /^[a-z]/.test(tagName) && /^[a-z0-9-]+$/gi.test(tagName);
}
function validateTag(name, customElementRegistry2, createElement2) {
  return validateElementTagName(name) && (name in customElementRegistry2 || !checkType(createElement2(name), HTMLUnknownElement));
}

// Src/tinyDOM.js
var elementFunctionCollection = Object.create(null, {});
var customElementRegistry = Object.create(null, {});
var tagFunctionError = (tag) => {
  console.error(`tinyDOM error: "${tag}" is not a valid HTML tag`);
  return void 0;
};
var tinyDOM_default = tinyDOM();
function tinyDOM() {
  return Object.seal(new Proxy(elementFunctionCollection, proxyTraps()));
}
function proxyTraps() {
  return {
    get(tagFns, key) {
      const tag = String(key);
      switch (true) {
        case tag in tagFns:
          return tagFns[tag];
        case validateTag(tag, customElementRegistry, createElement):
          return createTagFunctionProperty({ tag, key });
        default:
          return createTagFunctionProperty({ tag, key, isError: true });
      }
    },
    set(tagFns, key, value) {
      if (key === `setError` && typeof value === "function") {
        tagFunctionError = value;
      }
      return true;
    },
    enumerable: false,
    configurable: false
  };
}
function createTagFunctionProperty({ tag, key, custom, debug = false, isError = false } = {}) {
  let unsealedElementFunctionCollection = cloneExact(elementFunctionCollection);
  if (isError) {
    Object.defineProperty(unsealedElementFunctionCollection, tag, {
      get() {
        return (_) => tagFunctionError(key) ?? ``;
      }
    });
    return reSeal(unsealedElementFunctionCollection, tag);
  }
  if (tag.includes(`-`)) {
    const [dashed, camel] = tag.includes(`-`) ? [tag, toCamelcase(tag)] : [toDashedNotation(tag), tag];
    customElementRegistry[dashed] = dashed;
    customElementRegistry[camel] = dashed;
    custom = camel;
  }
  if (!!custom) {
    Object.defineProperty(unsealedElementFunctionCollection, custom, {
      get() {
        return tag2FN(tag);
      }
    });
  }
  Object.defineProperty(unsealedElementFunctionCollection, tag, {
    get() {
      return tag2FN(tag);
    }
  });
  return reSeal(unsealedElementFunctionCollection, tag);
}
function reSeal(unsealedCollection, tag) {
  elementFunctionCollection = Object.seal(new Proxy(unsealedCollection, proxyTraps()));
  return elementFunctionCollection[tag];
}
function processNext(root, next, tagName) {
  next = next?.isJQx && next.node || (checkType(next, Number) ? String(next) : next);
  return maybe({
    trial: (_) => containsHTML(next) ? root.insertAdjacentHTML(`beforeend`, next) : root.append(next),
    whenError: (err) => console.info(`${tagName} not created, reason
`, err)
  });
}
function tagFN(tagName, initial, ...nested) {
  const elem = retrieveElementFromInitial(initial, tagName);
  nested?.forEach((arg) => processNext(elem, arg, tagName));
  return elem;
}
function retrieveElementFromInitial(initial, tag) {
  initial = isComment(tag) ? cleanupComment(initial) : initial?.isJQx ? initial.node : initial;
  switch (true) {
    case checkType(initial, String):
      return createElement(tag, containsHTML(initial, tag) ? { html: initial } : { text: initial });
    case initial instanceof Node:
      return createElementAndAppend(tag, initial);
    default:
      return createElement(tag, initial);
  }
}
function createElementAndAppend(tag, element2Append) {
  const elem = createElement(tag);
  elem.append(element2Append);
  return elem;
}
function assignSpecialProps(specialProps, element) {
  const [data, attributes, classList] = specialProps;
  data?.length && data.forEach(([key, value]) => element.dataset[key] = value);
  attributes?.length && attributes.forEach(([key, value]) => element.setAttribute(key, value));
  classList?.forEach((value) => element.classList.add(value));
}
function createElement(tagName, props) {
  props = props || {};
  const { assignable, specials } = cleanupProps(props);
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    assignable
  );
  assignSpecialProps(specials, elem);
  return elem;
}
function tag2FN(tagName) {
  tagName = customElementRegistry[tagName] ?? tagName;
  return (initial, ...args) => tagFN(tagName, initial, ...args);
}
export {
  tinyDOM_default as default
};
