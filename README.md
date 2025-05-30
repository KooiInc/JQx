## WIP Migrating from GitHUB to Codeberg

# JQx

This module was inspired by the idea that some JQuery was too good <a target="_blank" href="http://youmightnotneedjquery.com/" rel="nofollow">to ditch</a>.

It is developed in a modular fashion and uses plain ES20xx, so not really (or really not, take your pick) suitable for older browsers.

The module was rewritten in 2023 in a <i>classfree object oriented</i> fashion, inspired by a <a target="_blank" href="https://youtu.be/XFTOG895C7c?t=2562">Douglas Crockford presentation</a>. 

The objective is to use *`prototype` and `this` **as least as possible*** in the code.

## Install/Import/Initialize

### NPM
You can install this module using npm
```
npm i jqlmodule
```

There are *two flavors* of this library. One for scripts with type `module` (or projects with `"type": "module"` in package.json) and one for the browser.

For each flavor, the script is (bundled and) minified. The location of the minified scripts is `https://kooiinc.github.io/JQL/Bundle`

### ESM import
``` javascript
import $ from "https://kooiinc.github.io/JQL/Bundle/jql.min.js";
// or
const $ = ( await 
  import("https://kooiinc.github.io/JQL/Bundle/jql.min.js") 
).default;
$.div(`Hello JQL!`);
// ...
```

### Browser script
``` html
<script src="https://kooiinc.github.io/JQL/Bundle/jql.browser.min.js"></script>
<script>
  const $ = JQL.default;
  // optionally delete from global namespace
  delete window.JQL;
  $.div(`Hello JQL!`);
  // ...
</script>
```
## Documentation
Documentation can be found @[https://kooiinc.codeberg.page/JQx/Resource/Docs/](https://kooiinc.codeberg.page/JQx/Resource/Docs/).

## Demo and test
A test and demo of this module can be found @[kooiinc.codeberg.page/JQL/Resource/Demo](https://kooiinc.codeberg.page/JQL/Resource/Demo/).
