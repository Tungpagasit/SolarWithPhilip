(function () {

  const section = document.getElementById("s1");

  if (!section) {
    return;
  }


  // =========================================================
  // ELEMENT HELPERS
  // =========================================================

  function get(id) {
    return document.getElementById(id);
  }


  function money(value) {

    if (!value && value !== 0) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }


  // =========================================================
  // MAIN FIELDS
  // =========================================================

  const billInput =
    get("s1-bill");

  const rateInput =
    get("s1-rate");

  const utilityGrowthInput =
    get("s1-growth");

  const usageGrowthInput =
    get("s1-usegrowth");

  const estimatedKwh =
    get("s1-kwh");

  const combinedOutput =
    get("s1-combined");

  const backupInput =
    get("s1-backup");

  const durationInput =
    get("s1-duration");

  const futureInput =
    get("s1-future");

  const loadSummary =
    get("s1-load-summary");

  const situationSummary =
    get("s1-summary");


  // =========================================================
  // RESTORE SAVED SECTION 1 DATA
  // =========================================================

  const savedProfile =
    window.SWPProfile
      ? SWPProfile.get()
      : {};

  const saved =
    savedProfile.section1 || {};


  if (billInput && saved.bill !== undefined) {
    billInput.value = saved.bill;
  }


  if (rateInput && saved.assumedRate !== undefined) {
    rateInput.value = saved.assumedRate;
  }


  if (
    utilityGrowthInput &&
    saved.utilityGrowth !== undefined
  ) {

    utilityGrowthInput.value =
      saved.utilityGrowth;
  }


  if (
    usageGrowthInput &&
    saved.usageGrowth !== undefined
  ) {

    usageGrowthInput.value =
      saved.usageGrowth;
  }


  if (
    backupInput &&
    saved.backup
  ) {

    backupInput.value =
      saved.backup;
  }


  if (
    durationInput &&
    saved.duration
  ) {

    durationInput.value =
      saved.duration;
  }


  if (
    futureInput &&
    saved.future
  ) {

    futureInput.value =
      saved.future;
  }


  // =========================================================
  // RESTORE SAVED FUTURE LOADS
  // =========================================================

  const savedLoads =
    saved.futureLoads || {};


  section
    .querySelectorAll(".s1-driver")
    .forEach(function (driver) {

      const key =
        driver.dataset.load;

      const toggle =
        driver.querySelector(
          ".s1-load-toggle"
        );

      const valueInput =
        driver.querySelector(
          ".s1-load-value"
        );


      if (
        savedLoads[key] &&
        savedLoads[key].selected
      ) {

        toggle.checked = true;

        driver.classList.add(
          "is-selected"
        );
      }


      if (
        savedLoads[key] &&
        savedLoads[key].kwh !== undefined
      ) {

        valueInput.value =
          savedLoads[key].kwh;
      }
    });


  // =========================================================
  // FUTURE LOAD INFORMATION
  // =========================================================

  function collectFutureLoads() {

    const loads = {};

    let totalAddedKwh = 0;


    section
      .querySelectorAll(".s1-driver")
      .forEach(function (driver) {

        const key =
          driver.dataset.load;

        const toggle =
          driver.querySelector(
            ".s1-load-toggle"
          );

        const valueInput =
          driver.querySelector(
            ".s1-load-value"
          );


        const selected =
          toggle.checked;


        const kwh =
          Number(valueInput.value) || 0;


        driver.classList.toggle(
          "is-selected",
          selected
        );


        loads[key] = {

          selected:
            selected,

          kwh:
            selected
              ? kwh
              : 0

        };


        if (selected) {
          totalAddedKwh += kwh;
        }
      });


    return {

      loads:
        loads,

      totalAddedKwh:
        totalAddedKwh

    };
  }


  // =========================================================
  // MAIN CALCULATION
  // =========================================================

  function update() {

    const bill =
      Number(billInput.value) || 0;


    const assumedRate =
      Number(rateInput.value) || 0.40;


    const utilityGrowth =
      Number(
        utilityGrowthInput.value
      ) || 0;


    const usageGrowth =
      Number(
        usageGrowthInput.value
      ) || 0;


    const combinedGrowth =
      utilityGrowth +
      usageGrowth;


    const currentKwh =
      assumedRate > 0
        ? bill / assumedRate
        : 0;


    const futureLoads =
      collectFutureLoads();


    const addedKwh =
      futureLoads.totalAddedKwh;


    const totalPlannedKwh =
      currentKwh +
      addedKwh;


    const addedMonthlyCost =
      addedKwh *
      assumedRate;


    const currentEquivalentCost =
      bill +
      addedMonthlyCost;


    // =======================================================
    // ESTIMATED CURRENT USAGE
    // =======================================================

    if (estimatedKwh) {

      estimatedKwh.textContent =
        bill > 0
          ? Math.round(currentKwh)
              .toLocaleString() +
            " kWh/month planning estimate"
          : "Enter a payment to create an estimate";
    }


    // =======================================================
    // COMBINED ANNUAL ILLUSTRATION
    // =======================================================

    if (combinedOutput) {

      combinedOutput.textContent =
        combinedGrowth + "%";
    }


    // =======================================================
    // FUTURE COST ILLUSTRATIONS
    // =======================================================

    [5, 10, 15, 20]
      .forEach(function (year) {

        const output =
          get("s1-y" + year);


        if (!output) {
          return;
        }


        if (!bill) {

          output.textContent =
            "—";

          return;
        }


        const futureCost =
          bill *
          Math.pow(
            1 +
            combinedGrowth / 100,
            year
          );


        output.textContent =
          money(
            Math.round(
              futureCost
            )
          );
      });


    // =======================================================
    // ADDED / FUTURE USAGE SUMMARY
    // =======================================================

    const selectedLoadNames = [];


    section
      .querySelectorAll(".s1-driver")
      .forEach(function (driver) {

        const toggle =
          driver.querySelector(
            ".s1-load-toggle"
          );


        if (!toggle.checked) {
          return;
        }


        const label =
          driver
            .querySelector(
              ".driver-title label"
            )
            .textContent
            .trim();


        selectedLoadNames.push(
          label
        );
      });


    if (loadSummary) {

      if (
        selectedLoadNames.length === 0
      ) {

        loadSummary.textContent =
          "Select the household changes that apply.";

      } else {

        loadSummary.innerHTML =

          "<strong>Selected future loads:</strong> " +
          selectedLoadNames.join(", ") +

          "<br>" +

          "<strong>Total added usage:</strong> " +
          Math.round(addedKwh)
            .toLocaleString() +
          " kWh/month" +

          "<br>" +

          "<strong>Approx. additional cost at today's assumed rate:</strong> " +
          money(
            Math.round(
              addedMonthlyCost
            )
          ) +
          "/month";
      }
    }


    // =======================================================
    // SITUATION SO FAR
    // =======================================================

    const backup =
      backupInput.value;


    const duration =
      durationInput.value;


    const futureNotes =
      futureInput.value.trim();


    if (situationSummary) {

      if (!bill) {

        situationSummary.textContent =
          "Add what you know. Your answers will carry forward.";

      } else {

        let summary =

          "<strong>Current estimated usage:</strong> " +
          Math.round(currentKwh)
            .toLocaleString() +
          " kWh/month" +

          "<br>" +

          "<strong>Added / future usage:</strong> " +
          Math.round(addedKwh)
            .toLocaleString() +
          " kWh/month" +

          "<br>" +

          "<strong>Total planned usage:</strong> " +
          Math.round(totalPlannedKwh)
            .toLocaleString() +
          " kWh/month" +

          "<br>" +

          "<strong>Current-equivalent monthly cost:</strong> " +
          money(
            Math.round(
              currentEquivalentCost
            )
          ) +

          "<br>" +

          "<strong>Selected utility-rate increase:</strong> " +
          utilityGrowth +
          "% per year" +

          "<br>" +

          "<strong>Selected home-usage increase:</strong> " +
          usageGrowth +
          "% per year" +

          "<br>" +

          "<strong>Combined planning illustration:</strong> " +
          combinedGrowth +
          "% per year";


        if (backup) {

          summary +=

            "<br>" +

            "<strong>Backup goal:</strong> " +
            backup;
        }


        if (duration) {

          summary +=

            " — " +
            duration;
        }


        if (futureNotes) {

          summary +=

            "<br>" +

            "<strong>Other future changes:</strong> " +
            futureNotes;
        }


        situationSummary.innerHTML =
          summary;
      }
    }


    // =======================================================
    // WRITE EVERYTHING INTO ONE CENTRAL PROFILE
    // =======================================================

    if (window.SWPProfile) {

      SWPProfile.set(
        "section1",
        {

          bill:
            bill,


          assumedRate:
            assumedRate,


          estimatedCurrentKwh:
            Math.round(
              currentKwh
            ),


          utilityGrowth:
            utilityGrowth,


          usageGrowth:
            usageGrowth,


          combinedGrowth:
            combinedGrowth,


          futureLoads:
            futureLoads.loads,


          totalAddedKwh:
            Math.round(
              addedKwh
            ),


          totalPlannedKwh:
            Math.round(
              totalPlannedKwh
            ),


          addedMonthlyCost:
            Math.round(
              addedMonthlyCost
            ),


          currentEquivalentCost:
            Math.round(
              currentEquivalentCost
            ),


          backup:
            backup,


          duration:
            duration,


          future:
            futureNotes

        }
      );
    }
  }


  // =========================================================
  // MAIN INPUT LISTENERS
  // =========================================================

  [
    billInput,
    rateInput,
    utilityGrowthInput,
    usageGrowthInput,
    backupInput,
    durationInput,
    futureInput

  ].forEach(function (element) {

    if (!element) {
      return;
    }


    element.addEventListener(
      "input",
      update
    );


    element.addEventListener(
      "change",
      update
    );

  });


  // =========================================================
  // FUTURE LOAD LISTENERS
  // =========================================================

  section
    .querySelectorAll(
      ".s1-load-toggle"
    )
    .forEach(function (toggle) {

      toggle.addEventListener(
        "change",
        update
      );

    });


  section
    .querySelectorAll(
      ".s1-load-value"
    )
    .forEach(function (input) {

      input.addEventListener(
        "input",
        update
      );

    });


  // =========================================================
  // MOBILE / CLICK INFO POPUPS
  //
  // Desktop works by CSS hover/focus.
  // Clicking lets touch devices open the information.
  // =========================================================

  section
    .querySelectorAll(
      ".s1-info"
    )
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          event.stopPropagation();


          const tip =
            button.querySelector(
              ".s1-tip"
            );


          if (!tip) {
            return;
          }


          const alreadyOpen =
            tip.classList.contains(
              "is-open"
            );


          section
            .querySelectorAll(
              ".s1-tip.is-open"
            )
            .forEach(
              function (openTip) {

                openTip.classList.remove(
                  "is-open"
                );

              }
            );


          if (!alreadyOpen) {

            tip.classList.add(
              "is-open"
            );

          }

        }
      );

    });


  document.addEventListener(
    "click",
    function () {

      section
        .querySelectorAll(
          ".s1-tip.is-open"
        )
        .forEach(
          function (tip) {

            tip.classList.remove(
              "is-open"
            );

          }
        );

    }
  );


  // =========================================================
  // INITIAL CALCULATION
  // =========================================================

  update();

})();
