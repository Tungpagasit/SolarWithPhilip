const map = {
home:'index.html',
start:'start-here.html',
proposal:'proposal.html',
review:'proposal.html',
strategies:'energy-strategies.html',
guide:'california-guide.html',
costs:'energy-costs.html',
faq:'faq.html',
about:'about.html',
reviews:'reviews.html',
contact:'contact.html'
};
 
document.querySelectorAll('[data-page],[data-p]').forEach(function(el){
el.addEventListener('click', function(e){
e.preventDefault();
const k = el.dataset.page || el.dataset.p;
if(map[k]) location.href = map[k];
});
});
 
document.querySelectorAll('.acc-btn').forEach(function(btn){
btn.addEventListener('click', function(){
const box = btn.parentElement;
 
box.classList.toggle('open');
 
const symbol = btn.querySelector('span');
 
if(symbol){
symbol.textContent =
box.classList.contains('open') ? '−' : '+';
}
});
});
