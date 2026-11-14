/* Solar With Philip attribution helper (Phase 2A).
   Stores only whitelisted marketing parameters. No PII. Never rewrites the URL or decorates links.
   First touch: localStorage swp_attr_first, 90-day expiry. Current touch: sessionStorage swp_attr_current. */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else if(root){root.swpAttribution=api;api.capture();}
})(typeof window!=='undefined'?window:null,function(win){
  'use strict';
  var KEYS=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid','lp_id','lp_version','lp_key','lp_cta'];
  var FIRST='swp_attr_first',CURRENT='swp_attr_current',TTL=90*24*60*60*1000,VERSION=1;

  function safe(v){return String(v).replace(/[^A-Za-z0-9_.\-~+ %]/g,'').slice(0,100);}
  function parse(search){
    var out={},has=false;
    var sp=new URLSearchParams(search||'');
    KEYS.forEach(function(k){
      var v=sp.get(k);
      if(v){var s=safe(v);if(s){out[k]=s;has=true;}}
    });
    return has?out:null;
  }
  function read(store,key){try{var r=store.getItem(key);return r?JSON.parse(r):null;}catch(e){return null;}}
  function write(store,key,val){try{store.setItem(key,JSON.stringify(val));}catch(e){}}

  function capture(){
    if(!win||!win.location)return null;
    var now=Date.now();
    var params=parse(win.location.search);
    var path=win.location.pathname;
    var cur={v:VERSION,ts:now,params:params||{},landing_path:path};
    if(params||!read(win.sessionStorage,CURRENT))write(win.sessionStorage,CURRENT,cur);
    var first=read(win.localStorage,FIRST);
    var expired=!first||!first.expires||first.expires<now||first.v!==VERSION;
    var directUpgrade=first&&!expired&&params&&Object.keys(first.params||{}).length===0;
    if(expired||directUpgrade){
      write(win.localStorage,FIRST,{v:VERSION,ts:now,expires:now+TTL,params:params||{},landing_path:path});
    }
    return get();
  }
  function get(){
    if(!win)return null;
    return {first:read(win.localStorage,FIRST),current:read(win.sessionStorage,CURRENT)};
  }
  return {capture:capture,get:get,parse:parse,KEYS:KEYS,TTL_MS:TTL};
});
