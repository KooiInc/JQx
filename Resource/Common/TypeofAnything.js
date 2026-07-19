const { IS, isOnly, maybe, $Wrap, isNothing, addSymbolicExtensions, detectableProxy } =
  TOAFactory({useSymbolicExtensions: false});

export { IS as default, maybe, isOnly, $Wrap, detectableProxy as proxyWrapper, isNothing, addSymbolicExtensions };

function TOAFactory(specs = {}) {
  const { useSymbolicExtensions } = specs;
  const isJust = typeCheckFactory();
  const { shouldbeIsSingleObject, ISOneOf, isExcept, verifyNothingness, determineType,
    addSymbolicExtensions, maybe, $Wrap, detectableProxy } = TOAHelpers(IS, useSymbolicExtensions);
  
  if (!!useSymbolicExtensions) { addSymbolicExtensions(); }
  
  return {IS, isOnly, maybe, $Wrap, isNothing: verifyNothingness, addSymbolicExtensions, detectableProxy};
  
  function IS(anything, ...shouldBe) {
    const unChained = Object.getOwnPropertySymbols(anything || {})?.some(v => v === Symbol.justME) && shouldBe.length > 0;
    const single = anything?.[Symbol.justME];
    const input = unChained ? single : typeof anything === `symbol` ? Symbol.isSymbol : anything;
    switch(true) {
      case unChained: return isJust(single, ...shouldBe);
      case !!maybe({trial: _ => `isTypes` in (shouldBe?.[0] ?? {})}):
        return shouldbeIsSingleObject(anything, shouldBe[0]);
      default: return shouldBe.length > 1 ? ISOneOf(input, ...shouldBe) : determineType(anything, ...shouldBe);
    }
  }
  
  function isOnly(anything, ...shouldBe) {
    return IS({[Symbol.justME]: anything}, ...shouldBe);
  }
}

function TOAHelpers(IS, useSymbolicExtensions) {
  const { SymbolAndCustomProxyFactory, maybeFactory, WrapAnyFactory,
          verifyNothingness, determineType, detectableProxy } = AUXHelperFactory(IS, typeOf);
  const {addSymbolicExtensions} = SymbolAndCustomProxyFactory(IS, typeOf, useSymbolicExtensions);
  const [maybe, $Wrap] = [maybeFactory(), WrapAnyFactory(IS, typeOf)];
  
  return Object.freeze({
    shouldbeIsSingleObject, ISOneOf, isExcept, verifyNothingness,
    determineType, detectableProxy, addSymbolicExtensions, maybe, $Wrap });
  
  function typeOf(anything) {
    return anything?.[Symbol.proxy] || IS(anything);
  }
  
  function shouldbeIsSingleObject(anything, isTypeObj) {
    switch(true) {
      case `defaultValue` in isTypeObj: return isOrDefault(anything, isTypeObj);
      case `notTypes` in isTypeObj: return isExcept(anything, isTypeObj);
      default: return IS(anything, ...[isTypeObj.isTypes].flat());
    }
  }
  
  function ISOneOf(obj, ...params) {
    return params.some(param => IS(obj, param));
  }
  
  function isOrDefault(input, {defaultValue, isTypes = [undefined], notTypes} = {}) {
    isTypes = isTypes?.constructor !== Array ? [isTypes] : isTypes;
    notTypes = notTypes && notTypes?.constructor !== Array ? [notTypes] : [];
    return notTypes.length < 1
      ? IS(input, ...isTypes) ? input : defaultValue
      : isExcept(input, {isTypes, notTypes}) ? input : defaultValue;
  }
  
  function isExcept(input, {isTypes = [undefined], notTypes = [undefined]} = {}) {
    isTypes = isTypes?.constructor !== Array ? [isTypes] : isTypes;
    notTypes = notTypes?.constructor !== Array ? [notTypes] : notTypes;
    return IS(input, ...isTypes) && !IS(input, ...notTypes);
  }
}

function AUXHelperFactory() {
  const SYMBOL_KEYS = {
    IS: 'toa.is',
    TYPE: 'toa.type',
    IS_SYMBOL: 'toa.isASymbol',
    PROXY: 'toa.proxyFor',
    TARGET: 'toa.target',
  };
  
  const TYPE_STRINGS = {
    NAN: 'NaN',
    INFINITY: 'Infinity',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    PROXY_PREFIX: 'Proxy for',
    JUSTME: 'justME',
    
  };
  const detectableProxy = detectableProxyFactory();
  
  return Object.freeze({
      SymbolAndCustomProxyFactory: addSymbolsFactory, maybeFactory, WrapAnyFactory,
      verifyNothingness, determineType, detectableProxy,
    }
  );
  
  function detectableProxyFactory() {
    const trapped = type => ({
      get(target, key) {
        return key === Symbol.proxy
          ? `Proxy for ${type}`
          : key === Symbol.target
            ? target : Reflect.get(target, key);
      },
      has(target, key) { return key === Symbol.proxy ? true : key in target; }
    });
    
    function wrapProxy(proxy2Wrap) {
      const type = proxy2Wrap.name || proxy2Wrap.constructor.name;
      return new Proxy( proxy2Wrap, trapped(type) );
    }
    
    function createDetectableProxy(target, traps) {
      traps = IS(traps, Object) ? traps : {};
      return wrapProxy(new Proxy(target, traps));
    }
    
    return {
      wrap: wrapProxy,
      create: createDetectableProxy
    };
  }
  
  function addSymbols2Anything(IS, typeOf) {
    if (!Symbol.is) {
      Symbol.is = Symbol.for(SYMBOL_KEYS.IS);
      Symbol.type = Symbol.for(SYMBOL_KEYS.TYPE);
      
      Object.defineProperties(Object.prototype, {
        [Symbol.type]: { get() { return typeOf(this); }, enumerable: false, configurable: true },
        [Symbol.is]: { value: function (...args) { return IS(this, ...args); }, enumerable: false, configurable: false },
      });
      Object.defineProperties(Object, {
        [Symbol.type]: { value(obj) { return typeOf(obj); }, enumerable: false, configurable: false },
        [Symbol.is]: { value: function (obj, ...args) { return IS(obj, ...args); }, enumerable: false, configurable: false },
      });
    }
  }
  
  function addSymbolsFactory(IS, typeOf, useSymbolicExtension) {
    if (!Symbol.isSymbol) {
      Symbol.isSymbol = Symbol.for(SYMBOL_KEYS.IS_SYMBOL);
      Symbol.proxy = Symbol.for(SYMBOL_KEYS.PROXY);
      Symbol.target = Symbol.for(SYMBOL_KEYS.target);
      Symbol.justME = Symbol.for(SYMBOL_KEYS.JUSTME);
    }
    return {addSymbolicExtensions: () => addSymbols2Anything(IS, typeOf)};
  }
  
  function constructor2String(obj) {
    const ctor = !isNothing(obj, true) ? Object.getPrototypeOf(obj)?.constructor : {name: `unknown`};
    return ctor.name;
  }
  
  function processInput(input, ...shouldBe) {
    const noShouldbe = shouldBe.length < 1;
    const noInput = input === undefined || input === null;
    
    return {
      noInput,
      noShouldbe,
      compareTo: !noShouldbe && shouldBe[0],
      inputCTOR: !noInput && (input?.constructor || Object.getPrototypeOf(input)?.constructor),
      isNaN: Number.isNaN(input) || maybe({trial: _ => String(input) === TYPE_STRINGS.NAN}),
      isInfinity: maybe({trial: _ => String(input)}) === TYPE_STRINGS.INFINITY,
      shouldBeFirstElementIsNothing: !noShouldbe && verifyNothingness(shouldBe[0])
    };
  }
  
  function determineType(input, ...shouldBe) {
    let { noInput, noShouldbe, compareTo, inputCTOR, isNaN, isInfinity, shouldBeFirstElementIsNothing } =
      processInput(input, ...shouldBe);
    shouldBe = shouldBe.length && shouldBe[0];
    
    switch (true) {
      case shouldBeFirstElementIsNothing: return String(input) === String(compareTo);
      case input?.[Symbol.proxy] && noShouldbe: return input[Symbol.proxy];
      case input?.[Symbol.proxy] && typeof shouldBe === `string`:
        return input[Symbol.proxy].toLowerCase() === shouldBe.toLowerCase();
      case isNaN: return noShouldbe ? TYPE_STRINGS.NAN : String(compareTo) === String(input);
      case isInfinity: return noShouldbe ? TYPE_STRINGS.INFINITY : String(compareTo) === String(input);
      case noInput: return noShouldbe ? String(input) : String(compareTo) === String(input);
      case inputCTOR === Boolean: return noShouldbe ? TYPE_STRINGS.BOOLEAN : inputCTOR === shouldBe;
      default: return getResult(input, shouldBe, noShouldbe, finalInputResolver(input, inputCTOR));
    }
  }
  
  function finalInputResolver(input, inputCTOR) {
    switch(true) {
      case input === 0: return Number;
      case input === ``: return String;
      case !input: return {name: String(input)};
      default: return inputCTOR;
    }
  }
  
  function getResult(input, compareWith, noShouldbe, maybeResult) {
    switch (true) {
      case (!noShouldbe && compareWith === input) || (input?.[Symbol.proxy] && compareWith === Proxy):
        return true;
      case String(compareWith) === TYPE_STRINGS.NAN:
        return String(input) === TYPE_STRINGS.NAN;
      case input?.[Symbol.toStringTag] && typeof compareWith === `string`:
        return String(compareWith) === input[Symbol.toStringTag];
      default:
        return compareWith ?
          resultWithComparison(input, compareWith, maybeResult) : resultWithoutComparison(input, maybeResult);
    }
  }
  
  function resultWithoutComparison(input, maybeResult) {
    const toStringTag = input?.[Symbol.toStringTag] ?? input?.prototype?.[Symbol.toStringTag];
    return toStringTag || maybeResult?.name || String(maybeResult);
  }
  
  function resultWithComparison(input, compareWith, maybeResult) {
    return maybe({trial: _ =>
          input instanceof compareWith}) ||
      compareWith === maybeResult ||
      compareWith === Object.getPrototypeOf(maybeResult) ||
      `${compareWith?.name}` === maybeResult?.name;
  }
  
  function WrapAnyFactory(IS, typeOf) {
    return function (someObj) {
      const wrapper = {
        get value() { return someObj; },
        is(...args) { return IS(someObj, ...args); },
        get type() { return typeOf(someObj); },
      };
      
      if (Object[Symbol.type]) {
        Object.defineProperties(wrapper, {
          [Symbol.type]: { get() { return typeOf(someObj);} },
          [Symbol.is]: { value(...args) { return IS(someObj, ...args); }}
        });
      }
      return Object.freeze(wrapper);
    }
  }
  
  function maybeFactory() {
    const errFn = err => undefined;
    return function({trial, whenError = errFn } = {}) {
      try { return trial(); } catch (err) { return whenError(err); }
    };
  }
  
  function verifyNothingness(maybeNothing, all = false) {
    let nada = maybeNothing === null || maybeNothing === undefined;
    nada = all ? nada || IS(maybeNothing, Infinity) || IS(maybeNothing, NaN) : nada;
    return nada;
  }
}

function typeCheckFactory() {
  const collate = new Intl.Collator(`en`, {sensitivity: 'base'});
  const nameOf = type2Check => {
    return typeof type2Check?.constructor === `function`
      ? type2Check?.name || type2Check?.constructor?.name
      : typeof type2Check === `string` ? type2Check : typeof type2Check;
  };
  const isNothing = obj => [null, undefined, Infinity, NaN].some(v => v === obj);
  
  function checkSingleType(obj, type2Check) {
    if (
      type2Check !== obj &&
      ( isNothing(obj) || type2Check === Number && (Number.isNaN(obj) || !Number.isFinite(obj)) )
    ) { return false; }
    const [objName, typeName] = [nameOf(obj), nameOf(type2Check)];
    
    return obj?.[Symbol.proxy] === type2Check ||
      type2Check === obj?.name ||
      0 === collate.compare(objName, typeName) ||
      0 === collate.compare(obj.constructor?.name, type2Check?.name) ||
      obj.constructor?.name === type2Check ||
      objName === type2Check ||
      0 === collate.compare( Object.prototype.toString.call(obj), `[object ${typeName}]` );
  }
  
  return function checkType(obj, ...type2Check) {
    if (Array.isArray(type2Check) && type2Check.length > 1) {
      for (const chkType of type2Check) {
        if (checkSingleType(obj, chkType)) { return true; }
      }
      
      return false;
    }
    
    return checkSingleType(obj, type2Check?.[0]);
  }
}
