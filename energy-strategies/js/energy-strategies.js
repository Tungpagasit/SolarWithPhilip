// ============================================================
// SOLAR WITH PHILIP
// ENERGY STRATEGIES CONTROLLER
// ============================================================

(function () {

  window.initializeEnergyStrategies = function () {

    // ========================================================
    // CENTRAL STATE
    // ========================================================

    var state = {
      solutions: [],
      concerns: [],
      path: "",
      loads: {}
    };

    var esOutcomes = {};
    var esBarriers = {};
    var esResolutions = {};
    var finalDirection = "";


    // ========================================================
    // HELPERS
    // ========================================================

    function el(id) {
      return document.getElementById(id);
    }


    function money(value) {

      if (!value) {
        return "—";
      }

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(value);
    }


    function putList(id, values) {

      var target = el(id);

      if (!target) {
        return;
      }

      if (!values.length) {
        target.innerHTML = "<li>Nothing selected</li>";
        return;
      }

      target.innerHTML = values
        .map(function (value) {
          return "<li>" + value + "</li>";
        })
        .join("");
    }


    // ========================================================
    // SECTION 1
    // ========================================================

    function calculateEnergySituation() {

      var billInput = el("bill");
      var blendInput = el("blend");
      var rateInput = el("rg");
      var usageInput = el("ug");

      if (!billInput ||
          !blendInput ||
          !rateInput ||
          !usageInput) {
        return;
      }


      var bill =
        Number(billInput.value) || 0;

      var blend =
        Number(blendInput.value) || 0.40;

      var rateGrowth =
        (Number(rateInput.value) || 0) / 100;

      var usageGrowth =
        (Number(usageInput.value) || 0) / 100;

      var combinedGrowth =
        rateGrowth + usageGrowth;

      var currentKwh = 0;

      if (blend > 0) {
        currentKwh = bill / blend;
      }


      // ------------------------------------------------------
      // Estimated monthly usage
      // ------------------------------------------------------

      var estKwh = el("estKwh");

      if (estKwh) {

        if (bill > 0) {

          estKwh.textContent =
            Math.round(currentKwh) +
            " kWh/month planning estimate";

        } else {

          estKwh.textContent =
            "Enter a payment to create an estimate";
        }
      }


      // ------------------------------------------------------
      // Combined annual illustration
      // ------------------------------------------------------

      var combined = el("combined");

      if (combined) {

        combined.textContent =
          (combinedGrowth * 100).toFixed(0) + "%";
      }


      // ------------------------------------------------------
      // Future cost illustrations
      // ------------------------------------------------------

      [5, 10, 15, 20].forEach(function (year) {

        var output =
          el("y" + year);

        if (!output) {
          return;
        }

        var projectedCost =
          bill *
          Math.pow(
            1 + combinedGrowth,
            year
          );

        output.textContent =
          money(projectedCost);
      });


      // ------------------------------------------------------
      // Added / future electricity usage
      // ------------------------------------------------------

      var addedKwh = 0;

      state.loads = {};


      document
        .querySelectorAll("#s1 .driver")
        .forEach(function (driver) {

          var checkbox =
            driver.querySelector(".toggle");

          var loadInput =
            driver.querySelector(".load");

          if (!checkbox ||
              !loadInput ||
              !checkbox.checked) {
            return;
          }


          var loadValue =
            Number(loadInput.value) || 0;

          var loadKey =
            checkbox.getAttribute("data-key");


          if (!loadKey) {
            loadKey = "load";
          }


          state.loads[loadKey] =
            loadValue;

          addedKwh +=
            loadValue;
        });


      // ------------------------------------------------------
      // Added usage summary
      // ------------------------------------------------------

      var loadSum =
        el("loadSum");

      if (loadSum) {

        if (addedKwh > 0) {

          var addedMonthlyCost =
            addedKwh * blend;


          loadSum.innerHTML =
            "Selected added usage: " +
            "<b>" +
            Math.round(addedKwh) +
            " kWh/month</b>" +
            ", about <b>" +
            money(addedMonthlyCost) +
            "/month</b> " +
            "at the assumed current blended rate.";

        } else {

          loadSum.textContent =
            "Select the household changes that apply.";
        }
      }


      // ------------------------------------------------------
      // Section 2 Situation So Far
      // ------------------------------------------------------

      var situation =
        el("situation");

      if (!situation) {
        return;
      }


      if (!bill) {

        situation.innerHTML =
          "Enter your information above and select the outcomes you want.";

        return;
      }


      var totalKwh =
        currentKwh + addedKwh;


      var totalCurrentCost =
        bill +
        addedKwh * blend;


      var cost5 =
        totalCurrentCost *
        Math.pow(
          1 + combinedGrowth,
          5
        );

      var cost10 =
        totalCurrentCost *
        Math.pow(
          1 + combinedGrowth,
          10
        );

      var cost15 =
        totalCurrentCost *
        Math.pow(
          1 + combinedGrowth,
          15
        );

      var cost20 =
        totalCurrentCost *
        Math.pow(
          1 + combinedGrowth,
          20
        );


      situation.innerHTML =
        "<b>Estimated current usage:</b> " +
        Math.round(currentKwh) +
        " kWh/month" +

        "<br><b>Added / future usage:</b> " +
        Math.round(addedKwh) +
        " kWh/month" +

        "<br><b>Total planned usage:</b> " +
        Math.round(totalKwh) +
        " kWh/month" +

        "<br><b>Estimated current-equivalent cost:</b> " +
        money(totalCurrentCost) +
        "/month" +

        "<br><b>Combined annual illustration:</b> " +
        (combinedGrowth * 100).toFixed(0) +
        "%" +

        "<br><b>5-year monthly illustration:</b> " +
        money(cost5) +

        "<br><b>10-year monthly illustration:</b> " +
        money(cost10) +

        "<br><b>15-year monthly illustration:</b> " +
        money(cost15) +

        "<br><b>20-year monthly illustration:</b> " +
        money(cost20) +

        "<br><b>Solutions selected:</b> " +
        (
          state.solutions.length
            ? state.solutions.join(", ")
            : "None yet"
        );
    }


    // ========================================================
    // SECTION 1 LISTENERS
    // ========================================================

    document
      .querySelectorAll(
        "#s1 input, #s1 select, #s1 textarea"
      )
      .forEach(function (input) {

        input.addEventListener(
          "input",
          calculateEnergySituation
        );

        input.addEventListener(
          "change",
          calculateEnergySituation
        );
      });


    // ========================================================
    // SECTION 2
    // ========================================================

    document
      .querySelectorAll(".solution")
      .forEach(function (solution) {

        solution.addEventListener(
          "click",
          function () {

            solution.classList.toggle(
              "selected"
            );


            var value =
              solution.getAttribute(
                "data-value"
              );


            if (value) {

              if (
                solution.classList.contains(
                  "selected"
                )
              ) {

                if (
                  state.solutions.indexOf(
                    value
                  ) === -1
                ) {

                  state.solutions.push(
                    value
                  );
                }

              } else {

                state.solutions =
                  state.solutions.filter(
                    function (item) {

                      return (
                        item !== value
                      );
                    }
                  );
              }
            }


            calculateEnergySituation();
          }
        );
      });


    // ========================================================
    // SECTION 5
    // ========================================================

    function installChoiceButtons(
      containerSelector,
      store
    ) {

      document
        .querySelectorAll(
          containerSelector +
          " .decision-card"
        )
        .forEach(function (card) {

          var label =
            card.getAttribute(
              "data-label"
            );


          card
            .querySelectorAll("button")
            .forEach(function (button) {

              button.addEventListener(
                "click",
                function () {

                  card
                    .querySelectorAll(
                      "button"
                    )
                    .forEach(
                      function (other) {

                        other.classList.remove(
                          "active"
                        );
                      }
                    );


                  button.classList.add(
                    "active"
                  );


                  if (label) {

                    store[label] =
                      button.textContent.trim();
                  }


                  renderSection5();
                }
              );
            });
        });
    }


    installChoiceButtons(
      "#outcomeChoices",
      esOutcomes
    );


    installChoiceButtons(
      "#barrierChoices",
      esBarriers
    );


    function renderSection5() {

      var mustHave = [];
      var important = [];
      var niceToHave = [];
      var notImportant = [];

      var couldStop = [];
      var okayResolved = [];
      var noConcern = [];


      Object.keys(
        esOutcomes
      ).forEach(function (key) {

        var answer =
          esOutcomes[key];


        if (answer === "Must Have") {
          mustHave.push(key);
        }

        if (answer === "Important") {
          important.push(key);
        }

        if (answer === "Nice to Have") {
          niceToHave.push(key);
        }

        if (answer === "Not Important") {
          notImportant.push(key);
        }
      });


      Object.keys(
        esBarriers
      ).forEach(function (key) {

        var answer =
          esBarriers[key];


        if (answer === "Could Stop Me") {
          couldStop.push(key);
        }

        if (answer === "Okay If Resolved") {
          okayResolved.push(key);
        }

        if (answer === "Not a Concern") {
          noConcern.push(key);
        }
      });


      var outcomeSummary =
        el("outcomeSummary");


      if (outcomeSummary) {

        outcomeSummary.innerHTML =
          "<b>Must Have:</b> " +
          (mustHave.join(", ") || "None") +

          "<br><b>Important:</b> " +
          (important.join(", ") || "None") +

          "<br><b>Nice to Have:</b> " +
          (niceToHave.join(", ") || "None") +

          "<br><b>Not Important:</b> " +
          (notImportant.join(", ") || "None");
      }


      putList(
        "stopSummary",
        couldStop
      );

      putList(
        "resolveSummary",
        okayResolved
      );

      putList(
        "noneSummary",
        noConcern
      );


      var section5Summary =
        el("section5Summary");


      if (section5Summary) {

        section5Summary.innerHTML =
          "<b>Must Have:</b> " +
          (mustHave.join(", ") || "None") +

          "<br><b>Important:</b> " +
          (important.join(", ") || "None") +

          "<br><b>Potential impasses:</b> " +
          (couldStop.join(", ") || "None") +

          "<br><b>Acceptable if resolved:</b> " +
          (okayResolved.join(", ") || "None");
      }


      buildSection6();
    }


    // ========================================================
    // SECTION 6
    // ========================================================

    var resolutionCopy = {

      "Roof condition or roof damage":
        "Review the roof before final design, clarify the installation scope, workmanship protection, insurance and responsibility for installation-related damage.",

      "Installation reliability":
        "Confirm the approved design, licensed installer, inspection process, workmanship protection and correction process.",

      "Installation timeline":
        "Review design, permit, utility, installation and activation milestones before installation begins.",

      "Equipment service and replacement":
        "Review written equipment warranties, workmanship protection, monitoring, repair responsibility and replacement responsibility.",

      "Long-term agreement":
        "Review the payment structure, agreement term, escalator if any, service duties, transfer provisions, purchase options if offered and end-of-term provisions.",

      "Home sale or transfer":
        "Review transfer requirements, notice requirements, payoff or assumption provisions and available purchase options if offered.",

      "Equipment appearance":
        "Review panel layout, conduit routing, battery location, inverter location and applicable clearance requirements.",

      "Ownership structure":
        "Confirm who owns the equipment, service responsibility and whether purchase or ownership options are available under the agreement."
    };


    function buildSection6() {

      var resolutionArea =
        el("resolutionArea");


      if (!resolutionArea) {
        return;
      }


      var relevant =
        Object.keys(
          esBarriers
        ).filter(function (key) {

          return (
            esBarriers[key] ===
              "Could Stop Me" ||

            esBarriers[key] ===
              "Okay If Resolved"
          );
        });


      if (!relevant.length) {

        resolutionArea.innerHTML =
          '<div class="card">' +
          "Choose possible barriers in Section 5 " +
          "to build your personalized resolution list." +
          "</div>";

        renderResolutionSummary();

        return;
      }


      resolutionArea.innerHTML =
        relevant
          .map(function (key) {

            return (
              '<div class="resolution-card">' +

              "<h3>" +
              key +
              "</h3>" +

              "<p><b>Your concern level:</b> " +
              esBarriers[key] +
              "</p>" +

              "<p><b>What should address it:</b> " +
              (
                resolutionCopy[key] ||
                "Review this concern with Philip."
              ) +
              "</p>" +

              '<div class="resolution-actions" ' +
              'data-key="' +
              key +
              '">' +

              "<button>Resolved Enough</button>" +

              "<button>Need More Information</button>" +

              "<button>Still a Deal-Breaker</button>" +

              "<button>Discuss With Philip</button>" +

              "</div>" +

              "</div>"
            );
          })
          .join("");


      document
        .querySelectorAll(
          ".resolution-actions"
        )
        .forEach(function (group) {

          group
            .querySelectorAll("button")
            .forEach(function (button) {

              button.addEventListener(
                "click",
                function () {

                  group
                    .querySelectorAll(
                      "button"
                    )
                    .forEach(
                      function (other) {

                        other.classList.remove(
                          "active"
                        );
                      }
                    );


                  button.classList.add(
                    "active"
                  );


                  var key =
                    group.getAttribute(
                      "data-key"
                    );


                  if (key) {

                    esResolutions[key] =
                      button.textContent.trim();
                  }


                  renderResolutionSummary();
                }
              );
            });
        });


      renderResolutionSummary();
    }


    function renderResolutionSummary() {

      var resolved = [];
      var needMore = [];
      var dealBreakers = [];


      Object.keys(
        esResolutions
      ).forEach(function (key) {

        var result =
          esResolutions[key];


        if (
          result ===
          "Resolved Enough"
        ) {
          resolved.push(key);
        }


        if (
          result ===
            "Need More Information" ||

          result ===
            "Discuss With Philip"
        ) {
          needMore.push(key);
        }


        if (
          result ===
          "Still a Deal-Breaker"
        ) {
          dealBreakers.push(key);
        }
      });


      putList(
        "resolvedSummary",
        resolved
      );

      putList(
        "moreSummary",
        needMore
      );

      putList(
        "dealSummary",
        dealBreakers
      );
    }


    // ========================================================
    // FINAL DIRECTION
    // ========================================================

    document
      .querySelectorAll(
        'input[name="finalDecision"]'
      )
      .forEach(function (input) {

        input.addEventListener(
          "change",
          function () {

            finalDirection =
              input.value;


            var summary =
              el("finalSummary");


            if (summary) {

              summary.innerHTML =
                "<b>Current direction:</b> " +
                finalDirection +

                "<br>" +

                "This can still change after Philip reviews " +
                "the home, usage and actual proposals.";
            }
          }
        );
      });


    // ========================================================
    // CONCERN PROFILE DOWNLOAD
    // ========================================================

    function downloadProfile() {

      calculateEnergySituation();


      var profile = {

        file_type:
          "SolarWithPhilip_Concern_Profile",

        version:
          "7.2-modular",

        created_at:
          new Date().toISOString(),


        energySituation: {

          monthlyElectricPayment:
            Number(
              el("bill")
                ? el("bill").value
                : 0
            ) || 0,


          assumedBlendedRate:
            Number(
              el("blend")
                ? el("blend").value
                : 0.40
            ) || 0.40,


          utilityRateIncrease:
            Number(
              el("rg")
                ? el("rg").value
                : 0
            ) || 0,


          homeUsageIncrease:
            Number(
              el("ug")
                ? el("ug").value
                : 0
            ) || 0,


          backupNeed:
            el("backup")
              ? el("backup").value
              : "",


          backupDuration:
            el("duration")
              ? el("duration").value
              : "",


          futureNotes:
            el("future")
              ? el("future").value
              : "",


          addedLoads:
            state.loads
        },


        desiredSolutions:
          state.solutions,


        section5: {

          outcomes:
            esOutcomes,

          barriers:
            esBarriers
        },


        section6: {

          resolutions:
            esResolutions,

          finalDirection:
            finalDirection
        }
      };


      var json =
        JSON.stringify(
          profile,
          null,
          2
        );


      var blob =
        new Blob(
          [json],
          {
            type:
              "application/octet-stream"
          }
        );


      var objectUrl =
        URL.createObjectURL(
          blob
        );


      var link =
        document.createElement(
          "a"
        );


      link.href =
        objectUrl;


      link.download =
        "Concern_Profile.swp";


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      setTimeout(
        function () {

          URL.revokeObjectURL(
            objectUrl
          );

        },
        1000
      );
    }


    window.downloadProfile =
      downloadProfile;


    // ========================================================
    // INITIALIZE
    // ========================================================

    calculateEnergySituation();

    renderSection5();

  };

})();
