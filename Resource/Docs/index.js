import {default as CreateComponent, createOrRetrieveShadowRoot}
  from "https://cdn.jsdelivr.net/gh/KooiInc/es-webcomponent-factory/Bundle/WebComponentFactory.min.js"
import handlerFactory  from "./HandlingFactory.js";
Prism.manual = true;
const isDev = location.host.startsWith(`dev`) || location.host.startsWith(`localhost`);
const importLink =  isDev ?
  `../../index.js` :
  `../../Bundle/jqx.min.js`;
const $ = (await import(importLink)).default;
window.$ = $;
const {clientHandling, allExampleActions} = handlerFactory($);
createCopyrightComponent();

const chapters = await fetchChapters();
initialize();

function initialize() {
  const handler = clientHandling;
  const docContainer = $(`.docs`);
  const groupOrder = ['jqx_About', 'static_About', 'instance_About', 'popup_About', 'debuglog_About'];
  const [jqxGroup, staticGroup, instanceGroup, popupGroup, debugLogGroup] = createGroups(docContainer, groupOrder);
  createDocsGroup($.node(`[data-groupcontainer="static_About"]`), `JQx`);
  createDocsGroup($.node(`[data-groupcontainer="instance_About"]`), `JQx instance`);
  createDocsGroup($.node(`[data-groupcontainer="popup_About"]`), `JQx.popup`);
  createDocsGroup($.node(`[data-groupcontainer="debuglog_About"]`), `JQx.debugLog`);
  createNavigationBlock(groupOrder);
  $.delegate(`click`, handler);
  $.delegate(`scroll`, handler);
  $(`[data-group="jqx"]`).trigger(`click`);
  Prism.highlightAll();
}

function createNavigationBlock(groupOrder) {
  const navGroups = groupOrder.reduce((acc, group) =>
    [...acc, {name: group, displayName: group.slice(0, group.indexOf(`About`)).toUpperCase()}], []);
  navGroups.forEach( group => {
    const displayName = createNavigationItems({
      group: group,
      displayName: group.displayName.slice(0, -1).replace(`JQL`, `JQx`)
    });});
  $(`.docBrowser`).before($(`#navigation`));
}

function paramStr2Div(value) {
  return Object.entries(value).map( ([key, val]) => {
    const prm = /_isobject/i.test(key) ? `[Object&lt;string, any>]` : key;
    return `<div class="param"><code>${escHtml(prm)}</code>: ${escHtml(val)}</div>`;
  })
}

function escHtml(str) {
  return str
    .replace(/</g, `&lt;`)
    .replace(/&lt;code/g, `<code`)
    .replace(/&lt;\/code/g, `</code`);
}

function createParams(params) {
  const mappedParams = Object.entries(params).reduce((acc, [key, val]) =>
    acc.concat(`<div class="param"><code>${key}</code>: ${escHtml(val || ``)}</div>`), ``)
    
  return $.virtual(`<div data-parameters><b>Parameters</b>${mappedParams}</div>`);
}

function createDocsGroup(forContainer, header) {
  let lastChapter = forContainer;
  const groupId = lastChapter.dataset.groupcontainer;
  const prfx = groupId.slice(0, groupId.indexOf(`_`));
  const staticChapters =
    chapters.filter(chapter => chapter.dataset.id.startsWith(prfx) && !/about$/i.test(chapter.dataset.id))
    .map(chapter => chapter);
  staticChapters.forEach(chapterTemplate => {
    const chapter = chapterTemplate.content;
    const chapterName = chapterTemplate.dataset.id;
    const paramJSON = chapter.querySelector(`[data-params]`).dataset?.params;
    const params = paramJSON && !/none/i.test(paramJSON) && createParams(JSON.parse(paramJSON)[0]) || "";
    const returnValue = escHtml(chapter.querySelector(`[data-return-value]`).dataset.returnValue);
    const chapterTextElement = $.div({class:"description"}, chapter.querySelector(`[data-text]`).innerHTML);
    const isDeprecated = chapterTemplate.dataset.isDeprecated === "true";
    isDeprecated && chapterTextElement.prepend(`<b class="red">*Deprecated*</b>`);
    const returns = returnValue.trim().length ?
      $.div({class: "returnValue"}, `<b>Returns</b>: ${returnValue}`)
      : ``;
    const chapterElement = $.div(
      {class: "paragraph", data: {for: chapterName}},
      `<h3 class="methodName" data-for-id="${chapterName}">
       ${getChapterName(chapterName, header, isDeprecated)}
      </h3>`,
      params,
      returns,
      chapterTextElement,
    ).renderTo(lastChapter, $.at.afterend);
    
    chapterElement.find$(`[data-example]`).each( codeElem => {
      const el$ = codeElem.textContent;
      codeElem.textContent = ``;
      $(codeElem).replaceWith(createExampleCodeElement(el$));
    });
    
    lastChapter = chapterElement;
  });
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
  
  return $.div({class: "exContainer"}, `<h3 className="example">Example</h3>`)
    .append(theCodeElement)
    .append($.virtual(`<button class="exRunBttn" data-action="${codeId}">Try it</button>`));
}

function getChapterName(name, prefix, isDeprecated = false) {
  return `<span class="group">[${prefix}].</span
    ><span ${isDeprecated ? `class="deprecated"` : ""}>${
      name.slice(name.indexOf(`_`) + 1)}</span>`;
}

function createGroups(docContainer, groupOrder) {
  const groupElements = groupOrder
    .map(group => chapters.find(el => el.dataset.id === group))
    .map(groupTemplate => {
      const groupId = groupTemplate.dataset.id;
      const displayName = createGroupname(groupId);
      const text = groupTemplate.content.querySelector(`[data-text]`).outerHTML;
      // TODO
      return $.div(
        { data: {groupcontainer: groupId}, class: "description" },
        `<h3 class="groupHeader" data-group-id="${groupId}">${displayName}</h3>`)
        .append(text)
    });
  
  $.div({class: `container`})
    .append(docContainer
      .append($.div({class: `docBrowser`}, ...groupElements)))
    .render;
  
  $(`[data-example]`).each( codeElem => {
    const elText = codeElem.textContent;
    codeElem.textContent = ``;
    $(codeElem).replaceWith(createExampleCodeElement(elText));
  });
  
  return $.nodes(`[data-groupcontainer]`);
}

function createGroupname(name) {
  const displayName = name.slice(0, name.indexOf(`_`)).toUpperCase().replace('X', `x`);
  return displayName.startsWith(`JQx`) ? `<span class="jqxTitle"><b>JQ</b>uery</b>-<b>x</b></span>` : displayName;
}

function createNavigationItems({group, displayName}) {
  const ul = $(`<ul class="navGroup closed" data-group="${displayName.toLowerCase()}"/>`, $.node(`#navigation`));
  ul.append($(`<li class="grouped">${displayName}<ul class="navGroupItems"></ul></li>`));
  
  const data = chapters.map( chapter => {
    const chapterId = chapter.dataset.id;
    return {
      label: chapterId,
      isDeprecated: chapter.dataset.isDeprecated === "true",
      shortName: chapterId.slice(chapterId.indexOf(`_`) + 1) };
  } );
  data.filter(v => v.label.startsWith(group.displayName.toLowerCase()))
    .forEach( item => {
      //const itemClean = item.label.replace(/([a-z])\$/gi, `$1_D`);
      $(`.navGroupItems`, ul[0])
        .append($(`
            <li data-key="${item.label}">
            <div data-navitem="${item.label}"${
              item.isDeprecated ? ` class="deprecated"` : ``}>${item.shortName}</div></li>`));
    });
  
  return displayName;
}
async function fetchChapters() {
  const templatesImport = await fetch(`./templates.html`).then(r => r.text());
  $.allowTag(`template`);
  $.log(`Fetched documenter templates...`);
  const templatesElsSortedById = $.div({html: templatesImport}).find$(`template`).collection
    .sort((el1, el2) => el1.dataset.id.localeCompare(el2.dataset.id));
  return templatesElsSortedById;
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
