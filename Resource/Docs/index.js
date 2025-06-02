import {default as CreateComponent, createOrRetrieveShadowRoot}
  from "https://cdn.jsdelivr.net/gh/KooiInc/es-webcomponent-factory/Bundle/WebComponentFactory.min.js"
Prism.manual = true;
const isDev = location.host.startsWith(`dev`) || location.host.startsWith(`localhost`);
const importLink =  isDev ?
  `../../index.js` :
  `../../Bundle/jql.min.js`;
const $ = (await import(importLink)).default;
createCopyrightComponent();

const ghLink = $.a({slot: `link`, href: `//codeberg.org/KooiInc/JQx`, target: `_top`, text: `Back to repository`});
$.copyrightSlotted($.span({slot: `year`, class: `yr`, text: String(new Date().getFullYear())}), ghLink.HTML.get(1)).render;

window.$ = $;
const codeReplacements = new Map( [
  [`<`, `&lt;`],
  [`>`, `&gt;`],
  [`&`, a => `&amp;${a[1]}`],
  [`linebreak`, `\n<br>`],
  [`reducebreaks`, `\n\n`] ] );

const setAllCodeStyling = el => {
  const pre = el.closest(`pre`);
  return !pre ? $(el).addClass(`inline`) : $(pre).addClass(`language-javascript`, `line-numbers`);
}
// wrap into .container
const docContainer = $(`.docs`);
$.div({class: `container`})
  .append($.div({class:`docBrowser`})
    .append($(`#navigation`), docContainer))
  .toDOM();
$.log(`Wrapped into container.`);

const perform = performance.now();
document.title = isDev ? `##DEV## ${document.title}` : document.title;
if (isDev) {
  $(`link[rel="icon"]`).replaceWith($.LINK({href: `./devIco.png`, rel: `icon`}));
  window.jql = $;
  window.IS = $.IS;
  window.popup = $.Popup;
}
$.log(`Start documenter...`);
const randomNumber = (max, min = 0) => {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 )
    * (max - min + 1) + min ); };
let documentationData = await fetch(`./documentation.json`).then(r => r.json());
$.log(`Fetched documenter json...`);
import handlerFactory  from "./HandlingFactory.js";
const {clientHandling, allExampleActions} = handlerFactory($);
const groupOrder = ['jql_About', 'static_About', 'instance_About', 'popup_About', 'debuglog_About'];
const groups = groupOrder.reduce((acc, group) =>
  [...acc, {name: group, displayName: group.slice(0, group.indexOf(`About`)).toUpperCase()}], []);
const sliceName = name => name.slice(name.indexOf(`_`) + 1);
const createNavigationItems = ({group, displayName}) => {
  const ul = $(`<ul class="navGroup closed" data-group="${displayName.toLowerCase()}"/>`, $.node(`#navigation`));
  ul.append($(`<li class="grouped">${displayName}<ul class="navGroupItems"></ul></li>`));
  Object.keys(documentationData).filter(v => v.startsWith(group.displayName.toLowerCase()))
    .sort( (a, b) => a.localeCompare(b) )
    .forEach(item => {
      const itemClean = item.replace(/([a-z])\$/gi, `$1_D`);
      const isDeprecated = /--DEPRECATED/.test(documentationData[item]?.description);
      $(`.navGroupItems`, ul[0])
        .append($(`
            <li data-key="${itemClean}">
            <div data-navitem="#${itemClean}"${isDeprecated ? ` class="deprecated"` : ``}>${
              sliceName(item)}</div></li>`));
    });
  return displayName;
};
const docsContainer = $.node(`.docs`);
const handler = clientHandling;
$.delegate(`click`, handler);
$.delegate(`scroll`, `.container`, handler);
const codeMapper = (code, i) => {
  const cleanedCode = code.trim().replace(/\n{3,}/g, codeReplacements.get(`reducebreaks`));

  return `<div class="exContainer"><h3 class="example">Example${
    i > 0 ? ` ${i + 1}` : ``}</h3><pre><code>${cleanedCode}</code></pre></div>`;
};
const getCodeBody = fn => {
  fn = String(fn);
  return fn.slice(fn.indexOf(`{`)+1, -1).replace(/\n {6}/g, `\n`).trim();
}
const convertExamples = descriptionValue => {
  const re = /(?<=<example>)(.|\n)*?(?=<\/example>)/gm;
  const exampleCode = (descriptionValue.match(re) || []).map( (code, i) => codeMapper(code, i) );
  const replaceCB = () => {
    let code = exampleCode.shift();
    
    if (/##EXAMPLECODE/.test(code)) {
      const actionMethodName = code.slice(code.indexOf(`@`) + 1).split(`#`)[0];
      code = code.replace(/##.+##/, allExampleActions[actionMethodName]) +
        `<button class="exRunBttn" data-action="${actionMethodName}">Try it</button>`;
    }

    return code;
  }
  
  return descriptionValue.replace(/<example>(.|\n)*?<\/example>/g, replaceCB);
};
const groupWithExamples = description => /<example>/.test(description) ? convertExamples(description) : description;
const escHtml = str => str
  .replace(/</g, `&lt;`)
  .replace(/&lt;code/g, `<code`)
  .replace(/&lt;\/code/g, `</code`);
const paramStr2Div = value => Object.entries(value).map( ([key, val]) => {
  const prm = /_isobject/i.test(key) ? `[Object&lt;string, any>]` : key;
  return `<div class="param"><code>${escHtml(prm)}</code>: ${escHtml(val)}</div>`;
});

// modified for JQx
groups.forEach( group => {
  const displayName = createNavigationItems({
    group: group,
    displayName: group.displayName.slice(0, -1).replace(`JQL`, `JQx`)
  });

  // create corresponding documentation items in docs
  Object.entries(documentationData)
    .filter( ([itemKey, ]) => itemKey.startsWith(`${group.displayName.toLowerCase()}`))
    .sort( ([key1,], [key2,]) => key1.localeCompare(key2))
    .forEach( ([itemName, itemValue]) => {
      itemValue.description = itemValue.description.trim();
      const isDeprecated = /--DEPRECATED/.test(itemValue.description);
      const itemNameClean = sliceName(itemName);
      let params;
      let exampleCode = [];
      const itemGroupLookup = {
        instance: `[JQL instance].`,
        popup: `[JQL.Popup].`,
        debuglog: `[debugLog].`,
        static: `[JQL].`
      }

      if (itemValue.params?.length) {
        const paramDivs = itemValue.params.reduce((acc, value) => [...acc, paramStr2Div(value)], []);
        params = `<div data-parameters><b>Parameters</b>${paramDivs.join('')}</div>`;
      }

      // insert formatted example code if applicable
      if (/<example>/.test(itemValue.description)) {
        itemValue.description = convertExamples(itemValue.description);
      }

      if (itemNameClean === `About`) {
        return $(`<div data-groupContainer="${displayName}" class="description">
          <h3 class="groupHeader" id="${group.name}">${displayName}</h3>${
          itemValue.description.replace(/\n{3,}/g, `\n`)}</div>`, docsContainer);
      }

      // modified for JQx
      $(`
        <div class="paragraph" data-for="${itemNameClean.replace(/([a-z])\$/gi, `$1_D`)}">
          <h3 class="methodName" id="${itemName.replace(/([a-z])\$/gi, `$1_D`)}">
            <span class="group">${itemGroupLookup[itemName.slice(0, itemName.indexOf(`_`))].replace(`L`, `x`)}</span
            ><span${isDeprecated ? ` class="deprecated"` : ""}>${itemNameClean}</span>
          </h3>
          ${params ?? ``}
          <div class="returnValue"><b>Returns</b>: ${itemValue.returnValue}</div>
          <div class="description">${isDeprecated ? `<b class="red">*deprecated</b> ` : ``}${
              itemValue.description.replace(/\n{2,}/g, `\n`)}</div>
        </div>`, docsContainer);
    });
});

$(`code`).each(setAllCodeStyling);
$.log(`Documenter json parsed to DOM.`);

// free some memory
documentationData = null;

// remove loading message
$(`.docs`).removeClass(`loading`);

//format the code blocks
Prism.highlightAll();
$.log(`Code formatting done.`);

// navigate to top
$(`#jql_About`).html(` (<span class="jqlTitle"><b>JQ</b>uery<b>L</b>ike</span>)`, true);

// display the first item
$(`[data-group="jql"]`).trigger(`click`);
$.log(`Navigation triggered.`);
$.log(`Documenter implementation took ${((performance.now() - perform)/1000).toFixed(3)} seconds`);

const loadItem = QS2Obj();

if (loadItem.load) {
  const load = loadItem.load.replace(/about/, `About`);
  const item2Load = $(findItemCaseInsensitive(load));
  !item2Load.is.empty && item2Load.trigger(`click`);
}

function findItemCaseInsensitive(loadItemKey) {
  return $.nodes(`[data-navitem]`)
    .find(el => el.dataset.navitem?.toLowerCase() === `#${loadItemKey.toLowerCase()}`);
}

function QS2Obj() {
  const search = location.search
  if (search.length > 1) {
    const search = location.search.slice(1);
    return search.split(`&`).reduce((acc, item) => {
      const [key, value] = item.split(`=`);
      return {...acc, [key]: value};
    }, {});
  }
  
  return {};
}

function createCopyrightComponent() {
  CreateComponent( {
    componentName: `copyright-slotted`,
    onConnect(elem) {
      const shadow = createOrRetrieveShadowRoot(elem);
      const componentStyle = Object.assign(
        document.createElement("style"),
        { textContent: `
          :host {
            color: #555;
            display: inline-block;
            position: fixed;
            background-color: #fff;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2;
            border-radius: 4px;
            padding: 2px 0;
            width: 100vw;
            text-align: center;
            box-shadow: 0 2px 14px #999;
          }
          ::slotted(span.yr) {
            font-weight: bold;
            color: green;
          }
          ::slotted(a[target]) {
            text-decoration: none;
            font-weight: bold;
          }
          ::slotted(a[target]):before {
            color: rgba(0, 0, 238, 0.7);
            font-size: 1.1rem;
            padding-right: 2px;
            vertical-align: baseline;
          }
          ::slotted(a[target="_blank"]):before { content: "↗"; }
          ::slotted(a[target="_top"]):before { content: "↺"; }
          ::slotted(a[target]):after {
            content: ' | ';
            color: #000;
            font-weight: normal;
          }
          ::slotted(a[target]:last-child):after { content: ''; margin-right: 2rem; }`
        } );
      const content = Object.assign(
        document.createElement(`div`), {
          innerHTML: `&copy; <span><slot name="year"/></span> KooiInc <slot name="link"/>`})
      shadow.append(componentStyle, content);
    }
  });
  $.allowTag(`copyright-slotted`);
}
