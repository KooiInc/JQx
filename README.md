<div align="center">
  <a href="https://bundlephobia.com/package/jqx-es@latest" rel="nofollow"
    ><img src="https://badgen.net/bundlephobia/min/jqx-es"></a>
  <a target="_blank" href="https://www.npmjs.com/package/jqx-es"
    ><img src="https://img.shields.io/npm/v/jqx-es.svg?labelColor=cb3837&logo=npm&color=dcfdd9"></a>
</div>

# JQx

<h3>JQuery - the good parts redone</h3>

This module was inspired by the idea that some JQuery was too good <a target="_blank" href="http://youmightnotneedjquery.com/" rel="nofollow">to ditch</a>.

It is developed in a modular fashion and uses plain ES20xx, so not really (or really not, take your pick) suitable for older browsers.

The module was rewritten in 2023 in a <i>classfree object oriented</i> fashion, inspired by a <a target="_blank" href="https://youtu.be/XFTOG895C7c?t=2562">Douglas Crockford presentation</a>. 

The objective is to ***not*** use `prototype` and `this` in the code.

## Install/Import/Initialize

### NPM 
You can install this module from npm (package *jqx-es*). To create a HTML tree (DOM Object) server side you need a library like [jsdom](https://github.com/jsdom/jsdom).
```
npm i jqx-es
```

There are *two flavors* of this library. One for scripts with type `module` (or projects with `"type": "module"` in package.json) and one for the browser.

For each flavor, the script is (bundled and) minified. The location of the minified scripts is `https://kooiinc.codeberg.page/JQx/Bundle`

### ESM import
``` javascript
import $ from "https://kooiinc.codeberg.page/JQx/Bundle/jqx.min.js";
// or
const $ = ( await 
  import("https://kooiinc.codeberg.page/JQx/Bundle/jqx.min.js") 
).default;
$.div(`Hello JQx!`).appendTo(document.body);
// ...
```

### Browser script
``` html
<script src="https://kooiinc.codeberg.page/JQx/Bundle/jqx.browser.min.js"></script>
<script>
  const $ = JQx.default;
  $.div(`Hello JQx!`).appendTo(document.body);
  // ...
</script>
```
## Documentation
Documentation can be found @[https://kooiinc.codeberg.page/JQx/@main/Resource/Docs/](https://kooiinc.codeberg.page/JQx/@main/Resource/Docs/).

## Demo and test
A test and demo of this module can be found @[kooiinc.codeberg.page/@main/JQx/Resource/Demo](https://kooiinc.codeberg.page/JQx/@main/Resource/Demo/).
