(async function(){
const root=document.getElementById('energy-sections'); const base='energy-strategies/sections/';
for(let i=1;i<=6;i++){const n=String(i).padStart(2,'0'),dir=`section-${n}`;try{const html=await fetch(`${base}${dir}/${dir}.html`).then(r=>{if(!r.ok)throw Error(r.status);return r.text()});const holder=document.createElement('div');holder.innerHTML=html;while(holder.firstChild)root.appendChild(holder.firstChild);const css=document.createElement('link');css.rel='stylesheet';css.href=`${base}${dir}/${dir}.css`;document.head.appendChild(css);const js=document.createElement('script');js.src=`${base}${dir}/${dir}.js`;js.defer=false;document.body.appendChild(js);await new Promise(res=>{js.onload=res;js.onerror=res})}catch(e){root.insertAdjacentHTML('beforeend',`<div class="loaderror">Section ${i} could not load. Serve the site through Netlify/GitHub Pages rather than opening the HTML directly from your computer.</div>`)}}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.go)?.scrollIntoView({behavior:'smooth'})));
document.getElementById('download-profile').addEventListener('click',()=>{SWPProfile.download();toast('Concern_Profile downloaded')});
window.toast=function(t){const e=document.getElementById('toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',1800)};
})();
