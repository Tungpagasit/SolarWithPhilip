window.SWP.register('energy-history', {
  mount(root) {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const grid = root.querySelector('[data-month-grid]');
    const buttons = root.querySelectorAll('[data-energy-mode]');
    let mode = 'kwh';

    function getArray() {
      return mode === 'kwh'
        ? window.SWP.state.currentEnergy.monthlyKwh
        : window.SWP.state.currentEnergy.monthlyCost;
    }

    function renderInputs() {
      const values = getArray();
      buttons.forEach(button => {
        button.classList.toggle('active', button.dataset.energyMode === mode);
      });

      grid.innerHTML = monthNames.map((month, index) => {
        const value = values[index] ?? '';
        const unit = mode === 'kwh' ? 'kWh' : '$';
        return `<label class="month-field">
          <span>${month} ${unit}</span>
          <input
            type="number"
            min="0"
            step="1"
            inputmode="decimal"
            data-month-index="${index}"
            value="${value}"
            aria-label="${month} ${mode === 'kwh' ? 'kilowatt hours' : 'electricity cost'}">
        </label>`;
      }).join('');

      grid.querySelectorAll('[data-month-index]').forEach(input => {
        input.addEventListener('input', event => {
          const index = Number(event.currentTarget.dataset.monthIndex);
          const nextValue = event.currentTarget.value === '' ? null : Number(event.currentTarget.value);
          getArray()[index] = nextValue;
          window.SWP.calc.refresh();
        });
      });
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        mode = button.dataset.energyMode;
        renderInputs();
      });
    });

    renderInputs();
  }
});
