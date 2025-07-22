<div align="center">
  <!-- bundlephobia is broken !<a href="https://bundlephobia.com/package/jqx-es@latest" rel="nofollow"
    ><img src="https://badgen.net/bundlephobia/min/jqx-es"></a> -->
  <a target="_blank" href="https://www.npmjs.com/package/jqx-es"
    ><img src="https://img.shields.io/npm/v/jqx-es.svg?labelColor=cb3837&logo=npm&color=dcfdd9"></a>
</div>

# JQx

This module was inspired by the idea that some parts of [JQuery](https://jquery.com) are too good [to ditch](https://youmightnotneedjquery.com/).  
JQx is **not** a replacement for JQuery.  
Consider it a set of JQuery alike ES/JS-methods to programmatically ***create***, ***retrieve***, ***modify***, ***style*** and/or ***manipulate***
(collections of) HTML elements in a HTML document.

The code is written in a modular fashion and uses plain ES20xx, so not really (or really not, take your pick) suitable for older browsers.

### Documentation/demo
- Documentation can be found @[Codeberg](https://kooiinc.codeberg.page/JQx/Resource/Docs/)
or @[Github](https://kooiinc.github.io/JQx/Resource/Docs).  
- A test and demo of this module can be found @[Codeberg](https://kooiinc.codeberg.page/JQx/Resource/Demo)
or @[Github](https://kooiinc.github.io/JQx/Resource/Demo).

### * Note *
This repository was formerly known as **JQL**, residing on [Github](https://github.com/KooiInc/JQx).  
The *authorative* code base for this module is now: @[https://codeberg.org/KooiInc/JQx](https://codeberg.org/KooiInc/JQx).

The NPM package is copied to a new package (see top link). The old NPM package will not be updated and 
discontinued in due time.  
The latest JQL Github branch before this operation is preserved in **./Resource/JQL-last**.

The Github JQL repository is renamed to _**JQx**_ and will, until further notice, be synchronised with this CodeBerg repository. 

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
