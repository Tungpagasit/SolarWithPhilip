/* Solar With Philip delegated link tracking (Phase 2A). Sends categorical data only via swpTrack. */
(function(){
  'use strict';
  if(typeof document==='undefined')return;
  function pageType(){
    var p=location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
    return p==='/'?'home':p.replace(/^\//,'').replace(/\/$/,'').slice(0,40)||'home';
  }
  function destPath(a){try{return new URL(a.href,location.href).pathname;}catch(e){return '';}}
  document.addEventListener('click',function(e){
    if(typeof window.swpTrack!=='function')return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a)return;
    var href=a.getAttribute('href')||'';
    var scheme=href.slice(0,7).toLowerCase();
    var loc=a.closest('[data-link-location]');
    var common={page_type:pageType(),link_location:loc?loc.getAttribute('data-link-location'):(a.closest('.swp-shell')?'header':'body')};
    if(scheme.indexOf('tel:')===0)return void window.swpTrack('phone_click',common,{dedupeKey:'tel'});
    if(scheme.indexOf('sms:')===0)return void window.swpTrack('text_click',common,{dedupeKey:'sms'});
    if(scheme==='mailto:')return void window.swpTrack('email_click',common,{dedupeKey:'mail'});
    var cta=a.closest('[data-cta]');
    if(cta){
      var el=cta.hasAttribute('data-cta')?cta:a;
      window.swpTrack('cta_click',{cta_name:el.getAttribute('data-cta'),cta_location:common.link_location,destination:destPath(a),page_type:common.page_type},{dedupeKey:'cta:'+el.getAttribute('data-cta')});
    }
  },true);
})();
