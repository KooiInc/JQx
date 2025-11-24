const { IS, maybe, $Wrap, isNothing, xProxy, addSymbolicExtensions } =
  TOAFactory({useSymbolicExtensions: false});

export { IS as default, maybe, $Wrap, xProxy, isNothing, addSymbolicExtensions };

function TOAFactory(specs = {}) {
  const { useSymbolicExtensions } = specs;
  const { shouldbeIsSingleObject, ISOneOf, isExcept, verifyNothingness, xProxy,
          determineType, addSymbolicExtensions, maybe, $Wrap } = TOAHelpers(IS, useSymbolicExtensions);
  xProxy.custom();
  
  if (!!useSymbolicExtensions) { addSymbolicExtensions(); }
  
  return {IS, maybe, $Wrap, isNothing: verifyNothingness, xProxy, addSymbolicExtensions};
  
  function IS(anything, ...shouldBe) {
    const input = typeof anything === `symbol` ? Symbol.isSymbol : anything;
    switch(true) {
      case !!maybe({trial: _ => `isTypes` in (shouldBe?.[0] ?? {})}):
        return shouldbeIsSingleObject(anything, shouldBe[0]);
      default: return shouldBe.length > 1 ? ISOneOf(input, ...shouldBe) : determineType(anything, ...shouldBe);
    }
  }
}

function TOAHelpers(IS, useSymbolicExtensions) {
  const { SymbolAndCustomProxyFactory, maybeFactory, WrapAnyFactory,
          verifyNothingness, determineType } = AUXHelperFactory(IS, typeOf);
  const {xProxy, addSymbolicExtensions} = SymbolAndCustomProxyFactory(IS, typeOf, useSymbolicExtensions);
  const [maybe, $Wrap] = [maybeFactory(), WrapAnyFactory(IS, typeOf)];
  
  return Object.freeze({
    shouldbeIsSingleObject, ISOneOf, isExcept, verifyNothingness, xProxy,
    determineType, addSymbolicExtensions, maybe, $Wrap });
  
  function typeOf(anything) {
    return anything?.[Symbol.proxy] ?? IS(anything);
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
    PROXY: 'toa.proxy'
  };
  
  const TYPE_STRINGS = {
    NAN: 'NaN',
    INFINITY: 'Infinity',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    PROXY_PREFIX: 'Proxy ('
  };
  
  return Object.freeze({
      SymbolAndCustomProxyFactory, maybeFactory, WrapAnyFactory, verifyNothingness, determineType
    }
  );
  
  function addSymbols2Anything(IS, typeOf) {
    if (!Symbol.is) {
      Symbol.is = Symbol.for(SYMBOL_KEYS.IS);
      Symbol.type = Symbol.for(SYMBOL_KEYS.TYPE);
      
      Object.defineProperties(Object.prototype, {
        [Symbol.type]: { get() { return typeOf(this); }, enumerable: false, configurable: false },
        [Symbol.is]: { value: function (...args) { return IS(this, ...args); }, enumerable: false, configurable: false },
      });
      Object.defineProperties(Object, {
        [Symbol.type]: { value(obj) { return typeOf(obj); }, enumerable: false, configurable: false },
        [Symbol.is]: { value: function (obj, ...args) { return IS(obj, ...args); }, enumerable: false, configurable: false },
      });
    }
  }
  
  function SymbolAndCustomProxyFactory(IS, typeOf, useSymbolicExtension) {
    if (!Symbol.isSymbol) { Symbol.isSymbol = Symbol.for(SYMBOL_KEYS.IS_SYMBOL); }
   
    return {xProxy: setCustomOrDefaultProxyFactory(), addSymbolicExtensions: () => addSymbols2Anything(IS, typeOf)};
  }
  
  function constructor2String(obj) {
    const ctor = !isNothing(obj, true) ? Object.getPrototypeOf(obj)?.constructor : {name: `unknown`};
    return ctor.name;
  }
  
  function createCustomProxy(nativeProxy, proxySymbol) {
    Proxy = new nativeProxy(nativeProxy, {
      construct(target, args) {
        const wrappedProxy = new target(...args);
        Object.defineProperty(wrappedProxy, proxySymbol, {
          value: `${TYPE_STRINGS.PROXY_PREFIX}${constructor2String(args[0])})` });
        return wrappedProxy;
      }
    });
    return Proxy;
  }
  
  function setCustomOrDefaultProxyFactory() {
    if (!Symbol.proxy) { Symbol.proxy = Symbol.for(SYMBOL_KEYS.PROXY); }
    const nativeProxy = Proxy;
    return {
      native() { Proxy = nativeProxy; },
      custom() { Proxy = createCustomProxy(nativeProxy, Symbol.proxy); } };
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
