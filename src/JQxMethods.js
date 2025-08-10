import {createElementFromHtmlString, inject2DOMTree} from "./DOM.js";
import {ATTRS} from "./EmbedResources.js";
import {
  IS, isNode, truncateHtmlStr, addHandlerId, ExamineElementFeatureFactory,
  isNonEmptyString, toDashedNotation, randomString, escHtml, systemLog,
  insertPositions, isCommentOrTextNode, datasetKeyProxy
} from "./Utilities.js";

const isIt = ExamineElementFeatureFactory();

/* region functions */
function emptyElement(el) {
  return el && (el.textContent = "");
}

function loop(instance, callback) {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i);
  }

  return instance;
}

function compareCI(key, compareTo) {
  return key.toLowerCase().trim() === compareTo.trim().toLowerCase();
}

function cloneAndDestroy(elem) {
  const cloned = elem.cloneNode(true)
  cloned.removeAttribute && cloned.removeAttribute(`id`);
  elem.isConnected ? elem.remove() : elem = null;
  return cloned;
}

function setData(el, keyValuePairs) {
  if (el && IS(keyValuePairs, Object)) {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      el.setAttribute(`data-${toDashedNotation(key)}`, value);
    }
  }
}

function before (instance, elem2AddBefore) {
  return instance.andThen(elem2AddBefore, true);
}

function after(instance, elem2AddAfter) {
  return instance.andThen(elem2AddAfter);
}

function checkProp(prop) {
  return prop.startsWith(`data`) || ATTRS.html.find(attr => prop.toLowerCase() === attr);
}

function css(el, keyOrKvPairs, value, jqx) {
  if (value && IS(keyOrKvPairs, String)) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQxClass-`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQxClass-${randomString().slice(1)}`;
  jqx.editCssRule(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
}

function assignAttrValues(/*NODOC*/el, keyValuePairs) {
  if (el) {
    for (let [key, value] of Object.entries(keyValuePairs)) {
      key = toDashedNotation(key);
      if (key.startsWith(`data`)) {
        return setData(el, value);
      }

      if (IS(value, String) && checkProp(key)) {
        el.setAttribute(key, value.split(/[, ]/)?.join(` `));
      }
    }
  }
}

function applyStyle(el, rules) {
  if (IS(rules, Object)) {
    for (let [key, value] of Object.entries(rules)) {
      let priority;
      if (/!important/i.test(value)) {
        value = value.slice(0, value.indexOf(`!`)).trim();
        priority = 'important';
      }

      el.style.setProperty(toDashedNotation(key), value, priority)
    }
  }
}

function logDebug(...args) {
  debugLog.log(`❗` + args.map(v => String(v)).join(`, `) ) ;
}

function findParentScrollDistance(node, distance = 0, top = true) {
  node = node?.parentElement;
  const what = top ? `scrollTop` : `scrollLeft`;
  distance += node ? node[what] : 0;
  return !node ? distance : findParentScrollDistance(node, distance, top);
}
/* endregion functions */

/* region exportfunctions */
function factoryExtensionsFactory(jqx) {
  return {
    data: instance => ({
      get all() { return new Proxy(instance[0]?.dataset ?? {}, datasetKeyProxy); },
      set: (valuesObj = {}) => {
        if (!instance.is.empty && IS(valuesObj, Object)) {
          for (const [key, value] of Object.entries(valuesObj)) {
            instance.setData( { [key]: value} );
          }
        }
        return instance;
      },
      get: (key, whenUndefined) => instance.data.all[key] ?? whenUndefined,
      add: (valuesObj = {}) => {
        if (!instance.is.empty && IS(valuesObj, Object)) {
          for (const [key, value] of Object.entries(valuesObj)) {
            instance.setData( { [key]: value} );
          }
        }
        return instance;
      },
      remove: key => {
        instance[0]?.removeAttribute(`data-${toDashedNotation(key)}`);
        return instance;
      },
    }),
    dimensions: instance => {
      if (instance.is.empty) {
        return { error: `[instance].dimensions: NO ELEMENTS` };
      }
      let node = instance[0];
      const boundingRect = instance.first()?.getBoundingClientRect().toJSON();
      boundingRect.scrollTopDistance = findParentScrollDistance(node, 0);
      boundingRect.scrollLeftDistance = findParentScrollDistance(node, 0, false);
      return boundingRect;
    },
    node: instance => { return instance[0]; },
    HTML: instance => ({
      get: (outer, escaped) => {
        if (instance.is.empty) {
          return `NO ELEMENTS IN COLLECTION`;
        }
        const html = outer ? instance.outerHtml : instance.html();
        return escaped ? escHtml(html) : html;
      },
      set: (content, append = false, escape = false) => {
        content = content.isJQx ? content.HTML.get(1) : content;
        const isString = IS(content, String);
        content = isString && escape ? escHtml(content) : content;
        if (isString && (content || ``).trim().length) { instance.html(content, append); }
        return instance;
      },
      replace: (content, escape = false) => {
        return instance.HTML.set(content, false, escape);
      },
      append: (content, escape = false) => {
        content = IS(content, HTMLElement)
          ? jqx(content).HTML.get(1) : content.isJQx ? content.HTML.get(1) : content;
        return instance.HTML.set(content, true, escape);
      },
      insert: (content, escape = false) => {
        content = IS(content, HTMLElement)
          ? jqx(content).HTML.get(1) : content.isJQx ? content.HTML.get(1) : content;
        return instance.HTML.set(content + instance.HTML.get(), false, escape);
      },
    }),
    is: instance => isIt(instance),
    length: instance => instance.collection.length,
    outerHtml: instance => (instance.first() || {outerHTML: undefined}).outerHTML,
    parent: instance =>{
      const tryParent = jqx(instance[0]?.parentNode);
      return !tryParent.is.empty ? tryParent : instance;
    },
    render: instance => {
      !instance.is.empty && instance.toDOM() || (jqx.log(`[JQx.render]: empty collection`), undefined);
      return instance;
    },
    Style: instance => ({
      get computed() { return !instance.is.empty ? getComputedStyle(instance[0]) : {}; },
      inline: styleObj => instance.style(styleObj),
      inSheet: styleObj => instance.css(styleObj),
      valueOf: key => {
        return !instance.is.empty ? getComputedStyle(instance[0])[toDashedNotation(key)] : undefined;
      },
      nwRule: rule => instance.Style.byRule({rules: rule}),
      byRule: ({classes2Apply = [], rules = []} = {}) => {
        const isSingleRule = IS(rules, String);
        const addClassNameOrID = isSingleRule && !classes2Apply.length ? rules.split(`{`)[0].trim() : ``;
        rules = rules && IS(rules, String) ? [rules] : rules;
        classes2Apply = classes2Apply && IS(classes2Apply, String) ? [classes2Apply] : classes2Apply;

        if (rules?.length || classes2Apply?.length) {
          rules?.length && jqx.editCssRules(...rules);

          if (classes2Apply) {
            for(const selector of classes2Apply) { instance.addClass(selector); }
          }
        }

        if (addClassNameOrID?.startsWith(`.`)) {
          instance.addClass(addClassNameOrID.slice(1));
        }

        if (addClassNameOrID?.startsWith(`#`) && !instance.attr(`id`)) {
          instance.prop({id: addClassNameOrID.slice(1)});
        }

        return instance;
      },
    }),
  };
}

function instanceExtensionsFactory(jqx) {
  return {
    addClass: (instance, ...classNames) => loop(instance, el => el && classNames.forEach(cn => el.classList.add(cn))),
    after,
    afterMe: after,
    andThen: (instance, elem2Add, before = false) => {
      if (!elem2Add || !IS(elem2Add, String, Node, Proxy)) {
        logDebug(`[JQx instance].[beforeMe | afterMe | andThen]: insufficient input [${elem2Add}]`, );
        return instance;
      }

      elem2Add = elem2Add?.isJQx
        ? elem2Add.collection
        : IS(elem2Add, Node) ? jqx.virtual(elem2Add).collection
          : jqx.virtual(createElementFromHtmlString(elem2Add)).collection;

      const [index, method, reCollected] = before
        ? [0, `before`, elem2Add.concat(instance.collection)]
        : [instance.collection.length - 1, `after`, instance.collection.concat(elem2Add)];

      instance[index][method](...elem2Add);
      instance.collection = reCollected;
      return instance;
    },
    append: (instance, ...elems2Append) => {
      if (!instance.is.empty && elems2Append.length) {
        const shouldMove = instance.length === 1;

        for (let elem2Append of elems2Append) {
          if (!elem2Append.isJQx && isNonEmptyString(elem2Append)) {
            const elem2Append4Test = elem2Append.trim();
            const isPlainString = !/^<(.+)[^>]+>$/m.test(elem2Append4Test);
            let toAppend = isPlainString ? jqx.text(elem2Append) : createElementFromHtmlString(elem2Append);
            loop(instance, el => el.append(shouldMove ? toAppend : cloneAndDestroy(toAppend)));
          }

          if (isNode(elem2Append)) {
            loop(instance, el => el.append(shouldMove ? elem2Append : cloneAndDestroy(elem2Append)));
          }

          if (elem2Append.isJQx && !elem2Append.is.empty) {
            loop(instance, el =>
              elem2Append.collection.forEach(elem =>
                el.append(shouldMove ? elem : cloneAndDestroy(elem)))
            );
          }
        }
      }
      return instance;
    },
    appendTo: (instance, appendTo) => {
      if (!appendTo.isJQx) {
        appendTo = jqx(appendTo);
      }
      appendTo.append(instance);
      return instance;
    },
    attr: (instance, keyOrObj, value) => {
      const firstElem = instance[0];

      if (!firstElem) { return instance }

      if (!value && isNonEmptyString(keyOrObj)) {
        keyOrObj = toDashedNotation(keyOrObj);

        if (keyOrObj === `class`) {
          return [...firstElem?.classList]?.join(` `);
        }

        return firstElem?.getAttribute(keyOrObj);
      }

      if (isNonEmptyString(keyOrObj) && value) {
        keyOrObj = toDashedNotation(keyOrObj);

        switch(true) {
          case keyOrObj.startsWith(`data-`):
            keyOrObj = { data: {[keyOrObj.replace(`data-`, ``)]: value } };
            break;
          default: keyOrObj = { [keyOrObj]: value };
        }
      }

      if (IS(keyOrObj, Object) && !instance.is.empty) {
        assignAttrValues(firstElem, keyOrObj);
      }

      return instance;
    },
    before,
    beforeMe: before,
    clear: instance => loop(instance, emptyElement),
    closest: (instance, selector) => {
      const theClosest = isNonEmptyString(selector) ? instance[0].closest(selector) : null;
      return theClosest ? jqx(theClosest) : instance
    },
    computedStyle: (instance, property) => instance.first() && getComputedStyle(instance.first())[property],
    css: (instance, keyOrKvPairs, value) => loop(instance, el => css(el, keyOrKvPairs, value, jqx)),
    duplicate: (instance, toDOM = false, root = document.body) => {
      const clone = instance.collection[0].cloneNode(true);
      clone.childNodes.forEach((node) => {node.removeAttribute && node?.removeAttribute(`id`)});
      return toDOM ? jqx(clone).toDOM(root) : jqx(clone);
    },
    each: (instance, cb) => loop(instance, cb),
    empty: instance => loop(instance, emptyElement),
    find: (instance, selector) =>
      instance.collection.length > 0 ? [...instance.first()?.querySelectorAll(selector)] : [],
    find$: (instance, selector) => { return instance.collection.length > 0 ? jqx(selector, instance) : instance; },
    first: (instance, asJQxInstance = false) => {
      if (instance.collection.length > 0) {
        return asJQxInstance
          ? instance.single()
          : instance.collection[0];
      }
      return undefined;
    },
    first$: (instance, indexOrSelector) => instance.single(indexOrSelector),
    getData: (instance, dataAttribute, valueWhenFalsy) =>
      instance.first() && instance.first().dataset?.[dataAttribute] || valueWhenFalsy,
    hasClass: (instance, ...classNames) => {
      const firstElem = instance[0];
      return !firstElem || !firstElem.classList.length
        ? false : classNames.find(cn => firstElem.classList.contains(cn)) && true || false;
    },
    hide: instance => loop(instance, el => applyStyle(el, {display: `none !important`})),
    html: (instance, htmlValue, append) => {
      if (htmlValue === undefined) {
        const node = instance.node;
        return node?.getHTML && node.getHTML() || ``;
      }

      if (!instance.isEmpty()) {
        const nwElement = createElementFromHtmlString(
          `<div>${htmlValue.isJQx ? htmlValue.HTML.get(true) : htmlValue}</div>`
        );

        if (!IS(nwElement, Comment)) {
          const cb = el => {
            if (!append) { el.textContent = ``; }

            return el.insertAdjacentHTML(jqx.at.end, nwElement.getHTML());
          }
          return loop(instance, cb);
        }
      }

      return instance;
    },
    htmlFor: (instance, forQuery, htmlString = "", append = false) => {
      if (forQuery && instance.collection.length) {
        if (!forQuery || !isNonEmptyString(htmlString)) { return instance; }

        const el2Change = instance.find$(forQuery);

        if (el2Change.length < 1) { return instance; }

        const nwElement = createElementFromHtmlString(`<span>${htmlString}</span>`);

        el2Change.each(el => {
          if (!append) { el.textContent = ``; }
          el.insertAdjacentHTML(jqx.at.end, nwElement?.getHTML());
        });

      }

      return instance;
    },
    isEmpty: instance => instance.collection.length < 1,
    nth$: (instance, indexOrSelector) => instance.single(indexOrSelector),
    on: (instance, type, ...callback) => {
      if (instance.collection.length && IS(type, String, Array)) {
        if (type?.length < 1 || callback.length < 1) { return instance; }
        const cssSelector4Handler = addHandlerId(instance);
        jqx.handle({type, selector: cssSelector4Handler, handlers: callback});
      }

      return instance;
    },
    prepend: (instance, ...elems2Prepend) => {
      if (!instance.is.empty && elems2Prepend) {
        const shouldMove = instance.length === 1;

        for (let elem2Prepend of elems2Prepend) {
          if (isNonEmptyString(elem2Prepend)) {
            elem2Prepend = elem2Prepend.trim();
            const isPlainString = !/^<(.+)[^>]+>$/m.test(elem2Prepend);
            let toPrepend = isPlainString ? jqx.text(elem2Prepend) : createElementFromHtmlString(elem2Prepend);
            toPrepend = shouldMove ? toPrepend : cloneAndDestroy(toPrepend);
            loop(instance, el => el.prepend(toPrepend.cloneNode(true)));
          }

          if (isNode(elem2Prepend)) {
            loop(instance, el => el.prepend(shouldMove ? elem2Prepend : cloneAndDestroy(elem2Prepend)));
          }

          if (elem2Prepend.isJQx && !elem2Prepend.is.empty) {
            elem2Prepend.collection.length > 1 && elem2Prepend.collection.reverse();
            loop(instance, el => loop( elem2Prepend, elem => el.prepend(shouldMove ? elem : cloneAndDestroy(elem)) ) );
            elem2Prepend.collection.reverse();
          }
        }
      }

      return instance;
    },
    prependTo: (instance, prependTo) => {
      if (!prependTo.isJQx) {
        prependTo = jqx.virtual(prependTo);
      }

      prependTo.prepend(instance);
      return instance;
    },
    prop: (instance, nameOrProperties, value) => {
      if (IS(nameOrProperties, String) && !value) {
        return nameOrProperties.startsWith(`data`)
          ? instance[0]?.dataset[nameOrProperties.slice(nameOrProperties.indexOf(`-`)+1)]
          : instance[0]?.[nameOrProperties];
      }

      const props = !IS(nameOrProperties, Object) ? { [nameOrProperties]: value } : nameOrProperties;
      for (let [propName, propValue] of Object.entries(props)) {
        propName = propName.trim();

        if (propValue && !checkProp(propName) || !propValue) {
          return false;
        }

        const isId = propName.toLowerCase() === `id`;

        if (isId) { return instance[0].id = propValue; }

        loop(instance, el => {
          if (propName.startsWith(`data`)) {
            return el.dataset[propName.slice(propName.indexOf(`-`)+1)] = propValue;
          }

          el[propName] = propValue;
        });
      }

      return instance;
    },
    remove: (instance, selector) => {
      systemLog.log(`remove ${truncateHtmlStr(instance.HTML.get(1), 40)}${selector ? ` /w selector ${selector}` : ``}`);
      const remover = el => el.remove();
      const removeFromCollection = () =>
        instance.collection = instance.collection.filter(el => document.documentElement.contains(el));

      if (selector) {
        const selectedElements = instance.find$(selector);
        if (!selectedElements.is.empty) {
          loop(selectedElements, remover);
          removeFromCollection();
        }
        return instance;
      }
      loop(instance, remover);
      removeFromCollection();
      return instance;
    },
    rmAttr: (instance, ...attrNames) => {
      for (const attr of attrNames) { instance.node.removeAttribute(attr); }
      return instance;
    },
    removeClass: (instance, ...classNames) =>
      loop(instance, el => { if (el) { for (const cn of classNames) { el.classList.remove(cn); } } }),
    renderTo: (instance, root = document.body, at = jqx.at.end) => {
      instance.first$().toDOM(root, at);
      return instance;
    },
    replace: (instance, oldChild, newChild) => {
      const firstElem = instance[0];

      if (!oldChild || (!newChild || !IS(newChild, HTMLElement) && !newChild.isJQx)) {
        console.error(`JQx replace: invalid replacement value`);
        return instance;
      }

      if (newChild.isJQx) {
        newChild = newChild[0];
      }

      if (IS(newChild, NodeList)) {
        newChild = newChild[0];
      }

      if (firstElem && oldChild) {
        oldChild = IS(oldChild, String)
          ? firstElem.querySelectorAll(oldChild)
          : oldChild.isJQx
            ? oldChild.collection
            : oldChild;

        if (IS(oldChild, HTMLElement, NodeList, Array) && IS(newChild, HTMLElement)) {
          (IS(oldChild, HTMLElement) ? [oldChild] : [...oldChild])
            .forEach(chld => chld.replaceWith(newChild.cloneNode(true)));
        }
      }

      return instance;
    },
    replaceClass: (instance, className, ...nwClassNames) => loop( instance, el => {
      el.classList.remove(className);
      for (const name of nwClassNames) { el.classList.add(name); }
    } ),
    replaceMe: (instance, newChild) => /*NODOC*/ instance.replaceWith(newChild),
    replaceWith: (instance, newChild) => {
      newChild = IS(newChild, Element) ? newChild : newChild.isJQx ? newChild[0] : undefined;

      if (newChild) {
        instance[0].replaceWith(newChild);
        instance = jqx.virtual(newChild);
      }

      return instance;
    },
    setData: (instance, keyValuePairs) => loop(instance, el => setData(el, keyValuePairs)),
    show: instance => loop(instance, el => applyStyle(el, {display: `revert-layer !important`})),
    single: (instance, indexOrSelector) => {
      if (instance.collection.length > 0) {
        if (IS(indexOrSelector, String)) {
          return instance.find$(indexOrSelector);
        }

        if (IS(indexOrSelector, Number)) {
          return jqx(instance.collection[indexOrSelector]);
        }

        return jqx(instance.collection[0]);
      }

      return instance;
    },
    style: (instance, keyOrKvPairs, value) => {
      const loopCollectionLambda = el => {
        if (value && IS(keyOrKvPairs, String)) {
          keyOrKvPairs = { [keyOrKvPairs]: value || `none` };
        }

        applyStyle(el, keyOrKvPairs);
      };
      return loop(instance, loopCollectionLambda);
    },
    text: (instance, textValue, append = false) => {
      if (instance.isEmpty()) { return instance; }
      if (!IS(textValue, String)) { return instance.first().textContent; }
      const loopCollectionLambda = el => el.textContent = append ? el.textContent + textValue : textValue;
      return loop(instance, loopCollectionLambda);
    },
    toDOM: (instance, root = document.body, position = insertPositions.BeforeEnd) => {
      if (instance.isVirtual) { instance.isVirtual = false; }
      instance.collection = inject2DOMTree(instance.collection, root, position);

      return instance;
    },
    toggleClass: (instance, className) => loop(instance, el => el.classList.toggle(className)),
    toNodeList: instance => [...instance.collection].map(el => document.importNode(el, true)),
    trigger: (instance, evtType, SpecifiedEvent = Event, options = {}) => {
      if (instance.collection.length) {
        const evObj = new SpecifiedEvent( evtType, { ...options, bubbles: options.bubbles??true} );
        for( let elem of instance.collection ) { elem.dispatchEvent(evObj); }
      }
      return instance;
    },
    val: (instance, newValue) => {
      const firstElem = instance[0];

      if (!firstElem || !IS(firstElem, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement)) {
        return instance;
      }

      if (newValue === undefined) {
        return firstElem.value;
      }

      firstElem.value = !IS(newValue, String) ? "" : newValue;

      return instance;
    },
  };
}

/* endregion exportfunctions */
export default function(jqx) {
  return {
    factoryExtensions: factoryExtensionsFactory(jqx),
    instanceExtensions: instanceExtensionsFactory(jqx),
  }
};
