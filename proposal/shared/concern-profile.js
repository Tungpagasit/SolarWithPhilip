window.SWP.loadConcernProfile=()=>{
  for(const key of ['Concern_Profile','concernProfile','swp_concern_profile']){
    try{const raw=localStorage.getItem(key);if(raw){window.SWP.state.concernProfile=JSON.parse(raw);window.SWP.save();return true}}catch(error){console.warn('Concern Profile could not be loaded',error)}
  }
  return false;
};
