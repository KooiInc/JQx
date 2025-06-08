const perform = performance.now();
import {default as CreateComponent, createOrRetrieveShadowRoot} from "./WebComponentFactory.min.js";
// ^ see https://cdn.jsdelivr.net/gh/KooiInc/es-webcomponent-factor
import handlerFactory  from "./HandlingFactory.js";
const isDev = location.host.startsWith(`dev`) || location.host.startsWith(`localhost`);
const importLink =  isDev ?
  `../../index.js` :
  `../../Bundle/jqx.min.js`;
const $ = (await import(importLink)).default;
window.$ = $;
const {clientHandling, allExampleActions, documentationTemplates, docContainer, orderedGroups}
  = await getUsedVariablesInTopLevelScope();

createDocument();

function createDocument() {
  createCopyrightComponent();
  setupHandling();
  createGroupingChapters();
  createGroupChapters();
  createNavigationBlock();
  documentCreationDone();
}

function setupHandling() {
  const handler = clientHandling;
  $.delegate(`click`, handler);
  $.delegate(`scroll`, handler);
  $.log(`Event handling set ...`);
}

function createGroupChapters() {
  createChaptersGroup($.node(`[data-groupcontainer="static_About"]`), `JQx`);
  createChaptersGroup($.node(`[data-groupcontainer="instance_About"]`), `JQx instance`);
  createChaptersGroup($.node(`[data-groupcontainer="popup_About"]`), `JQx.popup`);
  createChaptersGroup($.node(`[data-groupcontainer="debuglog_About"]`), `JQx.debugLog`);
  $.log(`Documentation chapters created ...`);
}

function createNavigationBlock() {
  for (const group of orderedGroups) { createNavigationItems(group); }
  
  $(`.docBrowser`).before($(`#navigation`));
  $.log(`Navigation block created ...`);
}

function createChaptersGroup(forContainer, header) {
  let lastChapter = forContainer;
  const groupId = lastChapter.dataset.groupcontainer;
  const prfx = groupId.slice(0, groupId.indexOf(`_`));
  
  for (const groupChapter of documentationTemplates.templates) {
    if (groupChapter.dataset.id.startsWith(prfx) && !/about$/i.test(groupChapter.dataset.id)) {
      const { chapter, chapterName, paramJSON, params, returns, chapterTextElement, isDeprecated }
        = getChapterProps(groupChapter);
      
      isDeprecated && chapterTextElement.prepend(`<b class="red">*Deprecated*</b>`);
      
      const chapterElement
        = createChapterElement( {chapterName, header, isDeprecated, params, returns, chapterTextElement});
      
      for (const codeElementPlaceholder of chapterElement.find(`[data-example]`)) {
        createCodeElement(codeElementPlaceholder);
      }
      
      chapterElement.find$(`h3.example`).each(numberExample);
      chapterElement.toDOM(lastChapter, $.at.afterend);
      lastChapter = chapterElement;
    }
  }
}

function createCodeElement(codeElemPlaceholder) {
  const el$ = codeElemPlaceholder.textContent;
  codeElemPlaceholder.textContent = ``;
  const code = createExampleCodeElement(el$);
  codeElemPlaceholder.replaceWith(code[0]);
}

function createChapterElement(aggregatedChapterProps) {
  const {chapterName, header, isDeprecated, params, returns, chapterTextElement} = aggregatedChapterProps;
  
  return $.div(
    {class: "paragraph", data: {for: chapterName}},
    `<h3 class="methodName" data-for-id="${chapterName}">
       ${getChapterName(chapterName, header, isDeprecated)}
      </h3>`,
    params,
    returns,
    chapterTextElement,
  );
}

function getChapterProps(chapterTemplate) {
  const chapter = chapterTemplate.content;
  const paramJSON = chapter.querySelector(`[data-params]`).dataset?.params;
  const returnValue = escHtml(chapter.querySelector(`[data-return-value]`).dataset.returnValue)
  const returns = returnValue.trim().length ?
    $.div({class: "returnValue"}, `<b>Returns</b>: ${returnValue}`)
    : ``;
  return {
     chapter,
     chapterName: chapterTemplate.dataset.id,
     paramJSON,
     params: paramJSON && !/none/i.test(paramJSON) && createParams(paramJSON) || "",
     returns,
     chapterTextElement: $.div({class:"description"}, chapter.querySelector(`[data-text]`).innerHTML),
     isDeprecated: chapterTemplate.dataset.isDeprecated === "true",
  };
}

function paramStr2Div(value) {
  const params = [];
  for ([key, val] of Object.entries(value)) {
    const prm = /_isobject/i.test(key) ? `[Object&lt;string, any>]` : key;
    params.push(`<div class="param"><code>${escHtml(prm)}</code>: ${escHtml(val)}</div>`);
  }
  return params;
}

function escHtml(str) {
  return str
    .replace(/</g, `&lt;`)
    .replace(/&lt;code/g, `<code`)
    .replace(/&lt;\/code/g, `</code`);
}

function createParams(params) {
  params = JSON.parse(params).reduce((acc, param) => {
    const [name, value] = Object.entries(param);
    if (!name || !value) { return acc; }
    return {...acc, [name]: value};
  });
  
  delete params.instance; // todo
  
  if (Object.keys(params).length < 1) {
    return;
  }
  
  const mappedParams = Object.entries(params).reduce((acc, [key, val]) =>
    acc.concat(`<div class="param"><code>${key}</code>: ${escHtml(val || ``)}</div>`), ``)
 
  return $.virtual(`<div data-parameters><b>Parameters</b>${mappedParams}</div>`);
}

function getCodeElement(content) {
  return $.pre(
    {class: "line-numbers language-javascript"}, $.code({class: "language-javascript"}, content)
  );
}

function createExampleCodeElement(code) {
  const codeId = code.split(/(##)|@/)[4]
  const codeBody = allExampleActions[codeId];
  
  if (!codeBody) {
    return getCodeElement(escHtml(code).trim());
  }
  
  const theCodeElement = getCodeElement(codeBody);
  const head = $.h3({className:"example", text: `Example`});
  
  return $.div(
    {class: "exContainer"}, head)
    .append(theCodeElement)
    .append($.virtual(`<button class="exRunBttn" data-action="${codeId}">Try it</button>`));
}

function getChapterName(name, prefix, isDeprecated = false) {
  return `<span class="group">[${prefix}].</span
    ><span ${isDeprecated ? `class="deprecated"` : ""}>${
      name.slice(name.indexOf(`_`) + 1)}</span>`;
}

function numberExample(el, i) {
  el.textContent += i > 0 ? ` ${i + 1}` : ``;
}

function createGroupingChapters() {
  const groupElements = orderedGroups
    .map(({groupId, groupLabel}) => documentationTemplates.templates.find(el => el.dataset.id === groupId))
    .map(groupTemplate => {
      const groupId = groupTemplate.dataset.id;
      const displayName = createGroupname(groupId);
      const text = groupTemplate.content.querySelector(`[data-text]`).outerHTML;
      
      return $.div(
        { data: {groupcontainer: groupId}, class: "description" },
        `<h3 class="groupHeader" data-group-id="${groupId}">${displayName}</h3>`)
        .append(text);
    });
  
  renderGroupingChapters(groupElements);
  
  $.log(`"About" chapters created ...`);
}

function renderGroupingChapters(groupElements) {
  $.div(
    {class: `container`},
    docContainer.append($.div({class: `docBrowser`}, ...groupElements))
  ).render;
  
  for (const group of [...groupElements]) {
    group.find$(`[data-example]`).each( createCodeElement );
    group.find$(`h3.example`).each( numberExample );
  }
}

function createGroupname(name) {
  const displayName = name.slice(0, name.indexOf(`_`)).toUpperCase().replace('X', `x`);
  return displayName.startsWith(`JQx`) ? `<span class="jqxTitle"><b>JQ</b>uery</b>-<b>x</b></span>` : displayName;
}

function createNavigationItems({groupLabel, groupLabelLC}) {
  const ul = $(`<ul class="navGroup closed" data-group="${groupLabel.toLowerCase()}"/>`, $.node(`#navigation`));
  ul.append($(`<li class="grouped">${groupLabel}<ul class="navGroupItems"></ul></li>`));
  
  const data = getNavProps(documentationTemplates.templates);
  
  for (const item of data.filter(v => v.label.startsWith(groupLabel.toLowerCase()))) {
    $(`.navGroupItems`, ul)
    .append($(`
      <li data-key="${item.label}">
        <div data-navitem="${item.label}"${
          item.isDeprecated ? ` class="deprecated"` : ``}>${item.shortName}
        </div>
      </li>`));
  }
}

function getNavProps(chapters) {
  const mappedChapterData = [];
  
  for (const chapter of chapters) {
    const chapterId = chapter.dataset.id;
    mappedChapterData.push({
      label: chapter.dataset.id,
      isDeprecated: chapter.dataset.isDeprecated === "true" === "true",
      shortName: chapterId.slice(chapterId.indexOf(`_`) + 1)
    });
  }
  
  return mappedChapterData;
}

function documentCreationDone() {
  $(`.docBrowser`).append($.div({class: "spacer"}));
  $(`[data-group="jqx"]`).trigger(`click`);
  Prism.highlightAll();
  delete documentationTemplates.templates;
  $.log(`Document creation/implementation (including imports and formatting code) took ${
    ((performance.now() - perform)/1000).toFixed(3)} seconds`);
}

async function getUsedVariablesInTopLevelScope() {
  const {clientHandling, allExampleActions} = handlerFactory($);
  let documentationTemplates = await fetchAllChaptersFromTemplateDocument();
  const templates = documentationTemplates.templates;
  const docContainer = $(`.docs`);
  const orderedGroups = [
    { groupId: `jqx_About`, groupLabel: `JQx` },
    { groupId: `static_About`, groupLabel: `Static` },
    { groupId: `instance_About`, groupLabel: `Instance` },
    { groupId: `popup_About`, groupLabel: `Popup` },
    { groupId: `debuglog_About`, groupLabel: `Debuglog` }
  ];
  return {clientHandling, allExampleActions, documentationTemplates, docContainer, orderedGroups};
}

async function fetchAllChaptersFromTemplateDocument() {
  const templatesImport = await fetch(`./templates.html`).then(r => r.text());
  $.allowTag(`template`);
  $.log(`Fetched documenter templates...`);
  const templatesElsSortedById = $.div({html: templatesImport}).find$(`template`).collection
    .sort((el1, el2) => el1.dataset.id.localeCompare(el2.dataset.id));
  return {templates: templatesElsSortedById};
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
  const ghLink = $.a({slot: `link`, href: `//codeberg.org/KooiInc/JQx`, target: `_top`, text: `Back to repository`});
  $.copyrightSlotted(
    $.span({slot: `year`, class: `yr`, text: String(new Date().getFullYear())}),
    ghLink.HTML.get(1)
  ).render;
  $.log(`Copyright component created and inserted.`);
}
