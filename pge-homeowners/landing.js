(function(){
  'use strict';
  var KEYS=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  var links=[].slice.call(document.querySelectorAll('[data-lp-link]'));
  var sent={view:false,explore:false};

  function track(name){
    try{
      if(typeof window.gtag!=='function')return;
      window.gtag('event',name,{campaign_name:'pge_homeowners',landing_page:'pge_homeowners',transport_type:'beacon'});
    }catch(e){}
  }

  try{
    var src=new URLSearchParams(window.location.search);
    var keep=[];
    KEYS.forEach(function(k){var v=src.get(k);if(v&&v.trim()&&keep.every(function(p){return p[0]!==k;}))keep.push([k,v]);});
    if(keep.length){
      var qs=keep.map(function(p){return encodeURIComponent(p[0])+'='+encodeURIComponent(p[1]);}).join('&');
      links.forEach(function(a){a.setAttribute('href','/?'+qs);});
    }
  }catch(e){}

  if(!sent.view){sent.view=true;track('pge_landing_view');}

  var LP={lp_id:'pge_homeowners',lp_version:'v1',lp_key:'pge_homeowners_v1',lp_cta:'pge_landing_explore'};

  links.forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();

      if(!sent.explore){
        sent.explore=true;
        track('pge_landing_explore');
      }

      var dest=a.href;
      try{
        var u=new URL(a.href,window.location.href);
        var cta=a.classList.contains('lp-logo')?'pge_landing_logo':a.classList.contains('lp-hit')?'pge_landing_page':'pge_landing_explore';
        Object.keys(LP).forEach(function(k){u.searchParams.set(k,k==='lp_cta'?cta:LP[k]);});
        dest=u.href;
      }catch(err){}
      window.location.replace(dest);
    });
  });
})();
