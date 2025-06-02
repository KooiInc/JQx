const svgImg = `url('data:image/svg+xml\\3butf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E')`;
let logStyling = getLogStyling();
let popupStyling = getPopupStyling();
const ATTRS = getAttrs();
const allTags = getPermissions();
export {logStyling, popupStyling, ATTRS, allTags};

function getAttrs() {
  return {
    html: Object.freeze(`accept,action,align,alt,autocapitalize,autocomplete,autopictureinpicture,autoplay,background,bgcolor,border,capture,cellpadding,cellspacing,checked,cite,class,clear,contenteditable,color,cols,colspan,controls,controlslist,coords,crossorigin,datetime,decoding,default,dir,disabled,disablepictureinpicture,disableremoteplayback,download,draggable,enctype,enterkeyhint,face,for,headers,height,hidden,high,href,hreflang,id,inputmode,integrity,is,ismap,kind,label,lang,list,loading,loop,low,max,maxlength,media,method,min,minlength,multiple,muted,name,nonce,noshade,novalidate,nowrap,open,optimum,pattern,placeholder,playsinline,poster,preload,pubdate,radiogroup,readonly,rel,required,rev,reversed,role,rows,rowspan,spellcheck,scope,selected,shape,size,sizes,span,srclang,start,src,srcset,step,style,summary,tabindex,target,title,translate,type,usemap,valign,value,width,xmlns,slot`
      .split(`,`)),
    svg: Object.freeze(`accent-height,accumulate,additive,alignment-baseline,ascent,attributename,attributetype,azimuth,basefrequency,baseline-shift,begin,bias,by,class,clip,clippathunits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,cx,cy,d,dx,dy,diffuseconstant,direction,display,divisor,dur,edgemode,elevation,end,fill,fill-opacity,fill-rule,filter,filterunits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,fx,fy,g1,g2,glyph-name,glyphref,gradientunits,gradienttransform,height,href,id,image-rendering,in,in2,k,k1,k2,k3,k4,kerning,keypoints,keysplines,keytimes,lang,lengthadjust,letter-spacing,kernelmatrix,kernelunitlength,lighting-color,local,marker-end,marker-mid,marker-start,markerheight,markerunits,markerwidth,maskcontentunits,maskunits,max,mask,media,method,mode,min,name,numoctaves,offset,operator,opacity,order,orient,orientation,origin,overflow,paint-order,path,pathlength,patterncontentunits,patterntransform,patternunits,points,preservealpha,preserveaspectratio,primitiveunits,r,rx,ry,radius,refx,refy,repeatcount,repeatdur,restart,result,rotate,scale,seed,shape-rendering,specularconstant,specularexponent,spreadmethod,startoffset,stddeviation,stitchtiles,stop-color,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke,stroke-width,style,surfacescale,systemlanguage,tabindex,targetx,targety,transform,text-anchor,text-decoration,text-rendering,textlength,type,u1,u2,unicode,values,viewbox,visibility,version,vert-adv-y,vert-origin-x,vert-origin-y,width,word-spacing,wrap,writing-mode,xchannelselector,ychannelselector,x,x1,x2,xmlns,y,y1,y2,z,zoomandpan`
      .split(`,`)),
  };
}

function getPermissions() {
  return {a:true,area:true,audio:false,br:true,base:true,body:true,button:true,canvas:true,comment:true,dl:true,data:true,datalist:true,div:true,em:true, embed:false,fieldset:true,font:true,footer:true,form:false,hr:true,head:true,header:true,output:true,iframe:false,frameset:false,img:true,input:true,li:true,label:true,legend:true,link:true,map:true,mark:true,menu:true,media:true,meta:true,nav:true,meter:true,ol:true,object:false,optgroup:true,option:true,p:true,param:true,picture:true,pre:true,progress:false,quote:true,script:false,select:true,source:true,span:true,style:true,caption:true,td:true,col:true,table:true,tr:true,template:false,textarea:true,time:true,title:true,track:true,details:true,ul:true,video:true,del:true,ins:true,slot:true,blockquote:true,svg:true,dialog:true,summary:true,main:true,address:true,colgroup:true,tbody:true,tfoot:true,thead:true,th:true,dd:true,dt:true,figcaption:true,figure:true,i:true,b:true,code:true,h1:true,h2:true,h3:true,h4:true,abbr:true,bdo:true,dfn:true,kbd:true,q:true,rb:true,rp:true,rt:true,ruby:true,s:true,strike:true,samp:true,small:true,strong:true,sup:true,sub:true,u:true,var:true,wbr:true,nobr:true,tt:true,noscript:true};
}

function getLogStyling() {
  return [
    "#logBox{min-width:0px;max-width:0px;min-height:0px;max-height:0px;width:0;height:0;z-index:-1;border:none;padding:0px;overflow:hidden;transition:all 0.3s ease;margin-top:-100px;}",
    "#logBox.visible{background-color:rgb(255, 255, 224);z-index:1;position:static;border:1px dotted rgb(153, 153, 153);max-width:50vw;min-width:30vw;min-height:10vh;max-height:90vh;overflow:auto;width:50vw;height:20vh;margin:1rem 0px;padding:0px 8px 19px;resize:both;}",
    "#logBox.visible .legend{position:absolute;}",
    "#logBox .legend{text-align:center;margin-top:-1em;width:inherit;max-width:inherit;}",
    "#logBox .legend div{text-align:center;display:inline-block;max-width:inherit;height:1.2rem;background-color:rgb(119, 119, 119);padding:2px 10px;color:rgb(255, 255, 255);box-shadow:rgb(119 119 119) 2px 1px 10px;border-radius:4px;}",
    "#logBox .legend div:before{content:'JQx Logging (chronological)';}",
    "#logBox .legend.reversed div:before{content:'JQL Logging (reversed)';}",
    "#logBox #jqx_logger{marginTop:0.7rem;lineHeight:1.4em;font-family:consolas,monospace;whiteSpace:pre-wrap;maxWidth:inherit;padding-left:100px;}",
    "#logBox #jqx_logger div.entry{text-indent:-100px;whiteSpace:normal;}",
  ]
}

function getPopupStyling() {
  return [
    ".popupContainer{position:fixed;inset:-5000px;opacity:0;height:0;width:0;background:rgba(0,0,0,0.1);transition:opacity 0.6s ease-in-out 0s;}",
    ".popupContainer.popup-active{opacity:1;inset:0;height:auto;width:auto;z-index:2147483646;}",
    ".popupContainer .content{box-shadow:rgba(0,0,0,0.5) 2px 2px 8px;border-radius:3px;min-width:125px;max-width:40vw;max-height:40vh;padding:8px;overflow:auto;background:#FFF;z-index:inherit;opacity:1;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}",
    ".popupContainer .content .popup-warn{position:relative;padding:3px 8px 0 8px;color:red;margin:6px -8px -4px -8px;text-align:center;display:none;}",
    ".popupContainer .content.popup-warn-active .popup-warn{display:block;border-top:1px dashed rgb(0,0,0);}",
    `.closeHandleIcon{z-index:1;position:absolute;opacity:0;cursor:pointer;width:24px;height:24px;background:${svgImg} no-repeat;}`,
    ".closeHandleIcon.popup-active{opacity:1;z-index:2147483647;}",
    "@media screen and (width < 1200px){.popupContainer .content{max-width:75vw;}}",
    "@media screen and (width < 640px){.popupContainer .content{max-width:90vw;max-height:60vw;}}",
  ];
}
