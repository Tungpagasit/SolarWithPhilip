// ============================================================
// SOLAR WITH PHILIP
// ENERGY STRATEGIES CONTROLLER
//
// The section HTML is the visual source of truth.
// JavaScript adapts to the locked section files.
// ============================================================

(function () {

  window.initializeEnergyStrategies = function () {

    // ========================================================
    // CENTRAL PROFILE STATE
    // ========================================================

    const state = {
      solutions: [],
      concerns: [],
      path: "",
      loads: {}
    };

    const esOutcomes = {};
    const esBarriers = {};
    const esResolutions = {};

    let finalDirection = "";


    // ========================================================
    // SECTION 6 RESOLUTION COPY
    // ========================================================

    const esResolutionCopy = {

      "Roof condition or roof damage":
        "Roof review, written scope, contractor insurance, workmanship and penetration coverage, responsibility for damage, and future roof-replacement planning.",

      "Installation reliability":
        "Approved design, licensed contractor, permit and inspection process, workmanship terms, defect-correction process, and activation verification.",

      "Installation timeline":
        "Design and site-review milestones, permit and utility responsibilities, access needs, status updates, and a clear explanation that physical installation is not the final activation step.",

      "Equipment service and replacement":
        "Manufacturer coverage, workmanship coverage, monitoring, repair response, labor responsibility, replacement responsibility, and post-warranty exposure.",

      "Long-term agreement":
        "Starting payment or rate, escalator if any, agreement term, estimated total payments, service obligations, transfer provisions, purchase or buyout options if offered, and end-of-term provisions.",

      "Home sale or transfer":
        "Transfer documents, notice requirements, timing, payoff or assumption requirements, purchase option if offered, and transaction support.",

      "Equipment appearance":
        "Panel layout, conduit path, battery and inverter location, required clearances, and any applicable HOA or local review.",

      "Ownership structure":
        "Who owns the system during the term, purchase options if offered, timing and price conditions, and responsibility before and after any ownership change."
    };


    // ========================================================
    // HELPERS
    // ========================================================

    function getElement(id) {
      return document.getElementById(id);
    }


    function money(number) {

      if (!number) {
        return "—";
      }

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(number);
    }


 
