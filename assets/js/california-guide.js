document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.classList.toggle('open', !isOpen);
      });
    });
