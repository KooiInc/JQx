export default [
  `body {
    font: normal 13px/16px verdana, arial;
    margin: 2rem;
  }`,
  `#JQxRoot {
    position: relative;
    margin: 2rem auto;
    maxWidth: 70vw;
    display: table }`,
  `.MAIN {
    position: absolute;
    inset: 0;
  }`,
  `pre[class*='language-'] {
    position: relative;
    display: block;
   }`,
  `code:not([class*='language-']) {
    background-color: rgb(227, 230, 232);
    color: rgb(12, 13, 14);
    padding: 2px 4px;
    display: inline;
    border-radius: 4px;
    margin: 1px 0;
  }`,
  `.green {
    color: green;
  }`,
  `#StyledPara { padding: 6px; }`,
  `#StyledPara h2 { marginTop: 6px; }`,
  `.thickBorder {
    border: 5px solid green;
    border-width: 5px;
    padding: 0 0.5rem;
  }`,
  `a.InternalLink {
    textDecoration: none;
    color: blue;
    background-color: #EEE;
    padding: 3px;
    font-weight: bold;
  }`,
  `.codeVwr {
    cursor: pointer;
    color: #777;
    background-color: #EEE;
    padding: 3px;
    font-weight: bold;
  }`,
  `.codeVwr:before {
    content: ' 'attr(data-updown);
  }`,
  `.upDownFader {
    max-height: 0;
    opacity: 0;
    width: 0;
    position: absolute;
    overflow: hidden;
    transition: all 0.7s;
  }`,
  `.upDownFader.down {
    max-height: calc(100% - 1px);
    position: relative;
    width: 840px;
    opacity: 1;
    overflow: auto;
  }`,
  `#bttnblock { margin-top: 1em; }`,
  `#logBttn[data-on='0']:before { content: 'Show logs'; }`,
  `#logBttn[data-on='1']:before { content: 'Hide logs'; }`,
  `b.arrRight {
    vertical-align: baseline;
    font-size: 1.2rem;
  }`,
  `.cmmt { color: #888; }`,
  `.cssView {
     white-space: pre;
     padding-bottom: 1rem;
     overflow: hidden;
  }`,
  `@media screen and (width < 1400px) {
    #bttnblock button {
     margin-top: 0.4rem;
    }
  }`,
  `.hidden { display: none; }`,
  `b.attention {
    color: red;
    fontSize: 1.2em;
   }`
];
