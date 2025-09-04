import cssRules from "./styling.js";
const isDev = /dev|local/i.test(location.href);
const testBndl = false;
const libLink = !testBndl && isDev ? "../../index.js" : "../../Bundle/jqx.min.js";
const $ = (await import(libLink)).default;
const started = performance.now();
const debug = false;
const isGithub = /github/i.test(location.href);

injectFavIcon();

// initialize styling for this page
$.editCssRules(...cssRules);

// use jqx in the developer console
window.jqx = $;

// add event handling defined in function [getDelegates4Document]
getDelegates4Document().forEach(([type, targetedHandlers]) =>
  targetedHandlers.forEach( handler => {
    const specs = {type, origin: handler.target, handlers: handler.handlers};
    if ($.IS(handler.name, String) && handler.name.length) {specs.name = handler.name;}
    $.handle(specs);
  })
);

// initialize some statics from $
const log = $.logger.log;
const {virtual: $$} = $;
const {DIV, H2, SPAN, I, B, P, U, A, BUTTON, COMMENT, BR, LINK} = $;

/* MAIN  */
if (!debug) {
  // a helper extension
  $.fn(`addTitle`, (self, ttl) => {
    self.prop(`title`, ttl);
    return self;
  });

  const back2 = /github|codeberg/i.test(location.href) ? `_top` : `_blank`;

  // create container for all generated html
  $.div(
      {id: `container`, class: `MAIN`})
    .append(
      $.div( { id: `JQxRoot` }).append($.comment(`div#JQxRoot contains all generated html`))
    ).style({margin: `1rem auto`}).toDOM();

  const backLinks = getBacklinks();

  // create the header content
  DIV( { id: `StyledPara`, class: `thickBorder` },
    H2( `Demo & test JQueryLike (JQx) library`),
    SPAN( I( B( {class: `attention`}, U(`Everything`) ) ),
      ` on this page was dynamically created using JQx.`),
    P( B({class: `arrRight`, html: `&#8594;`}, ),
      ` Check the HTML source &mdash; right click anywhere, and select 'View page source'.`)
  ).appendTo(JQxRoot);

  // onclick is not allowed, so will be removed on element creation
  const msg = `hi there, you won't see me`;
  $(`<div id="nohandling" onclick="alert('${msg}')"></div>`)
    .html(`<h1>H e l l o  &nbsp;w o r l d</h1>`).appendTo(JQxRoot);

  // script and data attribute will be removed, but you can add data-attributes later
  // styles are inline here
  $([
      `<script id="noscripts">alert('hi');</script>`,
      `<div data-cando="1" id="delegates">Hi 1</div>`
    ], JQxRoot)
    .data.add({hello: "Added post creation"})
    .html(` [you may <b><i>click</i> me</b>] `, true)
    .style({cursor: `pointer`});

  // <notallowed> is ... well ... not allowed, so will be removed
  // styles inline
  $([`<notallowed id="removal_imminent"></notallowed>`,
    `<div>Hi 2</div>`])
    .text(` [Hey! You can click AND hover me! (see log)]`, true)
    .style({color: `red`, marginTop: `0.7rem`, cursor: `pointer`})
    .appendTo(JQxRoot)
    // add a click, mouseover and mouseout listener in one go
    .on(`click, mouseover, mouseout`, function heyHandler({evt, me}) {
      const currentColor = me.node.style.color;
      switch(evt.type) {
        case `click`:
          // o look, a state machine ;)
          me.style({
            color: currentColor === `red`
              ? `green` : currentColor === `orange`
                ? `red` : `orange`
          });
          return log(`HI from div.exampleText (you  clicked me)`);
        case `mouseout`:
          return me.removeClass(`IAmHovered`);
        default:
          me.addClass(`IAmHovered`);
          return log(`HI from div.exampleText (you moved your mouse pointer over me)`);
      }
    });

  // create and position a few buttons. Some already contain an event handler (delegated)
  const cssBttns = {
    defaultCSS: BUTTON({
      data: {sheetId: `JQxPopupCSS`, switchBttn: `popupCSS`},
      text: `show popup css` }),
    popupCSS: BUTTON({
      data: {sheetId: `JQxStylesheet`, switchBttn: `defaultCSS`},
      text: `show default css` }),
  };
  $(`#StyledPara`).afterMe(
    DIV({id: "bttnblock"}).append(...[
      BUTTON({id: "showLogEntries", text: "show log"}).on(`click`, showBacklog),
      BUTTON({
        id: "showComments",
        text: "Show document comments",
        title: "Show content of comment elements in a popup" }
      ),
      BUTTON({
        id: "showCSS",
        title: "Show the dynamically created styling in a popup" },
        "Show custom CSS").on("click", function cssViewHandler() {
          showStyling("JQxStylesheet", cssBttns.defaultCSS);
      }),
      BUTTON("Modal popup demo").on(`click`, modalDemo),
      BUTTON(/github/i.test(location.href) ? "@Github" : "@Codeberg")
        .on("click", function backLinksHandler() {
          $.Popup.show( { content: backLinks } );
        } )
    ]
  ));

  $("button")
    .style({marginRight: "4px"})
    .each((btn, i) => btn.dataset.index = `bttn-${i}`); // each demo

  // styled via named class .exampleText
  $$(`<div>`)
  .css({
    className: "exampleText",
    borderTop: "2px dotted #999",
    borderLeft: "5px solid red",
    paddingLeft: "5px",
    display: "block",
    'margin-top': "1rem",
    'padding-top': "0.2rem", })
  .prepend($$("<span>Styling</span>"))
  .html(" examples", true)
  .appendTo(JQxRoot);
  
  // styled with intermediate class
  $$(`<div id="helloworld"/>`)
    .text("Example: hello ... world")
    .append($("<span> OK</span>"))
    .css({
      marginTop: "0.5rem",
      border: "3px solid green",
      padding: "5px",
      fontSize: "1.2em",
      display: "inline-block", })
    .appendTo(JQxRoot)
    .find$("span")
    .css({className: "okRed", color: "red"});
  
  // create a custom function named 'cbBox'
  $.fn(`cbBox`, checkboxBox);
  // the actual custom function
  function checkboxBox(me, spec) {
    let container = !$.IS(me, HTMLDivElement) && !$.IS(me, HTMLParagraphElement) ? $.div : me;
    
    me.data.set({checkboxContainer: 1});
    let {opts, selectallBttn, optLines, style, boxId} = spec;
    boxId = boxId ?? `cbBox_${Math.random().toString(36).slice(2, 12)}`;
    me.data.set({id: boxId});
    createCssRules(boxId, optLines);
    me.append(...getCheckboxItems(opts, boxId));
    
    switch(!!selectallBttn) {
      case true: return addAllOrNoneButton(me);
      default: return me;
    }
    
    function addAllOrNoneButton(me) {
      return me.append(
        $.div({data: {button: true}}, $.button( { data: {all: true}} )
          .on("click", selectAllOrNone) )
      );
    }
    
    function getCheckboxItems(opts, id) {
      const cbOpts = {type: "checkbox"};
      const checkBoxes = [];
      for (const opt of opts) {
        const {value, html} = opt;
        checkBoxes.push(
          $.label(
            {data: {cbBlock: true}},
            $.input({...cbOpts, value, name: id}), html
          )
        );
      }
      return checkBoxes;
    }
    
    function createOptionalStyleRules(boxId, optLines) {
      $.editCssRules(
        `[data-id=${boxId}] {
          ${style || ``}
          ${!optLines ? `width: 100%;` : ``}
        
          [data-cb-block] {
            margin-right: ${!!optLines ? `0` : `1em`};
            display: ${!!optLines ? `block` : `inline-block`};
          }
        }` );
    }
    
    function createCssRules(boxId, optLines) {
      if ( ![...$(`#JQxStylesheet`).node.sheet.cssRules]
        .find(rule => rule.selectorText === `[data-checkbox-container]`) ) {
        $.editCssRules(
          `[data-checkbox-container] {
          margin: 1em 0;
          [data-button] {
            margin-top: 0.6rem;
            
            [data-all]:after {
              content: 'Select all'
            }
            
            [data-all='false']:after {
              content: 'Select none'
            }
          }
        }`,
          `[data-cb-block] {
          cursor: pointer;
          &:hover {
            text-decoration: underline;
          }
          
          input {
            display: inline-block;
            margin: 3px 0.6em 0 0;
          }
        }`);
      }
      createOptionalStyleRules(boxId, optLines);
    }
    
    function selectAllOrNone({self}) {
      const checkValue = $.toBool(self.data.get(`all`));
      self.data.set({all: !checkValue});
      return self.closest(`[data-checkbox-container]`)
        .find$(`input[type="checkbox"]`).each(cb => cb.checked = checkValue);
    }
  }
  
  // usage example of custom function 'cbBox'
  $.div(
    $.h3({style: `margin-bottom: 0.2em`, id: `cbBoxEx`},
      `The following box is created from a <i>custom</i> function created with <code>$.fn</code>, called <code>cbBox</code>`),
    $.div(`It creates a block of checkboxes from specified parameters`,
      $.div(`(<code>$.div(...)<b class="red">.cbBox</b>({opts[, selectAllBttn, optLines, boxId, style] })</code>).`),
      $.div(`In this case a button is provided to check all or no checkboxes in
        the box (<code>selectAllBttn: true</code>)`),
      $.div(`and the checkboxes are displayed as separate lines (<code>optLines: true</code>).`)),
    $.div(`<b>Which colors do you like?</b>`).cbBox({
    opts: [
      {value: 1, html: `<span style="color: red">Red</span>`},
      {value: 2, html: `<span style="color: gold">Yellow</span>`},
      {value: 3, html: `<span style="color: blue">Blue</span>`},
      {value: 4, html: `<span style="color: green">Green</span>`},
      {value: 5, html: `<span style="color: orange">Orange</span>`} ],
    boxId: `colorSelectBox`,
    style: `padding: 4px 8px; border: 1px dotted #c0c0c0; border-radius: 8px;`,
    selectallBttn: true,
    optLines: true,
  })).appendTo(JQxRoot);
  
  const cbBoxCode = DIV({
      class: `exampleText codeVwr`,
      data: {updown: `\u25BC Display `, forid: `cbBoxCode`, hidden: 1} },
    `The code for the <code>[JQx instance].cbBox</code> extension ☝`,
    ).afterMe(
      $.div({id: `cbBoxCode`, class: `upDownFader`}, $.pre(
          $.code(
            `$.fn("cbBox", checkboxBox); // &lt;= create the extension\n`,
            $.escHtml(`\n// invocation (create the above color checkbox container)\n` +
            `$.div("<b>Which colors do you like?</b>")\n` +
            `  .cbBox( {\n`+
            `     opts: [\n` +
            `        {value: 1, html: '<span style="color: red">Red</span>'},\n` +
            `        {value: 2, html: '<span style="color: gold">Yellow</span>'},\n` +
            `        {value: 3, html: '<span style="color: blue">Blue</span>'},\n` +
            `        {value: 4, html: '<span style="color: green">Green</span>'},\n` +
            `        {value: 5, html: '<span style="color: orange">Orange</span>'} ],\n` +
            `      boxId: "colorSelectBox",\n` +
            `      style: "padding: 4px 8px; border: 1px dotted #c0c0c0; border-radius: 8px;",\n` +
            `      selectallBttn: true,\n` +
            `      optLines: true,\n    }` +
            `  \n  );`),
            `\n\n// the actual checkbox creator function\n`,
            checkboxBox.toString()
            .trim()
            .replace(/\n {4}/g, `  `)
            .replace(/  }$/, `}`)
          )
        )
      )
    ).appendTo(JQxRoot);
  
  // append multiline comment to p#JQxRoot
  COMMENT(`Hi, I am a multiline HTML-comment.
     So, you can add plain comments using JQx
     A comment may be injected into a child
     element (using the [root] parameter
     combined with a position`)
  .appendTo(JQxRoot),

  // a comment can also be appended using append/appendTo/prepend/prependTo
  $$(`<!--I was appended to div#JQxRoot using .appendTo-->`)
    .appendTo(JQxRoot);
  $$(`<!--I was PREpended to div#JQxRoot using .prependTo-->`)
    .prependTo(JQxRoot);

  // comment insertion test (note: this works with before-/afterMe/andThen too now)
  $( COMMENT(`Comment @ #JQxRoot beforebegin (verify it in DOM tree)`),
    JQxRoot, $.at.BeforeBegin);
  $( COMMENT(`Comment @ #JQxRoot beforebegin (verify it in DOM tree)`),
      JQxRoot, $.at.BeforeBegin)

  $(`<!--Comment @ #bttnblock afterend (verify it in DOM tree) -->`,
    $(`#bttnblock`), $.at.AfterEnd);

  $(`<!--Comment @ #bttnblock afterbegin (so, prepend) verify it in DOM tree) -->`,
    $(`#bttnblock`), $.at.AfterBegin);

  // display code of this file
  // -------------------------
  DIV({
    class: `exampleText codeVwr`,
    data: {updown: `\u25BC Display `, forid: `code`, hidden: 1} },
    `code used in this example (index.js)`)
  .appendTo(JQxRoot);

  // append actual code to document
  injectCode(JQxRoot).then(_ => `code injected`);

  const donePerf = (performance.now() - started) / 1000;
  const perfMessage =
    $.div(`Page creation took ${donePerf.toFixed(3)} seconds`)
      .afterMe( $.div(`All done, enjoy 😎!` ) );
  $.Popup.show({content: perfMessage, closeAfter: 5});
}
/* DEBUG EXIT POINT */

// show actual code
// class: `language-javascript`
async function injectCode(root = document.body) {
  return await fetch("./index.js").then(r => r.text())
    .then(r =>
        DIV({ class: `upDownFader`, id: `code` },
          $.pre({ data: {jsViewBox: true}, class: `language-javascript` },
            $.code(r.replace(/&/g, "&amp;").replace(/</g, "&lt;"))
          ) ).renderTo(root, $.at.beforeend)
    ).then(_ => setTimeout(hljs.highlightAll));
}

// create a few delegated handler methods
function getDelegates4Document() {
  return Object.entries({
    click: [{
      target: `#delegates`,
      name: "delegatesHandler",
      handlers: [
        ({me}) => {
          clearTimeout(+me.data.get('timer') || 0);
          me.find$(`span.funny`)?.remove();
          me.toggleClass(`green`);
          $(`[data-funny]`).remove();
          const colr = me.hasClass(`green`) ? `green` : `black`;
          me.append($.span({class: `funny`}, `Funny! Now I'm  ${colr}`));
          me.data.add({timer: setTimeout(() => me.find$(`span.funny`)?.remove(), 2500)});
          log(`That's funny ... ${me.find$(`.black,.green`).html()}`);
        },
      ]
    }, {
      target: `#showComments`,
      name: "showCommentsHandler",
      handlers: [function({evt}) {
        const comments = $.div(allComments([...document.childNodes]).join(`\n`));
        const head = $.h3(`*All Comments in this document:`)
          .Style.inline({marginTop: 0, marginBottom: `0.5rem`});
        const content = $.div( head, comments );
        return $.Popup.show({content});
      },]
    }, {
      target: `.codeVwr`,
      name: "codeViewerHandler",
      handlers: [
        ({self}) => {
          const codeElem = $(`#${self.data.get(`forid`)}`);

          if (!+self.data.get(`hidden`)) {
            codeElem.removeClass(`down`);
            return self.data.add({updown: '\u25bc Display ', hidden: 1})
          }

          $(`.down`).each(el => el.classList.remove(`down`));
          $(`[data-forid]`).data.add({updown: '\u25bc Display ', hidden: 1});
          codeElem.addClass(`down`);
          self.data.add({updown: '\u25b2 Hide ', hidden: 0});
        }
      ]
    }]
  });
}

function modalDemo() {
  const callbackAfterClose = () =>
    $.Popup.show({content: `Modal closed, you're ok, bye.`, closeAfter: 2});
  const closeBttn = DIV(
    BUTTON({id: "modalCloseTest"}, `Close me`))
    .css({marginTop: `0.5rem`, textAlign: "center"})
    .on(`click`, () => $.Popup.removeModal());
  $.Popup.show({
    content: DIV(
      `Hi. This box is `, I(`really`), ` modal.`,
      BR(), `There is no close icon and clicking outside this box does nothing.`,
      BR(), `In other words: you can only close this using the button below.`,
      BR() ).append(closeBttn),
    modal: true,
    callback: callbackAfterClose,
    warnMessage: `There's only <b><i>one</i></b> escape`,
  });
}

function showBacklog() {
  $(`#jqxPopupContent`).style({maxWidth: `90vw`});
  const backLog = $.logger.backLog.map(v => $.escHtml(v))
  $.Popup.show({
    content: $.div(
      $.h3(`The current JQx log entries (reversed, latest first)`),
      $.pre(backLog.join(`\n`))),
    callback: () => $(`#jqxPopupContent`).style({maxWidth: ``})
  });
}

function allComments(root, result = []) {
  for (const node of root) {

    if (node.childNodes && node.childNodes.length) {
      allComments([...node.childNodes], result);
    }

    if (node.nodeType === 8) {
      const parent = node.parentNode;
      let parentStr;

      if (parent) {
        const className = parent.classList.length && `.${[...parent.classList][0]}` || ``;
        parentStr = `&#8226; in <b>${
          parent.nodeName.toLowerCase()}${
          parent.id ? `#${parent.id}` : className ? className : ``}</b>`;
      }

      const spacing = "&nbsp;".repeat(7);
      result.push(`<div class="cmmt">${parentStr ?? `&#8226; in <b>??</b>`}<br>${
        "&nbsp;".repeat(2)}&lt;!--${
          node.textContent
            .replace(/</, `&lt;`)
            .replace(/\n/g, `<br>${spacing}`)}--&gt;</div>`);
    }
  }

  return result;
}

// create links for popup
function getBacklinks() {
  return DIV(
      DIV(`The repository can be found  @ `,
        A( {
          href: isGithub
            ? "//github.com/KooiInc/JQx"
            : "//codeberg.org/KooiInc/JQx",
          target: "_top",
          text: isGithub
            ? "https://github.com/JQx"
            : "https://codeberg.org/KooiInc/JQx" } )),
      DIV(`The documentation resides @ `,
        A( {
          href: isGithub
            ? "//kooiinc.github.io/JQL/Resource/Docs/"
            : "//kooiinc.codeberg.page/JQx/Resource/Docs/",
          target: "_blank",
          text: isGithub
            ? "https://kooiinc.github.io/JQL/Resource/Docs/"
            : "https://kooiinc.codeberg.page/JQx/Resource/Docs/" } ))
    );
}

// location dependent favicon
function injectFavIcon() {
  const icons = {
    github: {href: "https://github.githubassets.com/favicons/favicon.png"},
    codeberg: {href: "../Common/DocDemo/codebergicon.ico"},
    local: {href: "../Common/DocDemo/devIco.png"},
  };
  const currentLink = $(`head link[rel="icon"]`);
  const link = $.link({rel: "icon"});

  return /github/i.test(location.href)
    ? currentLink.replaceWith(link.attr(icons.github))
    : /codeberg/i.test(location.href)
      ? currentLink.replaceWith(link.attr(icons.codeberg))
      : currentLink.replaceWith(link.attr(icons.local));
}

// for popup style rules
function showStyling() {
  const [popupContent, displayClass] = [$(`#jqxPopupContent`), `cssDisplay`];
  popupContent.addClass(displayClass);
  $.Popup.show({
      content: $.div(
        $.h3({style: "text-align:center;margin:0.5em 0 0.4em 0"},
          `The actual style rules of style#JQxStylesheet`),
        $.pre({data: {cssViewBox: true}}, getStyleRules4Display())),
      callback: () => popupContent.removeClass(displayClass),
    }
  );

  hljs.highlightElement($.node(`[data-css-view-box]`));
}

function getStyleRules4Display() {
  const theStyle = $(`style#JQxStylesheet`);
  const rules = theStyle.node.sheet.cssRules;
  const stringified = [...rules]
    .map(rule => rule.cssText.replace(/url\([^)]+\)/, `url([...])`))
    .join('')
    .replace(
      `#jqxPopup[open] #jqxPopupContent.cssDisplay`,
      `/* inserted to display custom CSS */\n#jqxPopup[open] #jqxPopupContent.cssDisplay`);
  return css_beautify(stringified, {indent_size: 2, indent_char: " ", end_with_newline: true })
}
