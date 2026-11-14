/* Solar With Philip analytics helper (Phase 2A). Fail-closed allow-list; never transmits PII. */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else if(root)root.swpTrack=api.track;
})(typeof window!=='undefined'?window:null,function(win){
  'use strict';
  var EVENTS={cta_click:1,phone_click:1,text_click:1,email_click:1,nav_click:1,form_view:1,form_start:1,form_submit:1,page_section_view:1,contact_form_start:1,contact_form_submit:1,quote_compare_start:1,quote_compare_submit:1,quote_upload:1,form_submit_attempt:1,form_error:1,enrichment_select:1,path_select:1,tool_select:1};
  var PARAMS={cta_name:1,cta_location:1,destination:1,page_type:1,journey_type:1,link_location:1,form_id:1,lead_type:1,step_number:1,section:1,file_type:1,size_band:1,has_utility:1,bill_band:1,goal:1,has_upload:1,has_profile:1,form_source:1,error_category:1,contact_pref:1,enrichment:1,path_choice:1,tool_name:1};
  var EMAIL=/[^\s@]+@[^\s@]+\.[^\s@]+/;
  var PHONE=/(?:\+?\d[\s().-]?){10,}/;
  var recent={};

  function debug(){
    try{
      if(win&&win.localStorage&&win.localStorage.getItem('swp_debug')==='1')return true;
      return !!(win&&win.location&&/^(localhost|127\.0\.0\.1)$/.test(win.location.hostname));
    }catch(e){return false;}
  }
  function warn(msg){if(debug()&&typeof console!=='undefined')console.warn('[swpTrack] '+msg);}

  function cleanValue(key,v){
    if(typeof v==='boolean'||(typeof v==='number'&&isFinite(v)))return v;
    if(typeof v!=='string')return undefined;
    v=v.trim();
    if(key==='destination'){
      v=v.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i,'').split(/[?#]/)[0];
    }
    if(EMAIL.test(v)||PHONE.test(v))return undefined;
    return v.slice(0,100);
  }
  function sanitize(params){
    var out={};
    Object.keys(params||{}).forEach(function(k){
      if(!PARAMS[k]){warn('dropped key: '+k);return;}
      var c=cleanValue(k,params[k]);
      if(c===undefined||c===''){warn('dropped value for: '+k);return;}
      out[k]=c;
    });
    return out;
  }
  function track(name,params,opts){
    if(!EVENTS[name]){warn('dropped event: '+name);return false;}
    var clean=sanitize(params);
    var key=(opts&&opts.dedupeKey)||null;
    if(key){
      var now=Date.now();
      if(recent[key]&&now-recent[key]<(opts.windowMs||1000))return false;
      recent[key]=now;
    }
    if(!win||typeof win.gtag!=='function')return false;
    try{win.gtag('event',name,clean);return true;}catch(e){return false;}
  }
  return {track:track,sanitize:sanitize,EVENTS:EVENTS,PARAMS:PARAMS};
});
