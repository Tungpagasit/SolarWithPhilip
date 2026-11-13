/* Solar With Philip shared nav behavior (Phase 2A). Progressive enhancement over static markup. */
(function(){
  'use strict';
  var shell=document.querySelector('.swp-shell');
  if(!shell)return;
  var toggle=shell.querySelector('.swp-shell__toggle');
  var list=shell.querySelector('.swp-shell__list');
  var subs=[].slice.call(shell.querySelectorAll('.swp-shell__has-sub'));
  var mq=window.matchMedia('(max-width:900px)');

  function setSub(li,open,focusBtn){
    var b=li.querySelector('.swp-shell__sub-toggle');
    li.classList.toggle('is-open',open);
    if(b){b.setAttribute('aria-expanded',open?'true':'false');if(!open&&focusBtn)b.focus();}
  }
  function closeSubs(except){subs.forEach(function(li){if(li!==except)setSub(li,false);});}
  function setMenu(open,focusBtn){
    if(!toggle||!list)return;
    list.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');
    if(!open){closeSubs();if(focusBtn)toggle.focus();}
  }
  function anyOpen(){return (list&&list.classList.contains('is-open'))||subs.some(function(li){return li.classList.contains('is-open');});}

  if(toggle)toggle.addEventListener('click',function(){setMenu(toggle.getAttribute('aria-expanded')!=='true');});
  subs.forEach(function(li){
    var b=li.querySelector('.swp-shell__sub-toggle');
    if(!b)return;
    b.addEventListener('click',function(){var open=!li.classList.contains('is-open');closeSubs(li);setSub(li,open);});
  });
  shell.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');
    if(a){setMenu(false);closeSubs();}
  });
  document.addEventListener('click',function(e){
    if(!shell.contains(e.target)&&anyOpen()){setMenu(false);closeSubs();}
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape'||!anyOpen())return;
    var menuOpen=list&&list.classList.contains('is-open');
    var openSub=subs.filter(function(li){return li.classList.contains('is-open');})[0];
    if(openSub&&!(menuOpen&&!shell.contains(document.activeElement))){setSub(openSub,false,true);if(!menuOpen)return;}
    if(menuOpen&&mq.matches)setMenu(false,true);
  });
  var onChange=function(){setMenu(false);closeSubs();};
  if(mq.addEventListener)mq.addEventListener('change',onChange);else if(mq.addListener)mq.addListener(onChange);
  window.addEventListener('resize',function(){if(!mq.matches&&anyOpen())onChange();});
})();
