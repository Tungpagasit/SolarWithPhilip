function draw() {
  const property = SWP.data.property;
  if (!property) return;

  const solar = property.solar?.solarPotential || {};
  const squareMeters = Number(solar.wholeRoofStats?.areaMeters2) || 0;
  const squareFeet = squareMeters * 10.7639;

  root.querySelector('[data-property]').innerHTML = `
    <div class="property-view">
      <img src="/.netlify/functions/property-analysis?mode=image&lat=${property.lat}&lng=${property.lng}" alt="Satellite property view">
      <div class="property-facts">
        <b>${SWP.esc(property.formattedAddress || '')}</b>
        <p>Usable roof area: ${SWP.num(squareFeet)} sq ft</p>
        <p>Annual sunshine: ${SWP.num(solar.maxSunshineHoursPerYear || 0)} hours</p>
        ${property.detectedArrays ? '<p>Existing rooftop solar was detected and should be reviewed before final panel placement.</p>' : ''}
        <div class="method">
          <h3>How Monthly Production Is Estimated</h3>
          <p>Google property information helps us understand the home’s rooftop and annual solar potential. The monthly production pattern shown here is a preliminary planning estimate based on the property’s annual production potential and local seasonal solar patterns.</p>
          <p>Final monthly production will be confirmed through the completed system design.</p>
        </div>
      </div>
    </div>
  `;
}

draw();
document.addEventListener('swp:data', draw);
