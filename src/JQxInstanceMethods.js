import {
  IS, isNode, truncateHtmlStr, ExamineElementFeatureFactory,
  isNonEmptyString, toDashedNotation, escHtml, systemLog, insertPositions,
  datasetKeyProxy, loop, cloneAndDestroy, setData, before, after,
  findParentScrollDistance, emptyElement, checkProp, css, assignAttrValues,
  applyStyle, createElementFromHtmlString, inject2DOMTree,
} from "./JQxUtilities.js";

const instanceIs = ExamineElementFeatureFactory();

export default function(jqx) {
  return {
    factoryExtensions: factoryExtensionsFactory(jqx),
    instanceExtensions: instanceExtensionsFactory(jqx),
  }
};

function factoryExtensionsFactory(jqx) {
  return {
    data(instance) {
      return {
        get all() {
          return new Proxy(instance[0]?.dataset ?? {}, datasetKeyProxy);
        },
        set(valuesObj = {}) {
          if (!instance.is.empty && IS(valuesObj, Object)) {
            for (const [key, value] of Object.entries(valuesObj)) {
              instance.setData({[key]: value});
            }
          }
          return instance;
        },
        get(key, whenUndefined) {
          return instance.data.all[key] ?? whenUndefined;
        },
        add(valuesObj = {}) {
          if (!instance.is.empty && IS(valuesObj, Object)) {
            for (const [key, value] of Object.entries(valuesObj)) {
              instance.setData({[key]: value});
            }
          }
          return instance;
        },
        remove(key) {
          instance[0]?.removeAttribute(`data-${toDashedNotation(key)}`);
          return instance;
        },
      };
    },
    dimensions(instance) {
      if (instance.is.empty) {
        systemLog.error(`[JQx instance].dimensions called on empty instance`);
        return { error: `[JQx instance].dimensions: NO ELEMENTS` };
      }
      let {node} = instance;
      const boundingRect = node.getBoundingClientRect().toJSON();
      boundingRect.scrollTopDistance = findParentScrollDistance(node, 0);
      boundingRect.scrollLeftDistance = findParentScrollDistance(node, 0, false);
      return boundingRect;
    },
    node(instance) { return instance[0]; },
    HTML(instance) {
      return {
        get(outer, escaped) {
          if (instance.is.empty) {
            return `NO ELEMENTS IN COLLECTION`;
          }
          const html = outer ? instance.outerHtml : instance.html();
          return escaped ? escHtml(html) : html;
        },
        set(content, append = false, escape = false) {
          content = content.isJQx ? content.HTML.get(1) : content;
          const isString = IS(content, String);
          content = isString && escape ? escHtml(content) : content;
          if (isString && (content || ``).trim().length) { instance.html(content, append); }
          return instance;
        },
        replace(content, escape = false) {
          return instance.HTML.set(content, false, escape);
        },
        append(content, escape = false) {
          content = IS(content, HTMLElement)
            ? jqx(content).HTML.get(1) : content.isJQx ? content.HTML.get(1) : content;
          return instance.HTML.set(content, true, escape);
        },
        insert(content, escape = false) {
          content = IS(content, HTMLElement)
            ? jqx(content).HTML.get(1) : content.isJQx ? content.HTML.get(1) : content;
          return instance.HTML.set(content + instance.HTML.get(), false, escape);
        },
      };
    },
    is(instance) { return instanceIs(instance); },
    length(instance) { return instance.collection.length; },
    outerHtml(instance) { return (instance.first() || {outerHTML: undefined}).outerHTML; },
    parent(instance) {
      const maybeParent = jqx(instance[0]?.parentNode);
      return !maybeParent.is.empty ? maybeParent : instance;
    },
    render(instance) {
      switch(true) {
        case !instance.is.empty: return instance.toDOM();
        default:
          jqx.logger.warn(`[JQx.render]: empty collection`);
          return instance;
      }
    },
    Style(instance) {
      return {
        get computed() { return !instance.is.empty ? getComputedStyle(instance[0]) : {}; },
        inline(styleObj) {
          return instance.style(styleObj);
        },
        inSheet(styleObj) {
          return instance.css(styleObj)
        },
        valueOf(key) {
          return !instance.is.empty ? getComputedStyle(instance[0])[toDashedNotation(key)] : undefined;
        },
        nwRule(rule) {
          return instance.Style.byRule({rules: rule})
        },
        byRule({classes2Apply = [], rules = []} = {}) {
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
      };
    }
  }
}

function instanceExtensionsFactory(jqx) {
  return {
    addClass(instance, ...classNames) {
      return loop(instance, el => el && classNames.forEach(cn => el.classList.add(cn)));
    },
    after,
    afterMe: after,
    andThen(instance, elem2Add, before = false) {
      if (!elem2Add || !IS(elem2Add, String, Node, Proxy)) {
        systemLog.log(`[JQx instance].[before(Me) | after(Me) | andThen]: invalid/-sufficient input.`, );
        return instance;
      }
      
      elem2Add = elem2Add?.isJQx
        ? elem2Add
        : IS(elem2Add, Node)
          ? jqx.virtual(elem2Add)
          : jqx.virtual(createElementFromHtmlString(elem2Add));
      
      const [index, method, reCollected] = before
        ? [0, `before`, elem2Add.collection.concat(instance.collection)]
        : [instance.collection.length - 1, `after`, instance.collection.concat(elem2Add.collection)];
      
      instance[index][method](...elem2Add.collection);
      instance.collection = reCollected;
      return instance;
    },
    append(instance, ...elems2Append) {
      if (instance.is.empty || elems2Append.length < 1) { return instance;}
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
      return instance;
    },
    appendTo(instance, appendTo) {
      switch(true) {
        case !appendTo.isJQx && !IS(appendTo, HTMLElement):
          $.warn(`[JQx instance].appendTo: invalid input`);
          return instance;
        default:
          (!appendTo.isJQx ? jqx(appendTo) : appendTo).append(instance);
          return instance;
      }
    },
    attr(instance, keyOrObj, value) {
      if (!instance.node) { return instance }

      if (!value && isNonEmptyString(keyOrObj)) {
        keyOrObj = toDashedNotation(keyOrObj);

        if (keyOrObj === `class`) {
          return [...instance.node.classList]?.join(` `);
        }

        return instance.node.getAttribute(keyOrObj);
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
        assignAttrValues(instance.node, keyOrObj);
      }

      return instance;
    },
    before,
    beforeMe: before,
    clear(instance) { return loop(instance, emptyElement); },
    closest(instance, selector) {
      const theClosest = isNonEmptyString(selector) ? instance.node?.closest(selector) : undefined;
      return theClosest ? jqx(theClosest) : instance;
    },
    computedStyle(instance, property) {
      const {node} = instance;
      return node && getComputedStyle(node)[property];
    },
    css(instance, keyOrKvPairs, value) {
      return loop(instance, el => css(el, keyOrKvPairs, value, jqx));
    },
    duplicate(instance, toDOM = false, root = document.body) {
      switch(true) {
        case instance.is.empty:
          systemLog.error(`Duplicating an empty JQx instance is not possible`)
          return instance;
        default:
          const clone = instance.collection[0].cloneNode(true);
          clone.childNodes.forEach((node) => { node.removeAttribute && node?.removeAttribute(`id`) });
          return toDOM ? jqx(clone).toDOM(root) : jqx.virtual(clone);
      }
    },
    each(instance, cb) { return  loop(instance, cb); },
    empty(instance) { return loop(instance, emptyElement); },
    find(instance, selector) {
      return instance.collection.length > 0 ? [...instance.first()?.querySelectorAll(selector)] : [];
    },
    find$(instance, selector) {
      return instance.collection.length > 0 ? jqx(selector, instance) : instance;
    },
    first(instance, asJQxInstance = false) {
      return instance.collection.length > 0
        ? asJQxInstance ? instance.single() : instance.collection[0]
        : undefined;
    },
    first$(instance, indexOrSelector) {
      return instance.single(indexOrSelector);
    },
    getData(instance, dataAttribute, valueWhenFalsy) {
      return instance.node?.dataset?.[dataAttribute] || valueWhenFalsy;
    },
    hasClass(instance, ...classNames) {
      return instance.is.empty || !instance.node.classList.length
        ? false
        : classNames.find(cn => instance.node.classList.contains(cn)) && true || false;
    },
    hide(instance) { return loop(instance, el => applyStyle(el, {display: `none !important`})); },
    html(instance, htmlValue, append) {
      switch(true) {
        case instance.is.empty && !isNonEmptyString(htmlValue): return "";
        case !isNonEmptyString(htmlValue): return instance.node?.getHTML() ?? ``;
        default:
          const nwElement = createElementFromHtmlString(
            `<div>${htmlValue.isJQx ? htmlValue.HTML.get(true) : htmlValue}</div>` );
          const cb = el => {
            el.textContent = !append ? `` : el.textContent;
            return el.insertAdjacentHTML(jqx.at.end, nwElement.getHTML());
          }
          return loop(instance, cb);
      }
    },
    htmlFor(instance, forSelector, htmlString = "", append = false) {
      if (instance.is.empty || !isNonEmptyString(forSelector) || !isNonEmptyString(htmlString)) { return instance; }
      const el2Change = instance.find$(forSelector);
      if (el2Change.length < 1) { return instance; }
      const nwElement = createElementFromHtmlString(`<span>${htmlString}</span>`);
      el2Change.each(el => {
        if (!append) { el.textContent = ``; }
        el.insertAdjacentHTML(jqx.at.end, nwElement?.getHTML());
      });

      return instance;
    },
    isEmpty(instance) { return !!!instance.node; },
    nth$(instance, indexOrSelector) { return  instance.single(indexOrSelector); },
    on(instance, type, ...callback) {
      switch(true) {
        case instance.is.empty || !IS(type, String, Array) || !isNonEmptyString(type) || callback.length < 1:
          return instance;
        default: jqx.handle({type, node: instance.node, handler: callback});
          return instance;
      }
    },
    once(instance, type, ...callback) {
      switch(true) {
        case instance.is.empty || !IS(type, String, Array) || !isNonEmptyString(type) || callback.length < 1:
          return instance;
        default:
          jqx.handle({type, once: true, node: instance.node, handler: callback});
          return instance
      }
    },
    prepend(instance, ...elems2Prepend) {
      if (instance.is.empty || !elems2Prepend) { return; }
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
      
      return instance;
    },
    prependTo(instance, prependTo) {
      if (!prependTo.isJQx) {
        prependTo = jqx.virtual(prependTo);
      }

      prependTo.prepend(instance);
      return instance;
    },
    prop(instance, nameOrProperties, value) {
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
    remove(instance, selector) {
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
    rmAttr(instance, ...attrNames) {
      for (const attr of attrNames) { instance.node.removeAttribute(attr); }
      return instance;
    },
    removeClass(instance, ...classNames) {
      return loop(instance, el => { if (el) { for (const cn of classNames) { el.classList.remove(cn); } } });
    },
    renderTo(instance, root, position) {
      root = IS(root, HTMLElement) || root.isJQx ? root : document.body;
      position = IS(position, String) && jqx.at[position] ? position : jqx.at.end;
      instance.first$().toDOM(root, position);
      return instance;
    },
    replace(instance, oldChild, newChild) {
      const firstElem = instance.node;

      if (!oldChild || (!IS(newChild, HTMLElement) && !newChild?.isJQx)) {
        jqx.logger.error(`JQx replace: invalid replacement value`);
        return instance;
      }

      if (newChild.isJQx || IS(newChild, NodeList)) {
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
    replaceClass(instance, className, ...nwClassNames) {
      return loop( instance, el => {
        el.classList.remove(className);
        for (const name of nwClassNames) { el.classList.add(name); }
      } )
    },
    replaceMe(instance, newChild) {
      /*NODOC*/ return instance.replaceWith(newChild);
    },
    replaceWith(instance, newChild) {
      newChild = IS(newChild, Element) ? newChild : newChild.isJQx ? newChild[0] : undefined;

      if (newChild) {
        instance[0].replaceWith(newChild);
        instance = jqx.virtual(newChild);
      }

      return instance;
    },
    setData(instance, keyValuePairs) {
      return loop(instance, el => setData(el, keyValuePairs));
    },
    show(instance) {
      return loop(instance, el => applyStyle(el, {display: `revert-layer !important`}));
    },
    single(instance, indexOrSelector) {
      const hasNodes = instance.collection.length > 0;
      indexOrSelector = indexOrSelector ?? 0;
      
      switch(true) {
        case hasNodes && IS(indexOrSelector, String):
          return instance.find$(indexOrSelector);
        case hasNodes && IS(indexOrSelector, Number):
          return jqx(instance.collection[indexOrSelector]);
        case hasNodes: return instance.collection[0];
        default: return instance;
      }
    },
    style(instance, keyOrKvPairs, value) {
      const loopCollectionLambda = el => {
        if (value && IS(keyOrKvPairs, String)) {
          keyOrKvPairs = { [keyOrKvPairs]: value || `none` };
        }
        applyStyle(el, keyOrKvPairs);
      };
      return loop(instance, loopCollectionLambda);
    },
    text(instance, textValue, append = false) {
      switch(true) {
        case instance.isEmpty(): return instance;
        case !IS(textValue, String): return instance.node.textContent;
        default: return loop(instance, el => el.textContent = append ? el.textContent + textValue : textValue);
      }
    },
    toDOM(instance, root = document.body, position = insertPositions.BeforeEnd) {
      instance.isVirtual = false;
      inject2DOMTree(instance.collection, root, position);
      return instance;
    },
    toggleClass(instance, className) {
      return loop(instance, el => el.classList.toggle(className));
    },
    toNodeList(instance) {
      return [...instance.collection].map(el => document.importNode(el, true));
    },
    trigger(instance, evtType, SpecifiedEvent, options) {
      SpecifiedEvent = /Event\]$/.test(IS(SpecifiedEvent)) ? SpecifiedEvent : Event;
      options = IS(options, Object) ? { ...options, bubbles: options.bubbles??true} : {bubbles: true};
      
      if (!instance.is.empty) {
        const evObj = new SpecifiedEvent( evtType, options );
        instance.each(el => el.dispatchEvent(evObj));
      }
      
      return instance;
    },
    val(instance, newValue) {
      switch(true) {
        case instance.is.empty || !IS(instance.node, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement):
          return instance;
        case !IS(newValue, String):
          return instance.node.value;
        default:
          instance.node.value = !IS(newValue, String) ? "" : newValue;
          return instance;
      }
    },
  };
}
