import { logTime } from "./Utilities.js";
import { createElementFromHtmlString, element2DOM, insertPositions } from "./DOM.js";
import {IS, jqx} from "./JQxExtensionHelpers.js";
import {logStyling} from "./EmbedResources.js";
let logSystem = false;
let useLogging = false;
let log2Console = true;
let reverseLogging = false;
let useHtml = true;
let editLogRule;
const getLogBox = () => jqx(`#logBox`);
const logBoxTextBoxId = `#jqx_logger`;
const setStyling4Log = setStyle => { logStyling?.forEach(selector => setStyle(selector)); };

const createLogElement = () => {
  if (logStyling) {
    setStyling4Log(editLogRule);
  }
  const jqx_logger_element_name = useHtml ? `div` : `pre`;
  const loggingFieldSet = `<div id="logBox"><div class="legend"><div></div></div><${
    jqx_logger_element_name} id="jqx_logger"></${jqx_logger_element_name}></div>`;
  element2DOM(createElementFromHtmlString(loggingFieldSet), undefined, insertPositions.AfterBegin);
  return jqx.node(logBoxTextBoxId);
};

const decodeForConsole = something => IS(something, String) &&
  Object.assign(document.createElement(`textarea`), {innerHTML: something}).textContent || something;

const Log = (...args) => {
    const isInstanceLog = args[0] === `fromStatic`;
    args = isInstanceLog ? args.slice(1) : args;
    if ( isInstanceLog && !useLogging) {
      return args.forEach(arg => console.info(`${logTime()} ✔ ${decodeForConsole(arg)}`));
    }

    if (!useLogging) { return; }

    if (!log2Console && !jqx.node(`#logBox`)) {
      editLogRule = jqx.createStyle(`JQxLogCSS`);
      createLogElement();
    }

    const logLine = arg => `${IS(arg, Object) ? JSON.stringify(arg, null, 2) : arg}\n`;

    args.forEach( arg => log2Console
      ? console.info(`${logTime()} ✔ ${decodeForConsole(arg)}`)
      : jqx.node(`#jqx_logger`).insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `<div class="entry">${logTime()} ${logLine(arg.replace(/\n/g, `<br>`))}</div>`)
    );
};

const logActive = {
  on() {  useLogging = true; Log(`Logging activated`); },
  off() { useLogging = false; console.log(`Logging deactivated`) },
}

const setSystemLog = {
  on() { logSystem = true; },
  off() { logSystem = false; },
};

const systemLog = (...logTxt) => logSystem && Log(...logTxt);

const debugLog = {
  get isConsole() { return log2Console === true; },
  get isOn() { return useLogging; },
  isVisible: function() { return jqx(`#jqx_logger`).is(`visible`); },
  on() {
    logActive.on();
    setSystemLog.on();
    if (!log2Console) {
      getLogBox()?.addClass(`visible`);
    }
    Log(`Debug logging started. Every call to [jqx instance] is logged`);
    return debugLog;
  },
  off() {
    if (!getLogBox().isEmpty) {
      setSystemLog.off();
      Log(`Debug logging stopped`);
      getLogBox()?.removeClass(`visible`);
    }
    logActive.off();
    return debugLog;
  },
  toConsole: {
    on() {
      log2Console = true;
      Log(`Started logging to console`);
      return debugLog;
    },
    off() {
      Log(`Stopped logging to console (except error messages)`);
      log2Console = false;
      return debugLog;
    }
  },
  remove() {
    logActive.off();
    setSystemLog.off();
    getLogBox()?.remove();
    console.clear();
    console.log(`${logTime()} logging completely disabled and all entries removed`);
    return debugLog;
  },
  log: function(...args) {
    Log(...args);
    return debugLog;
  },
  hide() {
    getLogBox()?.removeClass(`visible`);
    return debugLog;
  },
  show: () => {
    getLogBox()?.addClass(`visible`);
    return debugLog;
  },
  get reversed() {
    return {
      on: () => {
        reverseLogging = true;
        Log(`Reverse logging set: now logging bottom to top (latest first)`);
        jqx(`#logBox .legend`).addClass(`reversed`);
        return debugLog;
      },
      off: () => {
        reverseLogging = false;
        jqx(`#logBox .legend`).removeClass(`reversed`);
        Log(`Reverse logging reset: now logging chronological (latest last)`);
        return debugLog;
      },
    };
  },
  clear() {
    jqx(logBoxTextBoxId).text(``);
    console.clear();
    Log(`Logging cleared`);
    return debugLog;
  }
};

export { Log, debugLog, systemLog };
