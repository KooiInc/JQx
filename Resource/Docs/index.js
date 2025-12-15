import {default as CreateComponent, createOrRetrieveShadowRoot} from "../Common/Sites/WebComponentFactory.min.js";
// ^ see https://github.com/KooiInc/es-webcomponent-factory
import handlerFactory  from "./DocumentationHandlingFactory.js";
const isDev = location.host.startsWith(`dev`) || location.host.startsWith(`localhost`);
const importLink =  isDev ?
  `../../index.js` :
  `../../Bundle/jqx.min.js`;
const $ = (await import(importLink)).default;
window.$ = $;
$.logger.enable;
const loader = $.div({class: "spin"}, `Loading...`).render;
const perform = performance.now();
const templatesImport = await fetch(`./templates.html`).then(r => r.text());
const {componentStyle, clientHandling, allExampleActions,
  documentationTemplates, orderedGroups} = getVariablesInAllScopes();
createCopyrightComponent();
const docContainer = $.div({class: `docs`});
const mainContainer = createGroupingChapters();
createDocument();

function createDocument() {
  injectFavIcon();
  createGroupChapters();
  createNavigationBlock();
  mainContainer.render;
  finalizeDocumentCreation();
}

function createGroupingChapters() {
  const groupElements = orderedGroups
    .map(({groupId, groupLabel}) => documentationTemplates.templates.find(el => el.dataset.id === groupId))
    .map(groupTemplate => {
      const groupId = groupTemplate.dataset.id;
      const displayName = createGroupHeaderLabel(groupId);
      const text = groupTemplate.content.querySelector(`[data-text]`).outerHTML;

      return $.div(
          { data: {groupcontainer: groupId}, class: "description" },
          $.h3({class: `groupHeader`, data: {groupId: groupId}}, displayName))
        .append(text);
    });
  $.log(`"About" chapters rendered...`);
  
  return renderGroupingChapters(groupElements);
}

function createGroupChapters() {
  createChaptersGroup(mainContainer.node.querySelector(`[data-groupcontainer="static_About"]`), `JQx`);
  createChaptersGroup(mainContainer.node.querySelector(`[data-groupcontainer="instance_About"]`), `JQx instance`);
  createChaptersGroup(mainContainer.node.querySelector(`.container [data-groupcontainer="popup_About"]`), `JQx.Popup`);
  $.log(`Documentation chapters rendered...`);
}

function createNavigationBlock() {
  const nav = $.div({id: `navigation`});
  
  for (const group of orderedGroups) {
    createNavigationItems(group.groupId, nav);
  }
  mainContainer.find$(`.docs`).append(nav);
  $.log(`Navigation block rendered...`);
}

function debug(...args) {
  console.warn(`!!!`, ...args);
}

function createNavigationItems(groupLabel, nav) {
  const ul = $.ul({
    class: "navGroup closed",
    data: {group: `${groupLabel}`}
  }).appendTo(nav);
  const groupItems = $.li({class: "grouped"}, `${groupLabel}`, $.ul({class: `navGroupItems`}))
    .appendTo(ul);
  
  const groupUl = ul.find$(`ul`);
  const data = getNavigationElementProps(documentationTemplates.templates);
  const navGroupUl = $.div({class: `navGroupItems`}).appendTo(groupUl);

  for (const item of data.filter(v => v.label.startsWith(groupLabel.slice(0, groupLabel.indexOf(`_`) + 1)))) {
    navGroupUl.append($.li({data: {key: item.label}},
        $.div({data: {navitem: item.label}, class: (item.isDeprecated ? `deprecated` : ``)},
          item.shortName)
      )
    );
  }
}

function getNavigationElementProps(chapters) {
  const mappedChapterData = [];
  
  for (const chapter of chapters) {
    mappedChapterData.push({
      label: chapter.dataset.id,
      isDeprecated: chapter.dataset.isDeprecated === "true",
      shortName: removeGroupname(chapter.dataset.id)
    });
  }
  
  return mappedChapterData;
}

function injectFavIcon() {
  const icons = {
    github: {href: "https://github.githubassets.com/favicons/favicon.png"},
    codeberg: {href: "../Common/Sites/codebergicon.ico"},
    local: {href: "../Common/Sites/devico.png"},
  };
  const currentLink = $(`head link[rel="icon"]`);
  const link = $.link({rel: "icon"});

  return /github/i.test(location.href)
    ? currentLink.replaceWith(link.attr(icons.github))
    : /codeberg/i.test(location.href)
      ? currentLink.replaceWith(link.attr(icons.codeberg))
      : currentLink.replaceWith(link.attr(icons.local));
}

function finalizeDocumentCreation() {
  setupHandling();
  const origin = /codeberg/i.test(location.href) ? `CB` : `GH`;
  $(`.docBrowser`).append($.div({class: "spacer"}));
  $(`[data-group="jqx"]`).trigger(`click`);
  hljs.highlightAll();
  !/local/i.test(location.href) && $.img({src: `https://sdn.nicon.nl/px0_${origin}-JQxDocs.png`});
  delete documentationTemplates.templates;

  $.log(`Document creation/implementation (without imports) took ${
    ((performance.now() - perform)/1000).toFixed(3)} seconds`);
  $(`.spin`).remove();
  if (/navTo/.test(location.search)) {
    const params = getSearchParams();
    return $(`[data-navitem='${params.navTo.trim()}']`).trigger(`click`);
  }
  
  return $(`[data-navitem='jqx_About']`).trigger(`click`);
}

function getSearchParams() {
  return location.search.slice(1).split(`&`)
    .reduce((acc, v) => {
      const [key, value] = v.split("=");
      return {...acc, [key]: value};
    }, {});
}

// ---
function setupHandling() {
  //const handler = clientHandling;
  let clicked = false;
  // wrap handling to avoid propagated/bubbling scroll handling on click
  $.handle({
    type: `click`,
    handler: docsExamplesHandler
  });
  $.handle({
    type: `scroll`,
    handler: function({evt}) {
      if (clicked) { return; }
      return clientHandling(evt);
    },
    name: `docsScrollHandler`,
  });

  $.log(`Event handling set...`);
  
  function docsExamplesHandler({evt}) {
    clicked = true;
    setTimeout(_ => clicked = false, 1000);
    return clientHandling(evt);
  }
}

function createChaptersGroup(forContainer, header) {
  let lastChapter = forContainer;
  const groupId = lastChapter.dataset.groupcontainer;
  const prfx = groupId.slice(0, groupId.indexOf(`_`));

  for (const groupChapter of documentationTemplates.templates) {
    if (groupChapter.dataset.id.startsWith(prfx) && !/about$/i.test(groupChapter.dataset.id)) {
      const { chapter, chapterName, paramJSON, params, returns, chapterTextElement, isDeprecated }
        = getChapterProps(groupChapter);
      isDeprecated && chapterTextElement.prepend($.b({class: `red`}, `*Deprecated*`));
      const chapterElement
        = createChapterElement( {chapterName, header, isDeprecated, params, returns, chapterTextElement});
      let i = 0;

      for (const codeElementPlaceholder of chapterElement.find(`[data-example]`)) {
        createCodeElement(codeElementPlaceholder, ++i);
      }
      
      chapterElement.renderTo(lastChapter, $.at.after);
      lastChapter = chapterElement;
      const chapterLogName = `(${chapterName.split(`_`).join(') ')}`;
    }
  }
}

function createCodeElement(codeElemPlaceholder, i) {
  const el$ = codeElemPlaceholder.textContent;
  codeElemPlaceholder.textContent = ``;
  const code = createExampleCodeElement(el$, i);
  codeElemPlaceholder.replaceWith(code.node);
}

function createExampleCodeElement(code, i) {
  const codeId = code.split(/(##)|@/)[4]
  const codeBody = allExampleActions[codeId];

  if (!codeBody) {
    return getCodeElement(escHtml(code).trim());
  }

  const theCodeElement = getCodeElement(codeBody);

  const head = $.div(
    $.h3({class:"example", text: `Example${i && i > 1  ? ` ${i}` : ``}`}),
    $.button({class: "exRunBttn", data: {action: `${codeId}`}}, `Try it`));

  return $.div(
      {class: "exContainer"}, head)
    .append(theCodeElement)
}

function createChapterElement(aggregatedChapterProps) {
  const {chapterName, header, isDeprecated, params, returns, chapterTextElement} = aggregatedChapterProps;

  return $.div(
    {class: "paragraph", data: {for: chapterName}},
    $.h3(
      {class: "methodName", data: {forId: `${chapterName}`}},
      getChapterName(chapterName, header, isDeprecated)
    ),
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
     params: paramJSON && !/none/i.test(paramJSON) ? createParams(paramJSON) : "",
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

function createParams(paramsString) {
  paramsString = JSON.parse(paramsString).reduce((acc, param) => {
    const [key, value] = Object.entries(param).shift();
    return !key || !value || key === "instance"
      ? acc
      : {...acc, [key]: value};
  }, {});

  delete paramsString.instance;

  if (Object.keys(paramsString).length < 1) {
    return;
  }

  const mappedParams = Object.entries(paramsString).reduce((acc, [key, val]) =>
    acc.concat(`<div class="param"><code>${key}</code>: ${escHtml(val || ``)}</div>`), ``)

  return $.div({data: {parameters: true}}, `<b>Parameters</b>${mappedParams}</div>`);
}

function getCodeElement(content) {
  return $.pre({class: "codeblock"},
    $.code({class: /doctype/i.test(content) ? "language-xml" : "language-javascript"}, content));
}

function getChapterName(name, prefix, isDeprecated = false) {
  return `<span class="group">[${prefix}].</span
    ><span ${isDeprecated ? `class="deprecated"` : ""}>${
      name.slice(name.indexOf(`_`) + 1)}</span>`;
}

function numberExample(el, i) {
  el.textContent += i > 0 ? ` ${i + 1}` : ``;
}

function renderGroupingChapters(groupElements) {
  docContainer.append($.div({class: `docBrowser`}, ...groupElements));
  const mainContainer = $.div(
    {class: `container`},
    docContainer
  );

  for (const group of [...groupElements]) {
    group.find$(`[data-example]`).each( createCodeElement );
    group.find$(`h3.example`).each( numberExample );
  }
  
  return mainContainer;
}

function createGroupHeaderLabel(groupId) {
  const displayName = groupNameOnly(groupId);
  return displayName.startsWith(`JQx`) ? `<span class="jqxTitle"><b>JQ</b>uery</b>-<b>x</b></span>` : displayName;
}

function groupNameOnly(idString) {
  return idString.slice(0, idString.indexOf(`_`)).toUpperCase().replace('X', `x`)
}

function removeGroupname(idString) {
  return idString.slice(idString.indexOf(`_`) + 1)
}

function getVariablesInAllScopes() {
  const {clientHandling, allExampleActions} = handlerFactory($);
  let documentationTemplates = fetchAllChaptersFromTemplateDocument();
  const templates = documentationTemplates.templates;
  const componentStyle = $.style({textContent: `@import url(../Common/Sites/cright.css)`});
  const orderedGroups = [
    { groupId: `jqx_About`, groupLabel: `JQx` },
    { groupId: `static_About`, groupLabel: `Static` },
    { groupId: `instance_About`, groupLabel: `Instance` },
    { groupId: `popup_About`, groupLabel: `Popup` },
  ];
  $.log(`Initializations done...`);
  return {clientHandling, allExampleActions, documentationTemplates, orderedGroups, componentStyle};
}

function fetchAllChaptersFromTemplateDocument() {
  $.allowTag(`template`);
  const templates = $.div(templatesImport).node.querySelectorAll(`template`);
  const templatesElementsSortedById = [...templates].sort((el1, el2) => el1.dataset.id.localeCompare(el2.dataset.id));
  $.log(`Fetched documenter templates...`);
  return {templates: templatesElementsSortedById};
}

function createCopyrightComponent() {
  CreateComponent( { componentName: `copyright-slotted`, onConnect: copyrightComponentConnectHandler });
  renderCopyrightComponent();
  $.log(`Copyright component (including repository backlink) created and inserted.`);
}

function renderCopyrightComponent() {
  $.allowTag(`copyright-slotted`);
  const backLinks = {
    github: "//github.com/KooiInc/JQx",
    codeberg: "//codeberg.org/KooiInc/JQx",
    local: "#",
  };

  const backLink = /github/i.test(location.href)
    ? backLinks.github
    : /codeberg/i.test(location.href)
      ? backLinks.codeberg
      : backLinks.local;

  const ghLink = $.a({slot: `link`, href: `${backLink}`, target: `_top`, text: ` Back to repository`});

  $.copyrightSlotted(
    $.span({slot: `year`, class: `yr`, text: String(new Date().getFullYear())}),
    ghLink.HTML.get(1)).render;
}

function copyrightComponentConnectHandler(elem) {
  const shadow = createOrRetrieveShadowRoot(elem);
  const content = $.div({html: `&copy; <span><slot name="year"/></span> KooiInc <slot name="link"/>`});
  shadow.append(content.node, componentStyle.node);
}
