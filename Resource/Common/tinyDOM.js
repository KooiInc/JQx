const converts = { html: `innerHTML`, text: `textContent`,  class: `className` };
const maybe = maybeFactory();
let elementFunctionCollection = {};
const customElementRegistry = {};
const checkType = typeCheckFactory();
let tagFunctionError = tag => {
  console.error(`tinyDOM error: "${tag}" is not a valid HTML tag`);
  return undefined;
};

export default tinyDOM();

function tinyDOM() {
  return Object.freeze(new Proxy(elementFunctionCollection, getProxy()));
}

function getProxy() {
  return {
    get(tagFns, key) {
      const tag = String(key);
      
      switch(true) {
        case tag in tagFns: return tagFns[tag];
        case validateTag(tag): return createTagFunctionProperty({tag, key});
        default: return createTagFunctionProperty({tag, key, isError: true});
      }
    },
    set(tagFns, key, value) {
        if (key === `setError` && typeof value === 'function') { tagFunctionError = value; }
        return true;
      },
    enumerable: false, configurable: false
  };
}

function createTagFunctionProperty({tag, key, custom, debug = false, isError = false} = {}) {
  let unfrozenElementFunctionCollection = cloneExact();
  
  if (isError) {
    Object.defineProperty(unfrozenElementFunctionCollection, tag, {
      get() { return _ => tagFunctionError(key) ?? ``; }
    } );
    
    return reFreeze(unfrozenElementFunctionCollection, tag);
  }
  
  if (tag.includes(`-`)) {
    const [dashed, camel] = tag.includes(`-`) ? [tag, toCamelcase(tag)] : [toDashedNotation(tag), tag];
    customElementRegistry[dashed] = dashed;
    customElementRegistry[camel] = dashed;
    custom = camel;
  }
  
  if (!!custom) {
    Object.defineProperty(unfrozenElementFunctionCollection, custom, {
      get() { return tag2FN(tag); }
    });
  }
  
  Object.defineProperty(unfrozenElementFunctionCollection, tag, {
    get() { return tag2FN(tag); }
  } );
  
  return reFreeze(unfrozenElementFunctionCollection, tag);
}

function reFreeze(unfrozenCollection, tag) {
  elementFunctionCollection = Object.freeze(new Proxy(unfrozenCollection, getProxy()));
  elementFunctionCollection[Symbol.for.proxy] = `Proxy (Object)`;
  return elementFunctionCollection[tag];
}

function cloneExact() {
  return Object.fromEntries(
    Object.entries(Object.getOwnPropertyDescriptors(elementFunctionCollection))
  );
}

function processNext(root, next, tagName) {
  next = next?.isJQx && next.node || (checkType(next, Number) ? String(next) : next);
  
  return maybe({
    trial: _ => containsHTML(next) ? root.insertAdjacentHTML(`beforeend`, next) : root.append(next),
    whenError: err => console.info(`${tagName} not created, reason\n`, err)
  });
}

function tagFN(tagName, initial, ...nested) {
  const elem = retrieveElementFromInitial(initial, tagName);
  nested?.forEach(arg => processNext(elem, arg, tagName));
  return elem;
}

function retrieveElementFromInitial(initial, tag) {
  initial = isComment(tag) ? cleanupComment(initial) : initial?.isJQx ? initial.node : initial;
  
  switch(true) {
    case checkType(initial, String): return createElement(tag, containsHTML(initial, tag) ? {html: initial} : {text: initial});
    case initial instanceof Node: return createElementAndAppend(tag, initial);
    default: return createElement(tag, initial);
  }
}

function createElementAndAppend(tag, element2Append) {
  const elem = createElement(tag);
  elem.append(element2Append);
  return elem;
}

function cleanupProps(props) {
  if ( Object.keys(props).length < 1 ) { return {assignable: {}, specials: [...Array(3)] }; }
  
  const specials = retrieveSpecialProps(props);
  Object.keys(props).forEach( key => {
    const keyCI = key.toLowerCase();
    keyCI in converts && (props[converts[keyCI]] = props[key]) && delete props[key]; } );
  
  return { assignable: props, specials };
}

function retrieveSpecialProps(props) {
  props = checkType(props, Object) && props || undefined;
  
  if (!props) { return Array(3); }
  
  const data = Object.entries(props.data ?? {});
  const attributes = Object.entries(props.attributes ?? {});
  const classList = props.class?.split(/[ ,]/).map(v => v.trim()).filter(v => v.length > 1);
  delete props.data;
  delete props.attributes;
  delete props.class;
  
  return [data, attributes, classList];
}

function assignSpecialProps(specialProps, element) {
  const [data, attributes, classList] = specialProps;
  
  data?.length && data.forEach(([key, value]) => element.dataset[key] = value);
  attributes?.length && attributes.forEach( ([key, value]) => element.setAttribute(key, value) );
  classList?.forEach( value => element.classList.add(value));
}

function createElement(tagName, props) {
  props = props || {};
  const {assignable, specials} = cleanupProps(props);
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    assignable
  );
  assignSpecialProps(specials, elem);
  
  return elem;
}

function cleanupComment(initial) {
  return initial?.constructor === Comment ? initial?.textContent : String(initial);
}

function containsHTML(str, tag) {
  return !isComment(tag) && checkType(str, String) && /<.*>|&[#|0-9a-z]+[^;];/i.test(str);
}

function isComment(tag) { return /comment/i.test(tag); }

function validateTag(name) {
  return validateElementTagName(name) &&
    (name in customElementRegistry ||
      !checkType(createElement(name), HTMLUnknownElement));
}

function validateElementTagName(tagName) {
  tagName = tagName.toLowerCase();
  
  return typeof tagName === `string` &&
    tagName.length > 0 &&
    /^[a-z]/.test(tagName) &&
    /^[a-z0-9-]+$/gi.test(tagName);
}

function tag2FN(tagName) {
  tagName = tagName in customElementRegistry ?  customElementRegistry[tagName] : tagName;
  return (initial, ...args) => tagFN(tagName, initial, ...args);
}

function ucFirst([first, ...theRest]) { return `${first.toUpperCase()}${theRest.join(``)}`; }

function toDashedNotation(str2Convert) {
  return str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
}

function toCamelcase(str2Convert) {
  return checkType(str2Convert, String)
    ? str2Convert.toLowerCase()
      .split(`-`)
      .map( (str, i) => i && `${ucFirst(str)}` || str)
      .join(``)
    : str2Convert;
}

function maybeFactory() {
  const errFn = err => undefined;
  return function({trial, whenError = errFn } = {}) {
    try { return trial(); } catch (err) { return whenError(err); }
  };
}

function typeCheckFactory() {
  const collate = new Intl.Collator(`en`, {sensitivity: 'base'});
  const nameOf = type2Check => type2Check instanceof Function ? type2Check.name : `noCTOR`;
  
  return function (obj, type2Check) {
    return 0 === collate.compare(
      Object.prototype.toString.call(obj),
      `[object ${nameOf(type2Check)}]`
    ) || obj?.name === type2Check?.name;
  }
}

function _typeCheckFactory() {
  const noCTOR = String(function NoCtor() {});
  const collate = new Intl.Collator(`en`, {sensitivity: 'base'});
  
  return function (obj, type2Check) {
    return 0 === collate.compare(
      Object.prototype.toString.call(obj),
      `[object ${ctor2String(type2Check)}]`
    );
  }
  
  function ctor2String(type2Check) {
    let ctorStringified = type2Check instanceof Function ? String(type2Check) : noCTOR;
    return /^function (?<typeName>.+)\(.*$/.exec(ctorStringified)?.groups?.typeName;
  }
}
