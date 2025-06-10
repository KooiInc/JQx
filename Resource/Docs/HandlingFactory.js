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
         return (docsTop - el.nextElementSibling?.offsetTop || 0) < -40;
      } );
    
    
    if (nextHeader) {
      const nextNavItem = $(`h3`, nextHeader);
      
      if (!nextNavItem.is.empty) {
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
  function exampleResultExists(target) {
    return !$(target.closest(`.exContainer`)).find$(`.inlineExampleHeader`).is.empty;
  }
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
  const getCurrentParagraph = evt => $(evt.target.closest(`.exContainer`)).find$(`h3`);
  const removeBttn = () => $.button({data: {action: `removeExmple`}, }, `OK (remove)`);
  const countDownExampleCloser = (counter, exampleTmp) => {
    const stopBttn = exampleTmp.find$(`span [data-stop]`)?.node;
    
    if (!stopBttn || stopBttn?.dataset?.stop === "true") {
      exampleTmp.find$(`.inlineExampleHeader span`).remove();
      return exampleTmp.find$(`div.inlineExampleHeader`).append(removeBttn());
    }
    
    const current = +counter.dataset.n;
    counter.textContent = `second${current === 1 ? `` : `s`}`;
    
    if (current <= 0) {
      return exampleTmp.remove();
    }
    
    return setTimeout(_ => {
      counter.dataset.n = `${current - 1}`;
      countDownExampleCloser(counter, exampleTmp);
    }, 1000);
  };
  $.fn(`showInExample`, (me, evt, withRemoveBttn = false) => {
    const exampleHeader = $(evt.target.closest(`.exContainer`));
    
    if (!exampleHeader.is.empty && exampleHeader.find$(`[data-ex-tmp]`).is.empty) {
      const bttn = withRemoveBttn ? removeBttn() : ``;
      const exTmp = $.div({data: {exTmp: "1"}})
        .append(
          me.before($.div(
            $.div(
              { data:{tmpHead: "1"},
                class: "inlineExampleHeader",
                text: `*Example result*`},
                bttn,)
            )
          )
        );
      exampleHeader.find$(`div:first-child`).after(exTmp);
    }
    
    return me;
  });
  $.fn(`removeAfter`, (me, seconds) => {
    const count = $.span({data: {n: seconds}});
    const stopBttn = $.button({data:{action: `stopExampleCounter`, stop: "false"}}, `stop`);
    const counterEl = $.span(` Will be removed in `).append(count, stopBttn);
    me.parent.find$(`[data-tmp-head]`).append(counterEl);
    countDownExampleCloser(count.node, me.parent);
    return me;
  });
  
  return {
    removeExmple: (evt) => {
      evt.target.closest(`.inlineExampleHeader`).querySelector(`span button[data-stop]`)?.dataset.stop === "true";
      evt.target.closest(`[data-ex-tmp]`).remove();
    },
    stopExampleCounter: evt => evt.target.dataset.stop = "true",
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
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule("#tmpEx.warnUser {color: red; font-weight: bold;}");
      $.editCssRule(".user:before {content: 'Hi user! ';}");
      console.log(evt.target.closest(`.exContainer`))
      const exampleDiv = $(
        '<div id="tmpEx">This is not very useful</div>',
        getCurrentParagraph(evt), $.at.after )
        .addClass(`user`)
        .showInExample(evt);
        
      setTimeout(_ => {
        exampleDiv.addClass("warnUser", "user").removeAfter(4);
      }, 1500);
    },
    appendEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule(".appended { color: red; cursor: pointer; }");
      const toAppendJQxInstance = $.virtual(
        '<div class="appended">I am an appended JQx instance ...</div>'
      ).on("click", () => alert("HELLO!"));
      
      const elem2Append = $.div({id: "tmpExAppend"}, "Hi there! Wait a sec ... ")
        .append(
          toAppendJQxInstance,
          "Appended text",
          "<div>Appended HTML string</div>",
          Object.assign( document.createElement("div"), {textContent: "Appended element"})
        )
        .showInExample(evt, true);
      
      setTimeout(() => {
        toAppendJQxInstance
          .html("Changed innerHTML, handler is preserved (click me)")
          .style({color: `blue`, fontStyle: `italic`});
      }, 2000);
    },
    prependEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      exDivStyle();
      $.editCssRule(".appended { color: red; }");
      $('<div id="tmpEx">... hi there!</div>', getCurrentParagraph(evt))
        .prepend('<div class="appended">Hello and also ...</div>');
      setTimeout($("#tmpEx").remove, 2000);
    },
    afterMeEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.div("I am div 1").after($("<div>And I am div 2</div>")).showInExample(evt).removeAfter(5);
    },
    beforeMeEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      const divs = $("<div>...and I am div 2</div>")
        .before( $.div("I am div 1") )
        .andThen(
          $.div("...and finally I am div 4" )
            .before( $.div("...hithere, I am div 3") )
        )
      divs.showInExample(evt).removeAfter(30);
    },
    andThenEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      const ele1 = $.p("I am the first");
      const ele2 = $.p("I am the second");
      const codeLine1 = '<code>ele1.andThen(ele2)</code>';
      $(codeLine1).andThen(ele1).andThen(ele2)
        .showInExample(evt).removeAfter(5);
    },
    isEx: evt => {
      const toCodeElement = str => `<code>${str}</code>`;
      const inpDisabled = $.input({
        id: "disabledInput",
        disabled: true,
        type: "text"});
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
        inpDisabled.attr({placeholder: "I am now in the DOM"}).rmAttr("disabled");
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
      if (exampleResultExists(evt.target)) { return; }
      
      const someDiv = $('<div><b style="color:red">Hello world again</b></div>').showInExample(evt);
      $.Popup.show( {
        content: `
          <code>someDiv.closest(".description").HTML.get(1, 1)</code><br>${
            someDiv.closest(".description").HTML.get(1,1).slice(0, 100)}&hellip;`,
        callback: someDiv.remove,
      });
    },
    chainEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRules("#tmpEx {color: green;}", ".helloworld {font-weight: bold;}");
      exDivStyle();
      $(`<div id="tmpEx">Hello world.</div>`, getCurrentParagraph(evt))
        .addClass("helloworld")
        .append("<span> And the rest of the universe ... </span>")
        .text(" (will disappear in a few seconds ...)", true)
        .showInExample(evt)
        .removeAfter(5);
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
    staticElemEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRules(".exRed {color: red;}");
      const popupPara = $.p("Hello world ...")
       .append( $.i( {class: "exRed"}, $.B(" here we are!") ) )
       .showInExample(evt)
       .removeAfter(5);
    },
    staticElemEx2: evt =>{
      if (exampleResultExists(evt.target)) { return; }
      
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
      popupPara
        .append(hereWeAre)
        .showInExample(evt)
        .removeAfter(5);
    },
    
    fnEx2: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.fn( `colorRed`, me => { me.style({color: "red", fontWeight: "bold"}); return me; } );
      const someDiv = $.virtual(`<div data-id="tmpEx">Hello world</div>`)
        .colorRed()
        .showInExample(evt)
        .removeAfter(3);
    },
    valEx: evt => {
      const input = $.input({data: {inputId: "tmpEx", type: "text"}, value: "hello world"})
          .renderTo($(evt.target).closest(`.exContainer`).find(`h3`), $.at.start);
      const valueResults = `Initial value <code>input.val()</code> => ${ input.val()}
          <br>Empty it: <code>input.val("")</code> => ${ input.val("").val() }
          <br>New value: <code>input.val("hi there")</code> => ${ input.val("hi there").val()}`;
      $.Popup.show( {
        content: valueResults,
        callback: () => input.remove()
      } );
    },
    htmlEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      const someDiv = $.virtual(`
        <div data-id='tmpEx'>
          Hello <span>world</span>
        </div>`).style({color: `red`});
      setTimeout(() => {
        $('[data-id="tmpEx"] span').html("universe!");
        setTimeout(() =>
          $('[data-id="tmpEx"] span').html(" And bye again", true), 1500);
      }, 1000);
      
      someDiv
        .showInExample(evt)
        .removeAfter(10);
    },
    outerHTMLEx: evt => {
      const printHtml = html => html.replace(/</g, "&lt;");
      const exElem = $.virtual('<div data-id="tmpEx"><b>Hello</b> <span>World</span>!</div>').showInExample(evt);
      $.Popup.show( {
        content: `
          <code>printHtml(exElem.outerHtml)</code> =&gt; ${printHtml(exElem.outerHtml)}<br>
          // one can also use [JQx instance].HTML:
          <code>exElem.HTML.get(true, true)</code> =&gt; ${exElem.HTML.get(true, true)}`,
        callback: () => exElem.remove(),
      } );
    },
    propEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      const exElem = $('<div data-id="tmpEx"><b>Hello</b> <span>World</span>! (hover me)</div>')
        .showInExample(evt)
        .removeAfter(15);
      exElem.prop({title: "now I have a title", onclick: 'javascript:alert("hello!")'});
      
      $.Popup.show( {
        content: `<code>exElem.prop("title")</code> =&gt; ${exElem.prop("title")}
          <br><code>exElem.prop("onclick")</code> =&gt; ${exElem.prop("onclick")}`,
        closeAfter: 5 }
      );
    },
    removeClassEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule(".exTest { color: red; font-weight: bold; }");
      const exElem = $.virtual('<div data-id="tmpEx"><b>Hello</b> <span class="exTest">World</span>!</div>');
      setTimeout(() => { exElem.find$("span").removeClass("exTest"); }, 2000);
      exElem
        .showInExample(evt)
        .removeAfter(6);
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
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule("#div1 {margin: 0.3rem; color: green; background-color: #EEE; }");
      $.editCssRule("#div2", {margin: "0.3rem", color: "red", backgroundColor: "#EEE"});
      const div1 = $.virtual('<div id="div1">I am div#div1</div>');
      const div2 = $.virtual('<div id="div2">I am div#div2</div>');
      $.div().append(div1, div2)
        .showInExample(evt)
        .removeAfter(5);
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
      if (exampleResultExists(evt.target)) { return; }
      
      const test = $.node(".virtual");
      test && test.remove();
      const inDOM = instance => instance.isVirtual ? "Nope" : "Yep";
      const virtualElem = $.virtual('<div class="virtual" data-id="tmpEx">Hello</div>')
        .append($.virtual(`<span> world!</span>`).style({color: "red", fontWeight: "bold"}));
      $.Popup.show( {
        content: $("<div>virtual element created. In DOM tree? </div>")
          .append(` <b>${inDOM(virtualElem)}.</b>`)
          .append(" We'll add it to this chapter soon."),
        closeAfter: 3,
        callback: () => {
          virtualElem.render.append(`<b> In DOM tree? ${inDOM(virtualElem)}</b>` ).showInExample(evt, true);
          //           ∟ add to DOM tree here;
        } } );
    },
    toggleClassEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      if (!$(getCurrentParagraph(evt)).find$(".divExClass").is.empty) { return; }
      const cleanup = () => {
        $.removeCssRule(".redEx");
        $.removeCssRule("button#toggleColor, button#cleanup");
      };
      
      $.editCssRule(".redEx { color: red; }");
      $.editCssRule("button#toggleColor, button#cleanup { margin: 0 5px; }");
      const elem = $('<div class="divExClass redEx">Hello World!</div>');
      
      elem.append(
        $.button({id: "toggleColor"}, `toggle`)
          .on("click", (_, me) => me.closest(".divExClass").toggleClass("redEx"))
      );
      
      elem.append($.button({id: "cleanup"}, `remove`)
        .on("click", (_, me) => {
          me.closest(".divExClass").remove();
          cleanup();
        }));
      
      elem.showInExample(evt);
    },
    replaceClassEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      const divEx = $('<div><span class="divExClass">Hello World!</span></div>');
      $.editCssRule(".redEx { color: red; }");
      $.editCssRule(".redExUl { text-decoration: underline; }");
      
      setTimeout(() => {
        divEx.find$(`span`)
          .replaceClass("divExClass", "redEx", "redExUl");
      }, 2000);
      
      divEx.showInExample(evt).removeAfter(5);
    },
    ISEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
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
      $.div(
        $.div($.b(`The values found`)),
        whatIsEnumerated.concat([
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
          `<code>isNothing(someVars.RegExp)</code>: ${isNothing(someVars.RegExp)}`,]).join("<br>"))
        .showInExample(evt, true);
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
      if (exampleResultExists(evt.target)) { return; }
      
      // create 2 nodes in the DOM tree and retrieve the collection as NodeList
      const initialList = $('<div class="ex2NodeList">**Initial</div>');
      const nodes = $.virtual([
        '<div id="some" class="toNodelistEx">Hello</div>',
        '<div id="thing" class="toNodelistEx">World</div>'])
      .toNodeList();
      
      // change the text of the nodes in the list
      for (const node of nodes) {
        node.textContent += "!";
        node.style.color = "red";
      }
      
      // append the nodes (and colorize)
      initialList.andThen(
        $(`<div class="ex">**Created and modified using ${toCodeElement("nodes")}</div>`)
          .append(...nodes)
      ).showInExample(evt).closeAfter(10);
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
      if (exampleResultExists(evt.target)) { return; }
      
      let someDiv = $.div(
        { data: {id:"tmpEx"} },
        $.b({class: "red"}, "Hello!") )
      .showInExample(evt);
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
      if (exampleResultExists(evt.target)) { return; }
      
      const commentNode = $.text("Some comment here", true);
      const textNode = $.text("Some text here");
      const divWithTextNodes = $.div( textNode, commentNode );
      const textContentStringified = [...divWithTextNodes.node.childNodes]
        .map( el => el.nodeType === 8 ? `&lt;!--${el.data}-->` : el.data )
        .join(`<br>`);
      $.div(
         $.b(`The created text nodes`),
         $.div(textContentStringified)
      ).showInExample(evt).removeAfter(10);
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
      if (exampleResultExists(evt.target)) { return; }
      
      const someDiv = $(`<span data-id="exSetData">Hello world</span>`, getCurrentParagraph(evt))
        .showInExample(evt).removeAfter(5);
      
      $.editCssRule("[data-goodbye]:after { content: '...'attr(data-goodbye); color: red; }")
      
      setTimeout(() => {
        const renderedSomeDiv = $(`[data-id="exSetData"]`)
        renderedSomeDiv.setData({id: "temporary", goodbye: "and bye again"});
      }, 1500);
    },
    appendToEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule(".tmpExAppendTo { color: blue; font-weight: normal; }");
      const helloWorld = $.virtual('<div class="tmpExAppendTo">Hello World</div>');
      const div2Append = $.span({class: "red"}, " ... And bye again");
      helloWorld.showInExample(evt, true);
      
      setTimeout(() => {
        // note: showInExample wrapped [helloWorld],
        // so we retrieve the original element first:
        const helloWorldFromWrapped = helloWorld.parent.find$(`div.tmpExAppendTo`)
        div2Append.appendTo(helloWorldFromWrapped); // <= appendTo here
      }, 2000);
    },
    duplicateEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule(".someClass", {color: "brown"});
      const initial = $('<div data-id="exDuplicate" class="someClass">[hello]</div>')
        .showInExample(evt, true);
      
      const exEl = $('[data-id="exDuplicate"]');
      const exElDupe = exEl.duplicate();
      exEl
        .after(
          exElDupe
            .append($.text(" world!"))
            .prepend($.text("We say: "))
            .style({fontWeight: "bold"})
        )
        .after(
          exElDupe
          .duplicate()
          .replaceClass("someClass", "tmp")
          .text(" That's right folks. Bye!", true)
          .style({fontWeight: "normal", fontStyle: "italic"})
        )
        .after($.div(
          `outerHTML `,
          $.code(`div[data-id="exDuplicate"]`),
          ` still: ${exEl.HTML.get(1, 1)}`)
        );
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
    staticAtEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRules(
        ".hello { margin: 0.3rem 0; display: inline-block; font-style: italic; }",
        "h2.hello {margin-right: 0.2rem; font-style: normal; color: red}");
      const helloH3 = $.h3({class: "hello"}, "world");
      $(`<div>`).append( helloH3 ).prepend(`<h2 class="hello">Hello</h2>`)
        .showInExample(evt)
        .removeAfter(6);
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
      $(`[data-for-id='static_delegate']`).trigger("click");
      // disable the 'Try it` button
      $(evt.target).attr("disabled", "disabled");
    },
    clearEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule('[data-id="tmpExClr"] { color: green; font-weight: bold; }');
      $.editCssRule(".metoo {color: red;}");
      const me2Clear = $($.div(
        {data:{id: "tmpExClr"}},
         $.div("Here I am."),
         $.div("Call me Pete."),
         $.div("I hope they won't remove me!"))
        .after($('<div class="metoo">Me too! Leave Pete alone!</div>')))
      .showInExample(evt, true)
      .removeAfter(10);
      
      setTimeout( () => {
        $('[data-id="tmpExClr"]').clear(); // <= clearing
        setTimeout( () => $(`.metoo`).text("They did it didn't they?"), 1000)
      }, 2500);
    },
    showHideEx: evt => {
      if (!$(getCurrentParagraph(evt)).find$(".divExClass").is.empty) { return; }
      const cleanup = self => {
        self.node.closest(".divExClass").remove();
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
      if (exampleResultExists(evt.target)) { return; }
      
      const testelem1 = $.virtual('<div data-id="tmpExCss1">Hello #1</div>')
        .css({paddingLeft: "4px", color: "white", backgroundColor: "#000"})
         //  ^ class name will be created
        .css({textDecoration: `underline`});
        //   ^ will use the created class name
      const cClass = [...testelem1.node.classList].shift();
      testelem1
        .andThen( $.div(`*Created class name '${cClass}' in &lt;style#JQxStylesheet>`) )
        .andThen( $(`<p data-id="tmpExCss2" class="leftRedBorder">Hello #2</p>`)
          .css({className: "leftRedBorder", paddingLeft: "4px", color: "green", borderLeft: "12px solid red"}))
           //     ^ explicit class name
        .andThen( $.div("*Created class name 'leftRedBorder' in &lt;style#JQxStylesheet>") )
      .showInExample(evt, true);
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
      const hello3GeneratedClassName = [...hello3.node?.classList]?.shift();

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
      if (exampleResultExists(evt.target)) { return; }
      
      const someDiv = $.div( {
          id: "tmpExAttr",
          data: {id: "#tmpExAttr"},
          class:"initial" },
        `Hi, let me get some attributes`)
      // 🠗 camel cased
      .attr("dataHelloWorld", "hello world!")
       // 🠗 key-value Object
      .attr({
        title: "Yes, I have a title now!",
        style: "font-weight: bold",
        class: "volatile, red",
        fantastic: "true",
        data: {myTitle: "title as data", meaningOfLife: 42, "make-it-so": "engage!"},
        onclick: _ => alert("O NO!"), // <= not allowed
      })
      
      function attrField(attr, str) {
        return $.li(
          $.code(`someDiv.attr("${attr}")`),
          $.span(`: `, `${ $.IS(str, null, undefined) ? `null` : `"${str}"`}`)
        );
      }
      const results =
        $.div(
          $.code(`someDiv`), `is now:`,
          toCodeElement(someDiv.HTML.get(true, true)),
          someDiv,
          $.ul(
          attrField(`id`, someDiv.attr("id")),
          attrField(`data-id`, someDiv.attr("data-id")),
          attrField(`data-my-title`, someDiv.attr("title")),
          attrField(`data-meaning-of-life`, someDiv.attr("data-meaning-of-life")),
          attrField(`title`, someDiv.attr("title")),
          attrField(`dataMyTitle`, someDiv.attr("dataMyTitle")),
          attrField(`dataMakeItSo`, someDiv.attr("dataMakeItSo")),
          attrField(`data-hello-world`, someDiv.attr("data-hello-world")),
          attrField(`class`, someDiv.attr("class")),
          attrField(`onclick`, someDiv.attr("onclick")),
          attrField(`fantastic`, someDiv.attr("fantastic")))
        ).showInExample(evt, true);
    },
    computedStyleEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $.editCssRule(".redEx {color: red; font-weight: bold}");
      $('<p class="redEx">Hello!</p>')
        .andThen(
          $.div(
            `<code>$(".redEx").computedStyle("color")</code>: ${
               $(`.redEx`).computedStyle("color") }<br>
               <code>$(".redEx").computedStyle("font-weight")</code>: ${
               $(`.redEx`).computedStyle("font-weight") }`),
        ).showInExample(evt).removeAfter(10);
    },
    
    dimEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      $('<p data-id="tmpExDims">Hello, where am I at the moment?</p>')
        .style( {
          color: "red",
          fontWeight: "bold",
          border: "3px solid red",
          padding: "5px",
          textAlign: "center" } ).showInExample(evt, true);
      
      requestAnimationFrame(() => {
        // note: the element had to be rendered first to be
        // able to calculate its dimensions.
        const exElem = $(`[data-id='tmpExDims']`);
        const dims = Object.entries(exElem.dimensions)
          .reduce((acc, [key, value]) => [...acc, `${key}: ${value}`], [])
          .join(`<br>`);
        exElem.after($.div(dims));
      });
    },
    findEx: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      // note: $(`[data-for-id='instance_find']` is the header for this chapter
      $.div(
        $.code("$(`.docs`).find(`[data-for-id='instance_find']`)[0].outerHTML"), " =><br>",
        $(`.docs`).find(`[data-for-id='instance_find']`)[0].outerHTML.replace(/</g, `&lt;`))
        .showInExample(evt)
        .removeAfter(10);
    },
    find$Ex: evt => {
      if (exampleResultExists(evt.target)) { return; }
      
      // note: $(`[data-for-id='instance_find$']` is the header for this chapter
      $.div(
          $.code("$(`.docs`).find$(`[data-for-id='instance_find$']`).HTML.get(1, 1)"), " =><br>",
          $(`.docs`).find$(`[data-for-id='instance_find$']`).HTML.get(1, 1))
        .showInExample(evt)
        .removeAfter(10);
    },
    firstEx: evt => {
      const jqxElems = $("#navigation li[data-key]");
      $.Popup.show({content: $(`<div>
         <code>jqxElems.collection.length</code>: ${jqxElems.collection.length},<br>
         outerHTML <code>jqxElems.first()</code>: ${jqxElems.first()?.outerHTML.replace(/</g, "&lt;")}</div>`)});
    },
    first$Ex: evt => {
      // first$
      const jqxElem = $(".docs").first$("[data-for-id='instance_single']");
      const first$WithIndexExample = () => {
        $.Popup.show({
          content: `<code>$(".docs h3").first$(17)</code> =&gt;<br>${
            $(".docs h3").first$(17).HTML.get(1, 1)}` } );
      };
      $.Popup.show(
        { content: `<div><code>$(".docs").first$("[data-for-id='instance_single']")</code> =&gt;<br>${
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
      if (exampleResultExists(evt.target)) { return; }
      
      const helloWrld = $("<div>Hello World again</div>", getCurrentParagraph(evt));
      $.editCssRule("[data-is-universe]:after {content: ' ... and the universe!'; color: red;}");
      helloWrld.data.add({isUniverse: true, something: "else", "dashed-prop-given": 1});
      const {all: myDATA} = helloWrld.data;
      helloWrld.andThen(
        $.ul()
          .append(
            $.li(`<code>helloWrld.data.all</code> =&gt; ${JSON.stringify(helloWrld.data.all)}`),
            $.li(`<code>helloWrld.data.get("something")</code> =&gt; ${helloWrld.data.get("something")}`),
            $.li(`<code>helloWrld.data.all.isUniverse</code> =&gt; ${helloWrld.data.all.isUniverse}`),
            $.li(`<code>helloWrld.data.all["is-universe]</code> =&gt; ${helloWrld.data.all["is-universe"]}`),
            $.li(`<code>helloWrld.data.get("is-universe")</code> =&gt; ${helloWrld.data.get("is-universe")}`),
            $.li(`<code>helloWrld.data.get("isUniverse")</code> =&gt; ${helloWrld.data.get("isUniverse")}`),
            $.li(`<code>helloWrld.data.get("dashed-prop-given")</code> =&gt; ${helloWrld.data.get("dashed-prop-given")}`),
            $.li(`<code>helloWrld.data.all.nonexisting</code> =&gt; ${helloWrld.data.all.nonexisting}`),
            $.li(`<code>helloWrld.data.get("nonexisting", "no sir, I'm not here")</code> =&gt; ${
              helloWrld.data.get("nonexisting", "no sir, I'm not here")}`),
            $.li(`<code>myDATA.something</code> =&gt; ${myDATA.something}`),
            $.li(`<code>myDATA.isUniverse</code> =&gt; ${myDATA.isUniverse}`),
          )
      ).showInExample(evt, true);
      
      setTimeout(() => $(`[data-is-universe]`).data.remove("isUniverse"), 3000);
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
      $(`[data-navitem='${key}']`).trigger("click");
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
