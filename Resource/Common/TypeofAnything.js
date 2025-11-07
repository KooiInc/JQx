const { IS, maybe, $Wrap, isNothing, xProxy, addSymbolicExtensions } =
  TOAFactory({useSymbolicExtensions: false});
export { IS as default, maybe, $Wrap, xProxy, isNothing, addSymbolicExtensions };

function TOAFactory(specs = {}) {
  const {useSymbolicExtensions} = specs;
  const {xProxy, addSymbolicExtensions} = SymbolAndCustomProxyFactory(IS, typeOf, useSymbolicExtensions);
  const maybe = maybeFactory();
  const [$Wrap] = [WrapAnyFactory()];
  xProxy.custom();
  !!useSymbolicExtensions && addSymbolicExtensions();
  
  return {IS, maybe, $Wrap, isNothing, xProxy, addSymbolicExtensions};
  
  function IS(anything, ...shouldBe) {
    const input = typeof anything === `symbol` ? Symbol.isSymbol : anything;
    switch(true) {
      case !!maybe({trial: _ => `isTypes` in (shouldBe?.[0] ?? {})}): return ISShouldIsObject(anything, shouldBe[0]);
      default: return shouldBe.length > 1 ? ISOneOf(input, ...shouldBe) : determineType(anything, ...shouldBe);
    }
  }
  
  function ISShouldIsObject(anything, isTypeObj) {
    switch(true) {
      case `defaultValue` in isTypeObj: return isOrDefault(anything, isTypeObj);
      case `notTypes` in isTypeObj: return isExcept(anything, isTypeObj);
      default: return IS(anything, ...[isTypeObj.isTypes].flat());
    }
  }
  
  function typeOf(anything) {
    return anything?.[Symbol.proxy] ?? IS(anything);
  }
  
  function determineType(input, ...shouldBe) {
    let { noInput, noShouldbe, compareTo, inputCTOR, isNaN, isInfinity, shouldBeFirstElementIsNothing } =
      processInput(input, ...shouldBe);
    shouldBe = shouldBe.length && shouldBe[0];
    
    switch (true) {
      case shouldBeFirstElementIsNothing: return String(input) === String(compareTo);
      case input?.[Symbol.proxy] && noShouldbe: return input[Symbol.proxy];
      case isNaN: return noShouldbe ? `NaN` : String(compareTo) === String(input);
      case isInfinity: return noShouldbe ? `Infinity` : String(compareTo) === String(input);
      case noInput: return noShouldbe ? String(input) : String(compareTo) === String(input);
      case inputCTOR === Boolean: return !shouldBe ? `Boolean` : inputCTOR === shouldBe;
      default: return getResult(input, shouldBe, noShouldbe, getMe(input, inputCTOR));
    }
  }
  
  function processInput(input, ...shouldBe) {
    const noShouldbe = shouldBe.length < 1;
    const noInput = input === undefined || input === null;
    
    return {
      noInput,
      noShouldbe,
      compareTo: !noShouldbe && shouldBe[0],
      inputCTOR: !noInput && Object.getPrototypeOf(input)?.constructor,
      isNaN: Number.isNaN(input) || maybe({trial: _ => String(input) === `NaN`}),
      isInfinity: maybe({trial: _ => String(input)}) === `Infinity`,
      shouldBeFirstElementIsNothing: !noShouldbe && isNothing(shouldBe[0])
    };
  }
  
  function getMe(input, inputCTOR) {
    switch(true) {
      case input === 0: return Number;
      case input === ``: return String;
      case !input: return {name: String(input)};
      default: return inputCTOR;
    }
  }
  
  function getResult(input, compareWith, noShouldbe, me) {
    switch(true) {
      case (!noShouldbe && compareWith === input) || (input?.[Symbol.proxy] && compareWith === Proxy): return true;
      case String(compareWith) === `NaN`: return String(input) === `NaN`;
      case input?.[Symbol.toStringTag] && IS(compareWith, String): return String(compareWith) === input[Symbol.toStringTag];
      default: return compareWith ? resultWithComparison(input, compareWith, me) : resultWithoutComparison(input, me);
    }
  }
  
  function resultWithoutComparison(input, me) {
    return input?.[Symbol.toStringTag] && `[object ${input?.[Symbol.toStringTag]}]` || me?.name || String(me);
  }
  
  function resultWithComparison(input, compareWith, me) {
    return maybe({trial: _ => input instanceof compareWith}) || compareWith === me ||
      compareWith === Object.getPrototypeOf(me) || `${compareWith?.name}` === me?.name;
  }
  
  function ISOneOf(obj, ...params) {
    return params.some(param => IS(obj, param));
  }
  
  function isNothing(maybeNothing, all = false) {
    let nada = maybeNothing === null || maybeNothing === undefined;
    nada = all ? nada || IS(maybeNothing, Infinity) || IS(maybeNothing, NaN) : nada;
    return nada;
  }
  
  function maybeFactory() {
    const errFn = err => undefined;
    return function({trial, whenError = errFn } = {}) {
      try { return trial(); } catch (err) { return whenError(err); }
    };
  }
  
  function WrapAnyFactory() {
    return function (someObj) {
      return Object.freeze({
        get value() { return someObj; },
        get [Symbol.type]() { return typeOf(someObj); },
        get type() { return typeOf(someObj); },
        [Symbol.is](...args) { return IS(someObj, ...args); },
        is(...args) { return IS(someObj, ...args); }
      });
    }
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
  
  function addSymbols2Anything() {
    if (!Object.getOwnPropertyDescriptors(Object.prototype)[Symbol.is]) {
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
  
  function modifySetter(setterMethod2Modify) {
    const oldSetter = setterMethod2Modify.set;
    setterMethod2Modify.set = (target, key, value) => {
      if (key === Symbol.proxy) { return target[key] = value; }
      return oldSetter(target, key, value);
    }
   
    return setterMethod2Modify;
  }
}

function SymbolAndCustomProxyFactory(IS, typeOf, useSymbolicExtension) {
  if (!Symbol.isSymbol) { Symbol.isSymbol = Symbol.for(`toa.isASymbol`); }
  
  return {xProxy: setProxyFactory(), addSymbolicExtensions: addSymbols2Anything};
  
  function addSymbols2Anything() {
    if (!Symbol.is) {
      Symbol.is = Symbol.for(`toa.is`);
      Symbol.type = Symbol.for(`toa.type`);
    }
    
    if (!Object.getOwnPropertyDescriptors(Object.prototype)[Symbol.is]) {
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
  
  function ctor2String(obj) {
    const ctor = Object.getPrototypeOf(obj)?.constructor;
    return ctor?.name || `Object`;
  }
  
  function createCustomProxyFactory(nativeProxy) {
    Proxy = new nativeProxy(nativeProxy, {
      construct(target, args) {
        for (let item of args) { if (item.set) { item = modifySetter(item); } }
        const wrappedProxy = new target(...args);
        wrappedProxy[Symbol.proxy] = `Proxy (${ctor2String(args[0])})`;
        return wrappedProxy;
      }
    });
    return Proxy;
  }
  
  function setProxyFactory() {
    if (!Symbol.proxy) { Symbol.proxy = Symbol.for("toa.proxy"); }
    const nativeProxy = Proxy;
    return {
      native() { Proxy = nativeProxy; },
      custom() { Proxy = createCustomProxyFactory(nativeProxy); } };
  }
}
