const ENERGY_SECTION_FILES = ['01-concerns.html', '02-solutions.html', '03-energy-options.html', '04-solar-101.html', '05-decision.html', '06-resolution.html'];

async function loadEnergyStrategySections(){
  const host=document.getElementById("energy-strategy-sections");
  try{
    const parts=await Promise.all(ENERGY_SECTION_FILES.map(async file=>{
      const response=await fetch(`energy-strategies/sections/${file}`);
      if(!response.ok) throw new Error(`Could not load ${file}`);
      return response.text();
    }));
    host.innerHTML=parts.join("\n");
    window.initializeEnergyStrategies();
  }catch(error){
    console.error(error);
    host.innerHTML='<section class="section"><div class="wrap"><div class="card"><h2>Energy Strategies could not load.</h2><p>Please refresh the page or contact Philip.</p></div></div></section>';
  }
}
document.addEventListener("DOMContentLoaded",loadEnergyStrategySections);
