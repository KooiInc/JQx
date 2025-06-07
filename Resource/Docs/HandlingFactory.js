export default documentHandlingFactory;

function documentHandlingFactory($) {
  const clickActions = clickActionsFactory($);
  $.editCssRules(`[data-id="tmpEx"], #tmpEx { white-space: normal; padding-top: 5px;}`, `.test, .warn { color: red; }`);

  return {
    clientHandling: function(evt) {
      if (evt.type === `scroll`) {
        return handleScroll(evt);
      }
      
      const groupItem = !evt.target?.closest?.(`[data-key]`) && evt.target.closest(`.navGroup`);
      const itemFromDoc = evt.target?.closest?.(`.methodName`);
      const action = evt.target.closest(`[data-action]`)?.dataset?.action;
      const navItem = evt.target?.dataset?.navitem;
      
      // clicked group name
      if (groupItem) {
        return clickActions.clickNavGroup(evt, groupItem);
      }
      // clicked navigation item left
      if (navItem) {
        return clickActions.clickNavItem(evt);
      }
      // clicked header in doc
      if (itemFromDoc) {
        return clickActions.jumpTo(itemFromDoc.dataset.forId);
      }
      // clicked an element with data-action
      if ( action && clickActions[action] ) {
        return clickActions[action](evt);
      }
    },
    allExampleActions:  Object.entries(clickActions).reduce ( getCodeBody, {} ),
  };
  
  function getCodeBody(acc, [functionName, handlerFunction]) {
    handlerFunction = String(handlerFunction).trim();
    return {
      ...acc,
      [functionName]: handlerFunction
        .slice(handlerFunction.indexOf(`{`)+1, -1)
        .replace(/\n {6}/g, `\n`)
        .replace(/</g, `&lt;`)
        .replace(/\$/g, `&dollar;`)
        .trim()
    };
  }

  function handleScroll(evt) {
    const docsTop = evt.target.scrollTop;
    let marge = 0;
    
    const nextHeader = $.nodes(`.description, .paragraph`)
      .find( el => {
         marge = docsTop - el.nextElementSibling?.offsetTop || 0;
         return marge <= -30;
      } );
    
    
    if (nextHeader) {
      const nextNavItem = $(nextHeader.querySelector(`h3`));
      
      if (!nextNavItem.is.empty && nextNavItem.hasClass(`selected`)) {
        $(`.navGroup:not(.closed)`).addClass(`closed`);
        $(`.selected`).removeClass(`selected`);
        const itemId = nextNavItem.data.get(`forId`) ?? nextNavItem.data.get(`groupId`);
        const navItem = $(`[data-navitem="${itemId}"]`);
        
        if (!navItem.is.empty) {
            navItem.addClass(`selected`);
            navItem.closest(`.navGroup`).removeClass(`closed`);
        }
      }
    }
  }
}

function clickActionsFactory($) {
  const toCodeElement = str => `<code>${str}</code>`;
  const yn = item => item === undefined ? `Yep 😎` : `Nope 😡`;
  const randomNr = (max, min = 0) => {
    [max, min] = [Math.floor(max), Math.ceil(min)];
    return Math.floor( ([...crypto.getRandomValues(new Uint32Array(1))].shift() / 2 ** 32 ) * (max - min + 1) + min );
  };
  const popup = $.Popup;
  const docsContainer = $.node(".docs");
  const removeEx = (...rules2Remove) => setTimeout(() => {
    $('#tmpEx, [data-id="tmpEx"]').remove();
    rules2Remove.length > 0 && $.removeCssRule(...rules2Remove);
  }, 1500);
  const exDivStyle = (remove = false) => remove ? $.removeCssRule(`#tmpEx`) : $.editCssRule(`#tmpEx {color: green; font-weight: bold;}`);
  const getCurrentParagraph = evt => evt.target.closest(`.description`);
  return {
    popupTimedEx: () => {
      // A timed popup message
      const timedText = "Hi, this is a popup! I'll be active for 5 seconds (as long as one don't close me first).";
      $.Popup.createTimed( timedText, 5, () => $.Popup.createTimed("I am closing", 2) );
    },
    popupCreateModalEx: () => {
      // A modal popup message
      const modalBoxText = "\
        Hi. This box is <i>really</i> modal.\
        <br>There is no close icon and clicking outside this box does nothing.\
        <br>In other words: one can only close this using the button below.\
        <br>Try clicking anywhere outside the box ...";
      const closeBttn = $.button({data: {id: "modalClose"}}, "Close me");
      $.delegate("click", "[data-id='modalClose']", $.Popup.removeModal);
      const okMessage = () => $.Popup.show({ content: `Modal closed, we're ok, bye.`, closeAfter: 2});
      const message = $.div(
        modalBoxText,
        $.div({style: "margin-top: 0.6rem;"}, closeBttn)
      );
      $.Popup.create(
        message,
        true,
        okMessage,
        "There's only one escape here!" );
    },
    popupShowModalEx: () => {
      // A modal popup message
      const modalBoxText = "\
        Hi. This box is <i>really</i> modal.\
        <br>There is no close icon and clicking outside this box does nothing.\
        <br>In other words: one can only close this using the button below.\
        <br>Try clicking anywhere outside the box ...";
      const closeBttn = $.button({data: {id: "modalClose2"}}, "Close me");
      $.delegate("click", "[data-id='modalClose2']", $.Popup.removeModal);
      const okMessage = () => $.Popup.show({ content: `Modal closed, we're ok, bye.`, closeAfter: 2});
      const message = $.div(
        modalBoxText,
        $.div({style: "margin-top: 0.6rem;"}, closeBttn)
      );
      $.Popup.show({
        content: message,
        modal: true,
        callback: okMessage,
        warnMessage: "You <i>can</i> read, can't you?",
      });
    },
    popupCreateEx: () => {
      // Just a message
      $.Popup.create(
        $.div(
          "Here's a popup message.",
          $.div("Close it by clicking the checkmark icon or anywhere outside the box")
        )
      );
    },
    renderEx(evt) {
      const helloWrld = $.div({style: "color:red;font-weight:bold"}, `Hello`, $.span(` world`));
      const currentParagraph = getCurrentParagraph(evt);
      helloWrld.render.appendTo(currentParagraph, $.at.end);
      setTimeout(() => helloWrld.remove(), 4000);
    },
    renderToEx(evt) {
      const helloWrld = $.div({style: "color:red;font-weight:bold"}, `HELLO`, $.span(` WORLD!`));
      const currentParagraphHeader = $(getCurrentParagraph(evt)).parent.find$(`h3`);
      helloWrld.renderTo(currentParagraphHeader, $.at.afterend);
      setTimeout(() => helloWrld.remove(), 4000);
    },
    popupShowEx: () => {
      // Just a message
      $.Popup.show( {
        content: $.div(
            "Here's a popup message.",
            $.div("Close it by clicking the checkmark icon or anywhere outside the box")
          )
      } );
    },
    popupShowTimedEx: () => {
      // A timed popup message
      $.Popup.show( {
        content: $.div(
          "Here's a popup message.",
          $.div("Close it by clicking the checkmark icon or anywhere outside the box"),
          $.div("If not closed by the user, I will close all by myself after 5 seconds ;)")
        ),
        closeAfter: 5
      } );
    },
    addClassEx: evt => {
      $.editCssRule("#tmpEx.warnUser {color: red; font-weight: bold;}");
      $.editCssRule(".user:before {content: 'Hi user! ';}");
      const exampleDiv = $(
        '<div id="tmpEx">This is not very useful</div>',
        getCurrentParagraph(evt) );
      setTimeout(_ => {
        exampleDiv.addClass("warnUser", "user");
        setTimeout(exampleDiv.remove, 2000);
      }, 1500);
    },
    appendEx: evt => {
      exDivStyle();
        $.editCssRule(".appended { color: red; cursor: pointer; }");
        const toAppendJQxInstance = $.virtual('<div class="appended">I am an appended JQx instance ...</div>')
           .on("click", () => alert("HELLO!"));
        const elem2Append = $('<div id="tmpEx">Hi there! Wait a sec ... </div>', getCurrentParagraph(evt))
          .append(
            toAppendJQxInstance,
            "Appended text",
            "<div>Appended HTML string</div>",
            Object.assign( document.createElement("div"), {textContent: "Appended element"}) );
        setTimeout(() =>
          $.Popup.show( {
            content: toAppendJQxInstance.html("Now I am appended to the popup element, one can still click me"),
            callback: () => $("#tmpEx").remove(),
        }), 1500);
    },
    prependEx: evt => {
      $("#tmpEx").remove();
      exDivStyle();
      $.editCssRule(".appended { color: red; }");
      $('<div id="tmpEx">... hi there!</div>', getCurrentParagraph(evt))
        .prepend('<div class="appended">Hello and also ...</div>');
      setTimeout($("#tmpEx").remove, 2000);
    },
    afterMeEx: evt => {
      $.Popup.show({ content: $.div("I am div 1").after($("<div>And I am div 2</div>"))});
    },
    beforeMeEx: evt => {
      $.Popup.show({
      content: $("<div>...and I am div 2</div>")
         .andThen( $.div("...and finally I am div 4" )
           .before( $.div("...hithere, I am div 3") )
         )
       .before( $.div("I am div 1") )
      } );
    },
    andThenEx: evt => {
      const ele1 = $.p("I am the first");
      const ele2 = $.p("I am the second");
      const codeLine1 = '<code>ele1.andThen(ele2)</code>';
      const codeLine2 = '<code>ele2.andThen(ele1)</code>';
      const codeLine3 = '<code>ele2.andThen(ele1, true)</code>';
      $.Popup.show( {
        content: $(codeLine1).andThen(ele1).andThen(ele2),
        closeAfter: 3.5,
        callback: () =>
          $.Popup.show( {
            closeAfter: 3.5,
            content: $(codeLine2).andThen(ele2).andThen(ele1),
            callback: () => $.Popup.show( {
              content: ele2.andThen(ele1, true).andThen(codeLine3),
              closeAfter: 3.5,
            } ),
          } )
      } );
    },
    isEx: evt => {
      const toCodeElement = str => `<code>${str}</code>`;
      const inpDisabled = $.input({
        id: "disabledInput",
        disabled: true,
        type: "text",
        placeholder: "I am not enabled"});
      const { is } = inpDisabled;
      const retrieveFeatures = () =>
        `<ul>${
          [...Object.keys(is)]
            .reduce((acc, key) => acc.concat(`<li>${toCodeElement(key)}? ${is[key]}</li>`), "")}
        </ul>`;
      const getActualPopupText = () =>
        $.div({class: "description"},
          `<h3><code>inpDisabled</code> ${is.inDOM ? "in" : "<i>NOT</i> in"} the DOM</h3>
           <div>${retrieveFeatures()}</div>`);
      console.log(getActualPopupText().HTML.get(1));
      const reCheckAfterAdded2DOM = () => {
        inpDisabled.toDOM();
        $.Popup.show({
          content: $.div().append( inpDisabled, getActualPopupText() )
        });
      }
      
      $.Popup.show({
        content: getActualPopupText(),
        callback: reCheckAfterAdded2DOM,
      });
    },
    closestEx: evt => {
      const someDiv = $('<div><b style="color:red">Hello world again</b></div>', getCurrentParagraph(evt));
      $.Popup.show( {
        content: `
          <code>someDiv.closest(".description").HTML.get(1, 1)</code><br>${
            someDiv.closest(".description").HTML.get(1,1).slice(0, 100)}&hellip;`,
        callback: someDiv.remove,
      });
    },
    chainEx: evt => {
      $.editCssRules("#tmpEx {color: green;}", ".helloworld {font-weight: bold;}");
      exDivStyle();
      $(`<div id="tmpEx">Hello world.</div>`, getCurrentParagraph(evt))
        .addClass("helloworld")
        .append("<span> And the rest of the universe ... </span>")
        .text(" (will disappear in a few seconds ...)", true);
      setTimeout( () => $("#tmpEx").remove(), 3000);
    },
    fnEx: () => {
      $.fn( "addTitle", (me, ttl) => ttl ? me.prop("title", ttl) : me );
      const someDiv = $.virtual('<div data-id="tmpEx">Hello world</div>');
      $.Popup.show( { content: someDiv.addTitle("hi there!").append(`<div>My title is now "${
          someDiv.prop("title")}". Hover me!</div>`) });
    },
    staticCreateStyleEx: () => {
      const myStylesheetEditor = $.editStylesheet("exampleStyleSheet");
      const editMyRules   = (...rules) => rules.forEach(rule => myStylesheetEditor(rule));
      editMyRules(
        ".exampleContainer { margin: 2rem; font: normal 12px/15px verdana, arial; }",
        "#example { color: green; }"
      );
      const myBrandNewCssSheet = $.node("#exampleStyleSheet");
      const ismyBrandNewCssSheetAStyleSheet = `Is <code>myBrandNewCssSheet</code>
          really a stylesheet? ${ $.IS(myBrandNewCssSheet, HTMLStyleElement) ? "YEP" : "NOPE" }`;
      const rules = [... myBrandNewCssSheet.sheet.rules].reduce((acc, rule) => acc.concat(rule.cssText), []);
      const checkMsg = "While this popup is open, open the developer console (tab 'Elements')\
        and check if &lt;head> contains <code class='inline'>style#exampleStyleSheet</code>";
      $.Popup.show( {
          content: $.div(
              $.div(checkMsg),
              $.p(ismyBrandNewCssSheetAStyleSheet),
              $.p(`What rules are in it?`),
              $.pre({style: "color:green;margin:-8px 0 0 1em;"}, "- " + rules.join(`<br>- `))
            ),
          callback() { $("#exampleStyleSheet").remove() }
        } );
      },
    staticElemEx: () => {
      $.editCssRules(".exRed {color: red;}");
      const popupPara = $.p("Hello world ...")
       .append(
         $.i( {class: "exRed"}, $.B(" here we are!") )
       );

      $.Popup.show({
        content: popupPara,
        closeAfter: 3,
      });
    },
    staticElemEx2: () =>{
      // extract tag methods from [JQx]
      $.editCssRules(
        ".exRed {color: red;}",
        ".exFont {\
          font-family: fantasy;\
          font-size: 1.2rem;\
          margin-right: 0.4rem;\
        }" );
      const {P, I, SPAN} = $;
      const hereWeAre = I( { class: "exRed exFont" }, SPAN("Here we are! ") );
      const popupPara = P( { text: "Hello world ... ", id: "Hithere" });
      hereWeAre.renderTo(popupPara, $.at.start);

      $.Popup.show({
        content: popupPara,
        closeAfter: 3,
      });
    },
    
    fnEx2: evt => {
      $.fn( `colorRed`, me => { me[0].style.color = "red"; return me; } );
      const someDiv = $.virtual(`<div data-id="tmpEx">Hello world</div>`);
      $.Popup.show( { content: someDiv.append($(`<div>There we have it</div>`).colorRed()) });
    },
    valEx: evt => {
      const input = $('<input data-id="tmpEx" type="text" value="hello world">', getCurrentParagraph(evt));
      const valueResults = `Initial value <code>input.val()</code> => ${ input.val()}
          <br>Empty it: <code>input.val("")</code> => ${ input.val("").val() }
          <br>New value: <code>input.val("hi there")</code> => ${ input.val("hi there").val()}`;
      $.Popup.show( {
        content: valueResults,
        callback: removeEx
      } );
    },
    htmlEx: evt => {
      const item = getCurrentParagraph(evt);
      const someDiv = $("\
        <div data-id='tmpEx'>\
          Hello <span>world</span>\
        </div>", item);
      setTimeout(() => {
        $('[data-id="tmpEx"] span', item).html("universe!");
        setTimeout(() => $('[data-id="tmpEx"] span', item).html(" And bye again", true), 1000);
      }, 1000);
      setTimeout(() => $('[data-id="tmpEx]', item).remove(), 5500);
    },
    outerHTMLEx: evt => {
      const printHtml = html => html.replace(/</g, "&lt;");
      const exElem = $.virtual('<div data-id="tmpEx"><b>Hello</b> <span>World</span>!</div>', getCurrentParagraph(evt));
      $.Popup.show( {
        content: `
          <code>printHtml(exElem.outerHtml)</code> =&gt; ${printHtml(exElem.outerHtml)}<br>
          // one can also use [JQx instance].HTML:
          <code>exElem.HTML.get(true, true)</code> =&gt; ${exElem.HTML.get(true, true)}`,
        callback: () => exElem.remove(),
      } );
    },
    propEx: evt => {
      const exElem = $('<div data-id="tmpEx"><b>Hello</b> <span>World</span>!</div>',
        getCurrentParagraph(evt));
      exElem.prop({title: "now I have a title", onclick: 'javascript:alert("hello!")'});
      $.Popup.show( { content: `<code>exElem.prop("title")</code> =&gt; ${exElem.prop("title")}
        <br><code>exElem.prop("onclick")</code> =&gt; ${exElem.prop("onclick")}`, closeAfter: 4 } );
      setTimeout(() => exElem.remove(), 10000);
    },
    removeClassEx: evt => {
      $.editCssRule(".exTest { color: red; font-weight: bold; }");
      const exElem = $('<div data-id="tmpEx"><b>Hello</b> <span class="exTest">World</span>!</div>',
        getCurrentParagraph(evt));
      setTimeout(() => {
        exElem.find$("span").removeClass("exTest");
        setTimeout(() => exElem.remove(), 2500);
      }, 1500);
    },
    getDataEx: evt => {
      const thisBttn = $(evt.target);
      const action = thisBttn.getData("action");
      const undef = thisBttn.getData("nonexistent");
      const undefWithDefaultValue = thisBttn.getData("nothing", "NOCANDO");
      $.Popup.show( { content: [
        `<code>action</code>: "${action}"`,
        `<code>undef</code>: ${undef}`,
        `<code>undefWithDefaultValue</code>: "${undefWithDefaultValue}"`].join("<br>") } );
    },
    editCssRuleEx: evt => {
      $.editCssRule("#div1 {margin: 0.3rem; color: green; background-color: #EEE; }");
      $.editCssRule("#div2", {margin: "0.3rem", color: "red", backgroundColor: "#EEE"});
      const div1 = $.virtual('<div id="div1">I am div#div1</div>');
      const div2 = $.virtual('<div id="div2">I am div#div2</div>');
      
      $.Popup.show( {
        content: $.div().append(div1, div2),
        callback: () => $.removeCssRules("#div1", "#div2")
      } );
    },
    editCssRulesEx: () =>{
      const div1 = $.virtual("<div id='div1'>I am div#div1</div>");
      const div2 = $.virtual("<div id='div2'>I am div#div2</div>");
      $.editCssRules(
        "#div1 { margin: 0.3rem; color: green; background-color: #EEE; }",
        "#div2 { margin: 0.3rem; color: red; background-color: #EEE; }"
      );
      
      $.Popup.show( {
        content: $(`<div>`).append(div1, div2),
        callback: () => $.removeCssRules("#div1", "#div2") } );
    },
    removeCssRulesEx: () =>{
      const div1 = $.virtual("<div id='div1'>I am div#div1</div>");
      const div2 = $.virtual("<div id='div2'>I am div#div2</div>");
      $.editCssRules(
        "#div1 { margin: 0.3rem; color: green; background-color: #EEE; }",
        "#div2 { margin: 0.3rem; color: red; background-color: #EEE; }" );
      $.Popup.show( {
        content: $.virtual(`<div>`).append(div1, div2),
        callback: () => {
          $.removeCssRules("#div1", "#div2");
          const rulesExist = [...$.node("#JQxStylesheet", document.documentElement).sheet.cssRules]
            .filter(r => r.cssText.startsWith("#div1") || r.cssText.startsWith("#div2"))
          $.Popup.show( {
            content: `Rules removed, so we expect <code>rulesExist?.cssText</code>
                      to be undefined. Is that so? ${yn(rulesExist?.cssText)}`,
            closeAfter: 5,
          });
        } } );
    },
    removeCssRuleEx: () =>{
      const div1 = $.virtual('<div id="div1">I am div#div1</div>');
      const div2 = $.virtual('<div id="div2">I am div#div2</div>');
      $.editCssRule("#div1 {margin: 0.3rem; color: green; background-color: #EEE; }");
      $.Popup.show( {
        content: $.virtual("<div>").append(div1, div2),
        callback: () => {
          $.removeCssRule("#div1");
          const rulesExist = [...$.node("#JQxStylesheet", document.documentElement).sheet.cssRules]
            .filter(r => r.cssText.startsWith("#div1"))
          $.Popup.show( {
            content: `Rule removed, so we expect <code>rulesExist?.cssText</code> to be undefined.
                 Is that so? ${yn(rulesExist?.cssText)}`,
            closeAfter: 5,
          });
        } } );
    },
    virtualEx: evt => {
      const test = $.node(".virtual");
      test && test.remove();
      const inDOM = instance => instance.isVirtual ? "Nope" : "Yep";
      const virtualElem = $.virtual('<div class="virtual" data-id="tmpEx">Hello</div>')
        .append($.virtual(`<span> world!</span>`).style({color: "red", fontWeight: "bold"}));
      $.Popup.show( {
        content: $("<div>virtual element created. In DOM tree? </div>")
          .append(` <b>${inDOM(virtualElem)}.</b>`)
          .append(" We'll add it to this chapter soon."),
        closeAfter: 2.5,
        callback: () => {
          virtualElem.toDOM(getCurrentParagraph(evt))
          //          ∟ add to DOM tree here
          .append(`<b> In DOM tree? ${inDOM(virtualElem)}</b>` );
        }
      });
      setTimeout(() => virtualElem.remove(), 5000);
    },
    toggleClassEx: evt => {
      if (!$(getCurrentParagraph(evt)).find$(".divExClass").is.empty) { return; }
      const cleanup = () => {
        $.removeCssRule(".redEx");
        $.removeCssRule("button#toggleColor, button#cleanup");
      };
      $.editCssRule(".redEx { color: red; }");
      $.editCssRule("button#toggleColor, button#cleanup { margin: 0 5px; }");
      const elem = $('<div class="divExClass redEx">Hello World!</div>', getCurrentParagraph(evt));
      elem.append($.virtual('<button id="toggleColor">toggle</button>')
        .on("click", (_, self) => $(self[0].closest(`.divExClass`)).toggleClass("redEx")));
      elem.append($.virtual(`<button id="cleanup">remove</button>`)
        .on("click", (_, self) => {
          self[0].closest(".divExClass").remove();
          cleanup();
        }));
    },
    replaceClassEx: evt => {
      const divEx = $('<div class="divExClass">Hello World!</div>', getCurrentParagraph(evt));
      const cleanup = () => {
        divEx.remove();
        $.removeCssRule(".redEx");
        $.removeCssRule(".redExUl");
      };
      $.editCssRule(".redEx { color: red; }");
      $.editCssRule(".redExUl { text-decoration: underline; }");
      setTimeout(() => {
        divEx.replaceClass("divExClass", "redEx", "redExUl");
        setTimeout(cleanup, 2000)
      }, 1500);
    },
    ISEx: _ => {
      const someVars = {
        Object: {say: "hello"},
        Array: [1, 2, 3],
        RegExp: /[a-z]/gi,
        Null: null,
        Undefined: undefined,
        Zero: 0,
        Symbol: Symbol("symbol1"),
      };
      const isNothing = something => $.IS(something, undefined, NaN, null);
      const whatIs = something => $.IS(something);
      const whatIsEnumerated = Object.keys(someVars).reduce( (acc, key) =>
        [...acc, `<code>whatIs(someVars.${key})</code>: ${whatIs(someVars[key])}`], []);
      $.Popup.show( {
        content: whatIsEnumerated.concat([
          `<code>$.IS(someVars.Object, Object)</code>: ${$.IS(someVars.Object, Object)}`,
          `<code>$.IS(someVars.Object, Array)</code>: ${$.IS(someVars.Object, Array)}`,
          `<code>$.IS(someVars.Object, String, Object, Array)</code>: ${$.IS(someVars.Object, String, Object, Array)}`,
          `<code>$.IS(someVars.Array, Array)</code>: ${$.IS(someVars.Array, Array)}`,
          `<code>$.IS(someVars.Array, Object)</code>: ${$.IS(someVars.Array, Object)}`,
          `<code>$.IS(someVars.RegExp, RegExp)</code>: ${$.IS(someVars.RegExp, RegExp)}`,
          `<code>$.IS(someVars.Null, undefined)</code>: ${$.IS(someVars.Null, undefined)}`,
          `<code>$.IS(someVars.Null, null)</code>: ${$.IS(someVars.Null, null)}`,
          `<code>$.IS(someVars.Zero, Boolean)</code>: ${$.IS(someVars.Zero, Boolean)}`,
          `<code>$.IS(someVars.Symbol, Symbol)</code>: ${$.IS(someVars.Symbol, Symbol)}`,
          `<code>isNothing(someVars.Undefined)</code>: ${isNothing(someVars.Undefined)}`,
          `<code>isNothing(someVars.RegExp)</code>: ${isNothing(someVars.RegExp)}`,]).join("<br>"),
      });
    },
    singleEx: evt => {
      // indexOrSelector is selector
      $("<div data-id='tmpEx'>\
           <div class='test'>Hello world (1)</div>\
           <div class='test'>Hello world (2)</div>\
        </div>", evt.target, $.insertPositions.AfterEnd);
      $.Popup.show( { content:
        `<code>$("[data-id='tmpEx']").<b>single(".test")</b>.HTML.get(1,1)</code>
          <p>${$("[data-id='tmpEx']").single(".test").HTML.get(1,1)}</p>`,
        callback: () => $(`[data-id]`).remove() } );
    },
    singleEx2: evt => {
      // indexOrSelector is empty
      $("<div data-id='tmpEx'>\
           <div class='test'>Hello world (1)</div>\
           <div class='test'>Hello world (2)</div>\
        </div>", evt.target, $.insertPositions.AfterEnd);
      $.Popup.show( { content:
        `<code>$("[data-id='tmpEx']").<b>single()</b>.HTML.get(true, true)</code>
         <p>${$("[data-id='tmpEx']").single().HTML.get(true, true)}</p>`,
        callback: () => $(`[data-id]`).remove() } );
    },
    singleEx3: evt => {
      // indexOrSelector is Number
      $('<div data-id="tmpEx">\
           <div class="test">Hello world (1)</div>\
           <div class="test">Hello world (2)</div>\
           <div class="test">Hello world (3)</div>\
         </div>',
        evt.target, $.insertPositions.AfterEnd);
      $.Popup.show( { content:
        `<code>$(".test").<b>single(1)</b>.HTML.get(1, 1)</code>
         <p>${$(".test").single(1).HTML.get(1, 1)}</p>`,
        callback: () => $(`[data-id]`).remove() } );
    },
    htmlObjEx: evt => {
      const initialEl = $.DIV({id: "initial"})

      // create reference to initialEl.HTML
      const { HTML } = initialEl;
      
      // set initial
      HTML.set("'nough said").data.set({iteration: "set"});

      // html now
      const initialElOuterHtml1 = `<code>set</code>: ${HTML.get(true, true)}`;

      // replace content
      HTML.replace("HELLO").data.set({iteration: "replace"});

      // html now
      const initialElOuterHtml2 = `<code>replace</code>: ${HTML.get(true, true)}`;

      // append to content
      HTML.append($.span(" WORLD")).data.set({iteration: "append"});

      // html now
      const initialElOuterHtml3 = `<code>append</code>: ${HTML.get(true, true)}`;

      // insert
      HTML.insert($.B("The obligatory ... ")).data.set({iteration: "insert"});

      // html now
      const initialElOuterHtml4 = `<code>insert</code>: ${HTML.get(true, true)}`;

      // aggregate a report
      const report = $.virtual(`<div class="description">
        <h3>Created <code>div#initial</code></h3>
        <ul>
          <li>${initialElOuterHtml1}</li>
          <li>${initialElOuterHtml2}</li>
          <li>${initialElOuterHtml3}</li>
          <li>${initialElOuterHtml4}</li>
        </ul>
        <h3>So, there we have it 😏</h3></div>`)
        .append(initialEl
          .Style.byRule( {rules: ".tmp1234 { color: green; font-weight: bold; }"} )
        );

      // show it
      $.Popup.show({ content: report } );
    },
    toNodeListEx: evt => {
      const currentPara = getCurrentParagraph(evt);
      // create 2 nodes in the DOM tree and retrieve the collection as NodeList
      
      $('<div class="ex">**Initial</div>', currentPara);
      const nodes = $([
        '<div id="some" class="ex">Hello</div>',
        '<div id="thing" class="ex">World</div>'])
      .appendTo(currentPara)
      .toNodeList();
      
      // change the text of the nodes in the list
      for (const node of nodes) {
        node.textContent += "!";
        node.style.color = "red";
      }
      
      // append the nodes (and colorize)
      $(`<div class="ex">**Created and modified using ${toCodeElement("nodes")}</div>`, currentPara)
        .append(...nodes);
      setTimeout($(".ex").remove, 5000);
    },
    htmlForEx: evt => {
      // note: this example serves both for [JQx instance].html and [JQx instance].htmlFor
      const someDiv = $.div({data: {id: "htmlExample"}});
      $.Popup.show({
        content: someDiv.html("(<code class='inline'>html</code>) =>\
          Hello <span class='wrld'><b>world</b></span> <span>... wait 3 secs ...</span>"),
        closeAfter: 3,
        callback: () => {
          $.Popup.show({
            content: someDiv
              .htmlFor("code", "htmlFor")
              .htmlFor(".wrld", "<i><b>UNIVERSE</b></i>")
              .htmlFor("span:last-child", "<i>... wait 3 secs ...</i>"),
            closeAfter: 3,
            callback: () =>
              $.Popup.show({
                // the script should not be injected
                content: someDiv
                  .htmlFor(".wrld", "injecting a &lt;script> tag will not work")
                  .htmlFor("span:last-child", "<script>alert('no!')</script>"),
                closeAfter: 5,
              }),
          });
        }
      } );
    },
    isEmptyEx: evt => {
      const currentParagraph = getCurrentParagraph(evt);
      let someDiv = $.div(
            { data: {id:"tmpEx"} },
            $.b({class: "red"}, "Hello!") )
          .appendTo(currentParagraph);
      $.Popup.show( {
        content: `
          <code>someDiv.isEmpty()</code> =&gt; ${someDiv.isEmpty()}<br>
          <code>someDiv.find$("b:first-child").isEmpty()</code> =&gt; ${
            someDiv.find$("b:first-child").isEmpty()}`,
        closeAfter: 2.5,
        callback: () => {
          someDiv.remove();
          someDiv = $(".IDoNotExist");
          $.Popup.show({
            content: `
              <code>someDiv.isEmpty()</code> =&gt; ${someDiv.isEmpty()}<br>
              <code>someDiv.find$("b:first-child").isEmpty()</code> =&gt; ${
                someDiv.find$("b:first-child").isEmpty()}`,
            callback: someDiv.remove,
          });
        },
      } );
    },
    replaceWithEx: () => {
      const oldDiv = $.virtual(`<div id="oldD">I shall be replaced...<div>`);
      const newDiv = $.virtual(`<div id="newD">I have replaced div#oldD!<div>`);
      $.Popup.show( {
        content: oldDiv,
        closeAfter: 3,
        callback: () => $.Popup.show({
            content: oldDiv.replaceWith(newDiv).style({color: `red`}),
            closeAfter: 3
          }),
      });
    },
    textOrCommentEx: evt => {
      const commentNode = $.text("Some comment here", true);
      const textNode = $.text("Some text here");
      const divWithTextNodes = $.div( textNode, commentNode );
      
      $.Popup.show( {
        content:
          `<div><b>The created text nodes</b></div>
           <div>${
              [...divWithTextNodes.first().childNodes]
              .map( el => el.nodeType === 8 ? `&lt;!--${el.data}-->` : el.data )
              .join(`<br>`)}
          </div>`
      } );
    },
    replaceEx: () => {
      const div = $.virtual('\
        <div>Hi there!<div class="oldD">I shall be replaced...</div>\
        <div class="oldD">Me Too!</div></div>');
      const newDiv = $.virtual(`<div>Formerly known as "div.oldD"<div>`).style({color: "red"});
      $.Popup.show( {
        content: div,
        closeAfter: 3,
        callback: () => $.Popup.show({
          content: div.replace(".oldD", newDiv),
          closeAfter: 3
        }),
      });
    },
    lenEx: evt => {
      const p = $(`<p>There are <b>${$(`h3`).length}</b> &lt;h3>-elements within this document</p>`,
        getCurrentParagraph(evt));
      setTimeout(p.remove, 4000);
    },
    setDataEx: evt => {
      const someDiv = $(`<span>Hello world</span>`, getCurrentParagraph(evt));
      $.editCssRule("[data-goodbye]::after { content: '...'attr(data-goodbye); }");
      setTimeout(() => {
        someDiv.setData({id: "temporary", goodbye: "and bye again"});
        setTimeout(() => $("[data-id='temporary']").remove(), 2500);
      }, 1500);
    },
    appendToEx: evt => {
      $.editCssRule("#tmpEx { color: blue; font-weight: normal; }");
      $.editCssRule("#tmpEx div {color: red; font-weight: bold}");
      const helloWorld = $('<p id="tmpEx">Hello World</p>', getCurrentParagraph(evt));
      const div2Append = $.div("And bye again");
      console.log(div2Append);
      setTimeout(() => {
        div2Append.appendTo(helloWorld);
        setTimeout(() => $("#tmpEx").remove(), 1500);
      }, 1500);
      
    },
    duplicateEx: evt => {
      const currentDescription = getCurrentParagraph(evt);
      $.editCssRule(".someClass", {color: "brown"});
      const initial = $('<div class="someClass">[hello]</div>', currentDescription)
          .duplicate(true, currentDescription);
      $( ".someClass", currentDescription )
        .append(" world!")
        .prepend("We say: ")
        .each(el => el.setAttribute("id", `_${ Math.floor(10000 + Math.random() * 10000).toString(16)}` ))
        .duplicate(true, currentDescription)
        .replaceClass("someClass", "tmp")
        .text(" That's right folks. Bye!", true);
      const outerHtml = $(`.someClass, .tmp`).collection.map(el => $(el).HTML.get(1,1)).join(`<br>`);
      $.Popup.show({
        content: outerHtml,
        callback: $(".someClass, .tmp").remove,
      });
    },
    hasClassEx: evt => {
      const tmpDiv = $('<div class="one two tree">Hello world</div>', getCurrentParagraph(evt));
      $.Popup.show( {
        content:
        `<code>tmpDiv.hasClass("one", "tree")</code> =&gt; ${tmpDiv.hasClass("one", "tree")}<br>
         <code>tmpDiv.hasClass("one", "four")</code> =&gt; ${tmpDiv.hasClass("one", "four")}<br>
         <code>tmpDiv.hasClass("five")</code> =&gt; ${tmpDiv.hasClass("five")}`,
        callback: $(".one.two").remove
      } );
    },
    staticAtEx: () => {
      $.editCssRules(
        ".hello { margin: 0.3rem 0; display: inline-block; }",
        "h2.hello {margin-right: 0.2rem;");
      const helloH3 = $.h3({class: "hello"}, "world");
      const elemContainer = $( `<div>` ).append( helloH3 );
      $.virtual(`<h2 class="hello">Hello</h2>`, helloH3, $.at.BEFORE);
      $.Popup.show({
        content: elemContainer,
        callback: () => $.removeCssRules(".hello", "h2.hello"),
        closeAfter: 3,
      });
    },
    staticDelegateEx: evt => {
      $.delegate(
        "click",
        "[data-for-id='static_delegate']",
        function(evt) {
          const $target = $(evt.target);
          
          if (!$target.prop("title")) {
            $target.prop({title: "click to toggle the color of all headers"});
          }

          if ($target.Style.computed.color === "rgb(0, 0, 255)") {
            return $.editCssRule(":root { --method-head-color: rgb(224, 59, 59); }");
          }

          return $.editCssRule(":root { --method-head-color: blue; }");
        }
      );
      // invoke the handler
      $("#static_delegate").trigger("click");
      // disable the 'Try it` button
      $(evt.target).attr("disabled", "disabled");
    },
    clearEx: evt => {
      $.editCssRule('[data-id="tmpEx"] { color: green; font-weight: bold; }');
      $.editCssRule(".metoo {color: red;}");
      $(['<p data-id="tmpEx">I hope they won\'t remove this!</p>',
        '<div class="metoo">Me too!</div>'], getCurrentParagraph(evt));
      setTimeout( () => $('[data-id="tmpEx"]').clear(), 1500);
      setTimeout( () => $(`.metoo`).text("They did it didn't they?"), 2500);
      setTimeout( () => {
        $(".metoo").remove();
        $.removeCssRule(".metoo");
      }, 4000);
    },
    showHideEx: evt => {
      if (!$(getCurrentParagraph(evt)).find$(".divExClass").is.empty) { return; }
      const cleanup = self => {
        self[0].closest(".divExClass").remove();
        $.removeCssRule(".showHide");
        $.removeCssRule("button#hide, button#show, button#cleanup");
      };
      $.editCssRule(".showHide { display: block; color: red; font-weight: bold; }");
      $.editCssRule("button#hide, button#show, button#cleanup { margin-right: 5px; }");
      const elem = $('\
        <div class="divExClass">\
          <span class="showHide">Hello World!</span>\
        </div>', getCurrentParagraph(evt));
      elem.append($.virtual('<button id="hide">hide</button>')
        .on( "click", evt => $(evt.target.closest(".divExClass").querySelector(".showHide")).hide() )
      );
      elem.append($.virtual('<button id="show">show</button>')
        .on( "click", evt => $(evt.target.closest(".divExClass").querySelector(".showHide")).show() )
      );
      elem.append( $.virtual('<button id="cleanup">remove</button>')
        .on( "click", (_, self) => cleanup(self) ) );
    },
    cssEx: evt => {
      const item = getCurrentParagraph(evt);
      $('<p data-id="tmpEx">Hello #1</p>', item)
        .css({paddingLeft: "4px", color: "white", backgroundColor: "#000"});
      const cClass = [...$.node('[data-id="tmpEx"]')?.classList]?.shift()
      $(`<p data-id="tmpEx" class="leftRedBorder">Hello #2</p>`, item)
        .css({className: "leftRedBorder", paddingLeft: "4px", color: "green", borderLeft: "12px solid red"});
      $.Popup.show({
        content: `generated class name (first element): ${cClass}`,
        callback: () => {
          $.removeCssRules(".leftRedBorder", `.${cClass}`);
          setTimeout($("[data-id='tmpEx']").remove, 2500);
        }
      });
    },
    styleRulingsEx: evt => {
      const hello = $.div("Hello").append($.span(" world"));
      hello.Style.byRule( {
        classes2Apply: ["test1", "boring"],
        rules: [".test1 { color: green }", ".boring {backgroundColor: #EEE;}"] } );

      // single class rule: .test2 automatically added to the span here
      hello.find$("span")?.Style.nwRule(".test2 { color: red; }");

      $.Popup.show({
        content: $.div("This resulted in:")
          .Style
            .nwRule("#test3 { color: blue; }")
          .append(hello),
        callback: () => $.removeCssRule(".boring", ".test1", ".test2", "#test3") });
    },
    styleObjInStyleEx: evt => {
      $.removeCssRule('[data-id="tmpEx"], #tmpEx');

      // inline
      const hello1 = $.P({data: {id: "tmpEx"}})
        .Style.inline({ paddingLeft: "4px", color: "white", backgroundColor: "#000" });
      hello1.append($.div(`HTML of hello1: ${hello1.HTML.get(true, true)}`));

      // inSheet with given className
      const hello2 = $.P()
        .addClass("leftRedBorder")
        .attr({data: {id: "tmpEx"}})
        .Style.inSheet({
          className: "leftRedBorder",
          paddingLeft: "4px",
          color: "green",
          borderLeft: "12px solid red"
        });
      hello2.append($.div(`HTML of hello2: ${hello2.HTML.get(true, true)}`));

      // inSheet, className generated
      const hello3 = $( $.P({id: "tmpEx"}) )
        .Style .inSheet({
          paddingLeft: "4px",
          color: "green",
          borderLeft: "12px solid green"} );
      hello3.append($.div(`HTML of hello3: ${hello3.HTML.get(true, true)}`));
      const hello3GeneratedClassName = [...hello3[0]?.classList]?.shift();

      // computed (note: randomNr is a utility function)
      const computedHello3 = $("<div>")
        .html(`
          <code>hello3.Style.valueOf("borderLeftColor")</code>: ${
            hello3.toDOM().Style.valueOf(`borderLeftColor`)}.<br>&nbsp;<b>⤷</b> Equivalent
          <code>hello3.Style.computed.borderLeftColor</code>: ${
            hello3.Style.computed.borderLeftColor}`);
      const computed = hello3.Style.computed;
      const sliceStart = randomNr(computed.length, 10) - 10;
      const hello3Computed = `<div><br><code>hello3.Style.computed</code>
        (10 of ${computed.length} rules, random sample)<ul>${
        [...computed]
          .slice( sliceStart, sliceStart + 10)
          .map( (v) => `<li>${v}: ${computed[v]}</li>`)
          .join(``) }</ul></div>`.replace(/\n+\s{2,}/g, " ");

      $.Popup.show({
        content: $($.DIV()).append(hello1, hello2, hello3, computedHello3, hello3Computed,),
        callback: () => $.removeCssRules(`.${hello3GeneratedClassName}, .leftRedBorder`) } );
    },
    attrEx: evt => {
      const item = getCurrentParagraph(evt);
      const someDiv = $.div( {
          id: "tmpEx",
          data: {id: "#tmpEx"},
          class:"initial" },
        `Hi, let me get some attributes`).appendTo(item);
      someDiv.attr({
        title: "Yes, I have a title now!",
        class: "volatile",
        data: {myTitle: "title as data", meaningOfLife: 42},
        onclick: _ => alert("o no!"), // <= not allowed
      });
      const attrField4Popup = (attr, str) => `<code>someDiv.attr("${attr}")</code>: ${
        $.IS(str, null, undefined) ? str : `"${str}"`}`;
      const results = [
        `<code>someDiv</code> is now: <code>${someDiv.HTML.get(true, true)}</code>`,
        attrField4Popup(`id`, someDiv.attr("id")),
        attrField4Popup(`data-id`, someDiv.attr("data-id")),
        attrField4Popup(`data-my-title`, someDiv.attr("title")),
        attrField4Popup(`data-meaning-of-life`, someDiv.attr("data-meaning-of-life")),
        attrField4Popup(`title`, someDiv.attr("class")),
        attrField4Popup(`class`, someDiv.attr("data-my-title")),
        attrField4Popup(`onclick`, someDiv.attr("onclick")),
      ];
      $.Popup.show( {
        content: `<div class="description"><ul><li>${results.join(`</li><li>`)}</li>`,
        callback: someDiv.remove });
    },
    computedStyleEx: evt => {
      $.editCssRule(".redEx {color: red; font-weight: bold}");
      $('<p class="redEx">Hello!</p>', getCurrentParagraph(evt));
      $.Popup.show({
        content: `
            <code>$(".redEx").computedStyle("color")</code>: ${
            $(`.redEx`).computedStyle("color") }<br>
            <code>$(".redEx").computedStyle("font-weight")</code>: ${
            $(`.redEx`).computedStyle("font-weight") }`,
        callback: $(".redEx").remove });
    },
    
    dimEx: evt => {
      const dim = $('<p data-id="tmpEx">Hello, where am I at the moment?</p>', getCurrentParagraph(evt))
        .style({color: "red", fontWeight: "bold", border: "3px solid red", padding: "5px", textAlign: "center"});
      const dims = JSON.stringify(dim.dimensions, null, 2)
        .replace(/[}{"]/g, "").trim().replace(/\n/g, "<br>");
      $.Popup.show({content: dims, callback: () => dim.remove()});
    },
    findEx: () => {$.Popup.show( { content: $(".docs").find(`#instance_find`)[0]?.outerHTML.replace(/</g, "&lt;") } );},
    find$Ex: () => {
      // note: $ is invalid in selectors, so replaced with _D
      $.Popup.show( { content: $(".docs").find$("#instance_find_D").HTML.get(1, 1) } );
    },
    firstEx: evt => {
      const jqxElems = $("#navigation li[data-key]");
      $.Popup.show({content: $(`<div>
         <code>jqxElems.collection.length</code>: ${jqxElems.collection.length},<br>
         outerHTML <code>jqxElems.first()</code>: ${jqxElems.first()?.outerHTML.replace(/</g, "&lt;")}</div>`)});
    },
    first$Ex: evt => {
      // first$
      const jqxElem = $(".docs").first$("#instance_single");
      const first$WithIndexExample = () => {
        $.Popup.show({
          content: `<code>$(".docs h3").first$(17)</code> =&gt;<br>${
            $(".docs h3").first$(17).HTML.get(1, 1)}` } );
      };
      $.Popup.show(
        { content: `<div><code>$(".docs").first$("#instance_single")</code> =&gt;<br>${
          jqxElem.HTML.get(1, 1)}</div>`, callback: first$WithIndexExample } );
    },
    nth$Ex: evt => {
      // nth$
      const jqxElem = $(".docs").nth$(30001); // does not exist
      $.Popup.show({ content: `
            <div><code>jqxElem.HTML.get(1,1) </code> should give 'no elements' message: ${
              jqxElem.HTML.get(1, 1)}</div>` });
    },
    dataEx: evt => {
      const helloWrld = $("<div>Hello World again</div>", getCurrentParagraph(evt));
      $.editCssRule("[data-is-universe]:after {content: ' ... and the universe!'; color: red;}");
      helloWrld.data.add({isUniverse: true, something: "else", "dashed-prop-given": 1});
      const {all: myDATA} = helloWrld.data;
      $.Popup.show({
        content: `<code>helloWrld.data.all</code> =&gt; ${JSON.stringify(helloWrld.data.all)}
          <br><code>helloWrld.data.get("something")</code> =&gt; ${helloWrld.data.get("something")}
          <br><code>helloWrld.data.all.isUniverse</code> =&gt; ${helloWrld.data.all.isUniverse}
          <br><code>helloWrld.data.all["is-universe]</code> =&gt; ${helloWrld.data.all["is-universe"]}
          <br><code>helloWrld.data.get("is-universe")</code> =&gt; ${helloWrld.data.get("is-universe")}
          <br><code>helloWrld.data.get("isUniverse")</code> =&gt; ${helloWrld.data.get("isUniverse")}
          <br><code>helloWrld.data.get("dashed-prop-given")</code> =&gt; ${helloWrld.data.get("dashed-prop-given")}
          <br><code>helloWrld.data.all.nonexisting</code> =&gt; ${helloWrld.data.all.nonexisting}
          <br><code>helloWrld.data.get("nonexisting", "no sir, I'm not here")</code> =&gt; ${
            helloWrld.data.get("nonexisting", "no sir, I'm not here")}
          <br><code>myDATA.something</code> =&gt; ${myDATA.something}
          <br><code>myDATA.isUniverse</code> =&gt; ${myDATA.isUniverse}`,
        callback: () => {
          helloWrld.data.remove("isUniverse");
          setTimeout( () => {
            $.removeCssRule("[data-is-universe]:after");
            helloWrld.remove();
          }, 3500);
        },
      });
    },
    eachEx: () => {
      const mNameElems = $(`.methodName`);
      const brown = "rgb(165, 42, 42)";
      const currentColor = mNameElems.computedStyle("color");
      mNameElems.each( el => $(el).style({color: currentColor === brown ? "" : brown}) );
    },
    clickNavGroup: (evt, groupItem) => {
      const groupItem$ = $(groupItem);
      const isOpen = !groupItem$.hasClass("closed");
      $(`.navGroup`).each(group => $(group).addClass("closed"));
      const selectChapter = groupItem.dataset.group + `_About`;
      const groupElement = $.node(`h3[data-group-id="${selectChapter}"]`);
      $.node(`h3[data-group-id="${selectChapter}"]`).scrollIntoView();
      $(`.selected`).removeClass("selected");
      $(`ul.navGroupItems li:first-child div[data-navitem]`, groupItem).addClass("selected");
      
      if(!isOpen) {
        groupItem$.removeClass("closed");
      }
    },
    clickNavItem: evt => {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      $(".navGroup:not(.closed)").each(group => $(group).addClass("closed"));
      $(evt.target.closest(`.navGroup`)).removeClass("closed");
      const navItemId = evt.target.dataset.navitem;
      const aboutNavItem = navItemId.endsWith(`About`)
        ? $.node(`[data-group-id="${navItemId}"]`)
        : $.node(`[data-for-id="${navItemId}"]`);
      aboutNavItem.scrollIntoView();
      $(".selected").removeClass("selected");
      $(evt.target).addClass("selected");
      
      return $(evt.target.closest(`.navGroup`)).removeClass("closed");
    },
    jumpTo: key => {
      const navItem = $(`[data-navitem='${key}']`);
      navItem.trigger("click");

      if (navItem[0].offsetTop > $.node("#navigation").offsetHeight) {
        navItem[0].scrollIntoView();
      }
    },
    jump2Nav: evt => {
      const linkOrigin = evt.target.closest("[data-jumpgroup]") || evt.target.closest("[data-jumpkey]");
      
      if (linkOrigin) {
        const toGroup = linkOrigin.dataset.jumpgroup;
        const toKey = linkOrigin.dataset.jumpkey;
        const jumpTo = toGroup ? $(`[data-group='${toGroup}']`) : $(`[data-navitem="${toKey}"]`);
        
        return jumpTo.trigger("click");
      }
    }
  };
}
