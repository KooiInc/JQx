import {default as IS} from "./TypeofAnything.js";
export default LifeStyleFactory;

/* region factory */
function LifeStyleFactory({styleSheet, createWithId} = {}) {
  const { tryParseAtOrNestedRules, ruleExists, checkParams,
    sheet, removeRules, consider, currentSheetID } = sheetHelpers({styleSheet, createWithId});

  function setRules4Selector(rule, properties) {
    if (rule && properties.removeProperties) {
      Object.keys(properties.removeProperties)
        .forEach( prop => rule.style.removeProperty(toDashedNotation(prop)) );
      return;
    }

    Object.entries(properties)
      .forEach( ([prop, value]) => {
        prop = toDashedNotation(prop.trim());
        value = value.trim();

        let priority;

        if (/!important/.test(value)) {
          value = value.slice(0, value.indexOf(`!important`)).trim();
          priority = `important`;
        }

        if (!CSS.supports(prop, value)) {
          return console.error(`StylingFactory ${currentSheetID} error: '${
            prop}' with value '${value}' not supported (yet)`);
        }

        tryAndCatch( () => rule.style.setProperty(prop, value, priority),
          `StylingFactory ${currentSheetID} (setRule4Selector) failed`);
      });
  }

  function setRules(selector, styleRules, sheetOrMediaRules = sheet) {
    selector = selector?.trim?.();
    if (!IS(selector, String) || !selector.length || /[;,]$/g.test(selector)) {
      return console.error(`StylingFactory ${currentSheetID} (setRules): [${
        selector || `[no selector given]` }] is not a valid selector`);
    }

    if (styleRules.removeRule) {
      return removeRules(selector);
    }

    const exists = ruleExists(selector, true);
    const rule4Selector = exists
      || sheetOrMediaRules.cssRules[sheetOrMediaRules.insertRule(`${selector} {}`, sheetOrMediaRules.cssRules.length || 0)];

    return consider( () => setRules4Selector(rule4Selector, styleRules), selector, exists );
  }

  function doParse(cssDeclarationString) {
    const rule = cssDeclarationString.trim().split(/{/, 2);
    const selector = rule.shift().trim();

    if (!IS(selector, String) || !selector?.trim()?.length) {
      return console.error(`StylingFactory ${currentSheetID} (doParse): no (valid) selector could be extracted from rule ${
        shortenRule(cssDeclarationString)}`);
    }

    const cssRules =  cssRuleFromText(rule.shift());

    return tryAndCatch( () => setRules(selector, cssRules), `StylingFactory ${currentSheetID} (setRules) failed`  );
  }

  function styleFromString(cssDeclarationString) {
    const checkAts = tryParseAtOrNestedRules(cssDeclarationString);
    return checkAts.done ? checkAts.existing : doParse(cssDeclarationString);
  }

  function styleFromObject(selector, rulesObj) {
    if (selector.trim().startsWith(`@media`)) {
      return styleFromString(atMedia2String(selector, rulesObj));
    }
    return setRules(selector, rulesObj);
  }

  return function(cssBlockOrSelector, rulesObj = {}) {
    const checksOk = checkParams(cssBlockOrSelector, rulesObj);

    return checksOk && (
      Object.keys(rulesObj).length ?
        styleFromObject(cssBlockOrSelector, rulesObj) :
        styleFromString(cssBlockOrSelector) );
  };
}
/* endregion factory */

/* region helpers */
function sheetHelpers({styleSheet, createWithId}) {
  const notification = `Note: The rule or some of its properties may not be supported by your browser (yet)`;
  const currentSheetID = `for style#${createWithId}`;
  styleSheet = createWithId ? retrieveOrCreateSheet(createWithId) : styleSheet;

  function retrieveOrCreateSheet(id) {
    const existingSheet = document.querySelector(`#${id}`)?.sheet;

    if (existingSheet) { return existingSheet; }

    const newSheet = Object.assign(document.createElement(`style`), { id });
    document.head.insertAdjacentElement(`beforeend`, newSheet);
    return newSheet.sheet;
  }

  function notSupported(rule) {
    console.error(`StylingFactory ${currentSheetID} [rule: ${rule}]
    => @charset, @namespace and @import are not supported here`);
    return {done: true};
  }

  function ruleExists(ruleFragOrSelector, isSelector) {
    return [...styleSheet.rules].find( r =>
      isSelector ?
        compareSelectors((r.selectorText || ``), ruleFragOrSelector) :
        createRE`${escape4RegExp(ruleFragOrSelector)}${[...`gim`]}`.test(r.cssText));
  }

  function tryParseAtOrNestedRules(cssDeclarationString) {
    if (/^@charset|@import|namespace/i.test(cssDeclarationString.trim())) {
      return notSupported(cssDeclarationString);
    }

    if (cssDeclarationString.match(/}/g)?.length > 1) {
      return {existing: tryParse(cssDeclarationString, 1), done: true}
    }

    return { done: false };
  }

  function removeRules(selector) {
    const rulesAt = [...styleSheet.cssRules].reduce( (acc, v, i) =>
      compareSelectors(v.selectorText || ``, selector) && acc.concat(i) || acc, [] );
    const len = rulesAt.length;
    rulesAt.forEach(idx => styleSheet.deleteRule(idx));

    return len > 0
      ? console.info(`✔ Removed ${len} instance${len > 1 ? `s` : ``} of selector ${
        selector} from ${currentSheetID.slice(4)}`)
      : console.info(`✔ Remove rule: selector ${selector} does not exist in ${
        currentSheetID.slice(4)}`);
  }

  function checkParams(cssBlockOrSelector, rulesObj) {
    return cssBlockOrSelector
      && IS(cssBlockOrSelector, String)
      && cssBlockOrSelector.trim().length > 0
      && IS(rulesObj, Object) ||
      (console.error(`StylingFactory ${currentSheetID} called with invalid parameters`), false);
  }

  function tryParse(cssDeclarationString) {
    cssDeclarationString = cssDeclarationString.trim();
    const rule = cssDeclarationString.slice(0, cssDeclarationString.indexOf(`{`)).trim();
    const exists = !!ruleExists(rule);

    try {
      return (styleSheet.insertRule(`${cssDeclarationString}`, styleSheet.cssRules.length), exists);
    } catch(err) {
      return (console.error(`StylingFactory ${currentSheetID} (tryParse) ${err.name} Error:\n${
        err.message}\nRule: ${
        shortenRule(cssDeclarationString)}\n${
        notification}`),
        exists);
    }
  }

  function consider(fn, rule, existing) {
    try {
      return (fn(), existing);
    } catch(err) {
      return (
        console.error(`StylingFactory ${currentSheetID} (tryAddOrModify) ${err.name} Error:\n${
          err.message}\nRule: ${shortenRule(rule)}\n${notification}`),
          existing
      );
    }
  }

  return {
    sheet: styleSheet, removeRules, tryParseAtOrNestedRules,
    ruleExists, checkParams, tryParse, consider,
    currentSheetID };
}
/* endregion helpers */

/* region globalOrShared */
function atMedia2String(selector, rulesObj) {
  return `${selector.trim()} ${
    Object.entries(rulesObj).map( ( [ selectr, rule] ) =>
      `${selectr}: { ${stringifyMediaRule(rule) }` ) }`;
}

function shortenRule(rule) {
  const shortRule = (rule || `NO RULE`).trim().slice(0, 50).replace(/\n/g, `\\n`).replace(/\s{2,}/g, ` `);
  return rule.length > shortRule.length ? `${shortRule.trim()}...truncated`  : shortRule;
}

function stringifyMediaRule(mediaObj) {
  return Object.entries(mediaObj)
    .map( ([key, value]) => `${key}: ${value.trim()}`).join(`;\n`);
}

function escape4RegExp(str) {
  return str.replace(/([*\[\]()-+{}.$?\\])/g, a => `\\${a}`);
}

function createRE(regexStr, ...args) {
  const flags = args.length && Array.isArray(args.slice(-1)) ? args.pop().join(``) : ``;

  return new RegExp(
    (args.length &&
      regexStr.raw.reduce( (a, v, i ) => a.concat(args[i-1] || ``).concat(v), ``) ||
      regexStr.raw.join(``))
      .split(`\n`)
      .map( line => line.replace(/\s|\/\/.*$/g, ``).trim().replace(/(@s!)/g, ` `) )
      .join(``), flags);
}

function toDashedNotation(str2Convert) {
  return str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/[^--]^-|-$/, ``);
}

function tryAndCatch(fn, msg) {
  try { return fn(); }
  catch(err) { console.error( `${msg || `an error occured`}: ${err.message}` ); }
}

function prepareCssRuleFromText(rule) {
  return rule
    .replace(/\/\*.+?\*\//gm, ``)
    .replace(/[}{\r\n]/g, ``)
    .replace(/(data:.+?);/g, (_,b) => `${b}\\3b`)
    .split(`;`)
    .map(l => l.trim())
    .join(`;\n`)
    .replaceAll(`\\3b`, `;`)
    .split(`\n`);
}

function toRuleObject(preparedRule) {
  return preparedRule
    .reduce( (acc, v) => {
      const [key, value] = [
        v.slice(0, v.indexOf(`:`)).trim(),
        v.slice(v.indexOf(`:`) + 1).trim().replace(/;$|;.+(?=\/*).+\/$/, ``)];
      return key && value ? {...acc, [key]: value} : acc; }, {} );
}

function cssRuleFromText(rule) {
  return toRuleObject(prepareCssRuleFromText(rule));
}

function compareSelectors(s1, s2) {
  return s1?.replace(`::`, `:`) === s2?.replace(`::`, `:`);
}
/* endregion globalOrShared */
