const { IS, maybe, $Wrap, xProxy, isNothing } = TOAFactory();
export { IS as default, maybe, $Wrap, xProxy, isNothing };

function TOAFactory() {
  Symbol.proxy = Symbol.for(`toa.proxy`);
  Symbol.is = Symbol.for(`toa.is`);
  Symbol.type = Symbol.for(`toa.type`);
  Symbol.isSymbol = Symbol.for(`toa.isASymbol`);
  addSymbols2Anything();
  const maybe = maybeFactory();
  const [$Wrap, xProxy] = [WrapAnyFactory(), setProxyFactory()];
  xProxy.custom();
  return {IS, maybe, $Wrap, isNothing, xProxy};
  
  function IS(anything, ...shouldBe) {
    if (maybe({trial: _ => `isTypes` in (shouldBe?.[0] ?? {})})) {
      const isTypeObj = shouldBe[0];
      return `defaultValue` in (isTypeObj)
        ? isOrDefault(anything, isTypeObj) : `notTypes` in isTypeObj
          ? isExcept(anything, isTypeObj) : IS(anything, ...[isTypeObj.isTypes].flat());
    }
    
    const input = typeof anything === `symbol` ? Symbol.isSymbol : anything;
    return shouldBe.length > 1 ? ISOneOf(input, ...shouldBe) : determineType(anything, ...shouldBe);
  }
  
  function typeOf(anything) {
    return anything?.[Symbol.proxy] ?? IS(anything);
  }
  
  function determineType(input, ...shouldBe) {
    let {
      noInput,
      noShouldbe,
      compareTo,
      inputCTOR,
      isNaN,
      isInfinity,
      shouldBeFirstElementIsNothing
    } = processInput(input, ...shouldBe);
    shouldBe = shouldBe.length && shouldBe[0];
    
    switch (true) {
      case shouldBeFirstElementIsNothing:
        return String(input) === String(compareTo);
      case input?.[Symbol.proxy] && noShouldbe:
        return input[Symbol.proxy];
      case isNaN:
        return noShouldbe ? `NaN` : maybe({trial: _ => String(compareTo)}) === String(input);
      case isInfinity:
        return noShouldbe ? `Infinity` : maybe({trial: _ => String(compareTo)}) === String(input);
      case noInput:
        return noShouldbe ? String(input) : String(compareTo) === String(input);
      case inputCTOR === Boolean:
        return !shouldBe ? `Boolean` : inputCTOR === shouldBe;
      default:
        return getResult(input, shouldBe, noShouldbe, getMe(input, inputCTOR));
    }
  }
  
  function getMe(input, inputCTOR) {
    return input === 0 ? Number : input === `` ? String : !input ? {name: String(input)} : inputCTOR;
  }
  
  function processInput(input, ...shouldBe) {
    const noShouldbe = shouldBe.length < 1;
    const compareTo = !noShouldbe && shouldBe[0];
    const shouldBeFirstElementIsNothing = !noShouldbe && isNothing(shouldBe[0]);
    const noInput = input === undefined || input === null;
    const inputCTOR = !noInput && Object.getPrototypeOf(input)?.constructor;
    const isNaN = maybe({trial: _ => String(input)}) === `NaN`;
    const isInfinity = maybe({trial: _ => String(input)}) === `Infinity`;
    return {noInput, noShouldbe, compareTo, inputCTOR, isNaN, isInfinity, shouldBeFirstElementIsNothing};
  }
  
  function getResult(input, compareWith, noShouldbe, me) {
    switch(true) {
      case (!noShouldbe && compareWith === input) ||
              (input?.[Symbol.proxy] && compareWith === Proxy):
        return true;
      case maybe({trial: _ => String(compareWith)}) === `NaN`:
        return String(input) === `NaN`;
      case input?.[Symbol.toStringTag] && IS(compareWith, String):
        return String(compareWith) === input[Symbol.toStringTag];
      default:
        return compareWith
          ? maybe({trial: _ => input instanceof compareWith,}) ||
            compareWith === me || compareWith === Object.getPrototypeOf(me) ||
            `${compareWith?.name}` === me?.name
          : input?.[Symbol.toStringTag] && `[object ${input?.[Symbol.toStringTag]}]` ||
              me?.name ||
              String(me);
    }
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
    const tryFn = (maybeFn, maybeError) => maybeFn?.constructor === Function ? maybeFn(maybeError) : undefined;
    return function ({trial, whenError = () => undefined} = {}) {
      try {
        return tryFn(trial)
      } catch (err) {
        return tryFn(whenError, err)
      }
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
  
  function ctor2String(obj) {
    const str = String(Object.getPrototypeOf(obj)?.constructor);
    return str.slice(str.indexOf(`ion`) + 3, str.indexOf(`(`)).trim();
  }
  
  function modifySetter(setterMethod2Modify) {
    const oldSetter = setterMethod2Modify.set;
    setterMethod2Modify.set = (target, key, value) => {
      if (key === Symbol.proxy) {
        return target[key] = value;
      }
      
      return oldSetter(target, key, value);
    }
    
    return setterMethod2Modify;
  }
  
  function setProxyFactory() {
    const nativeProxy = Proxy;
    return {
      native() {
        Proxy = nativeProxy;
      },
      custom() {
        // adaptation of https://stackoverflow.com/a/53463589
        Proxy = new nativeProxy(nativeProxy, {
          construct(target, args) {
            for (let item of args) {
              if (item.set) {
                item = modifySetter(item);
              }
            }
            
            const wrappedProxy = new target(...args);
            wrappedProxy[Symbol.proxy] = `Proxy (${ctor2String(args[0])})`;
            return wrappedProxy;
          }
        })
      }
    }
  }
}