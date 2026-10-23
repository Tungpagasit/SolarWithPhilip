window.SWP = window.SWP || {};

(() => {

  SWP.loadProposal = async () => {

    const app =
      document.querySelector(
        '#proposal-app'
      );

    if (!app) {
      throw new Error(
        'Proposal app container was not found.'
      );
    }


    /*
     * Load the component manifest.
     */
    const manifestResponse =
      await fetch(
        'proposal/manifest.json'
      );

    if (!manifestResponse.ok) {
      throw new Error(
        `Proposal manifest could not load (${manifestResponse.status}).`
      );
    }

    const manifest =
      await manifestResponse.json();

    if (
      !Array.isArray(
        manifest.components
      )
    ) {
      throw new Error(
        'Proposal manifest does not contain a valid component list.'
      );
    }


    /*
     * Remove the temporary loading message.
     */
    app.innerHTML = '';


    /*
     * Load every component in manifest order.
     */
    for (
      const componentName
      of manifest.components
    ) {

      try {

        const base =
          `proposal/components/${componentName}/component`;


        /*
         * ==================================================
         * HTML
         * ==================================================
         */

        const htmlResponse =
          await fetch(
            `${base}.html`
          );

        if (!htmlResponse.ok) {
          throw new Error(
            `HTML returned ${htmlResponse.status}`
          );
        }

        const html =
          await htmlResponse.text();


        /*
         * Create a dedicated section
         * for this component.
         */
        const componentRoot =
          document.createElement(
            'section'
          );

        componentRoot.className =
          'component-section';

        componentRoot.dataset.component =
          componentName;

        componentRoot.innerHTML =
          `
            <div class="wrap">
              ${html}
            </div>
          `;

        app.appendChild(
          componentRoot
        );


        /*
         * ==================================================
         * CSS
         * ==================================================
         */

        const cssUrl =
          `${base}.css`;

        /*
         * Prevent accidental duplicate
         * stylesheet insertion.
         */
        if (
          !document.querySelector(
            `link[data-proposal-css="${componentName}"]`
          )
        ) {

          const css =
            document.createElement(
              'link'
            );

          css.rel =
            'stylesheet';

          css.href =
            cssUrl;

          css.dataset.proposalCss =
            componentName;

          document.head.appendChild(
            css
          );
        }


        /*
         * ==================================================
         * JAVASCRIPT
         * ==================================================
         *
         * Each component gets its OWN execution scope.
         *
         * This prevents top-level const / let variables in
         * one component from colliding with another.
         * ==================================================
         */

        const jsResponse =
          await fetch(
            `${base}.js`
          );

        /*
         * component.js may intentionally
         * be empty, but a missing file is
         * treated as an error so the package
         * remains auditable.
         */
        if (!jsResponse.ok) {
          throw new Error(
            `JavaScript returned ${jsResponse.status}`
          );
        }

        const componentJs =
          await jsResponse.text();


        if (
          componentJs.trim()
        ) {

          /*
           * IMPORTANT:
           *
           * A new function is created for
           * EACH individual component.
           *
           * The additional block creates
           * another lexical boundary for
           * const and let declarations.
           */

          const runComponent =
            new Function(
              'root',
              'SWP',
              `
                "use strict";

                {
                  ${componentJs}
                }
              `
            );


          /*
           * Execute ONLY this component
           * against its own DOM root.
           */
          runComponent(
            componentRoot,
            SWP
          );

        }


      } catch (error) {

        /*
         * ==================================================
         * COMPONENT-SPECIFIC DIAGNOSTICS
         * ==================================================
         *
         * Do not allow a vague error such as:
         *
         * "Assignment to constant variable"
         *
         * without identifying WHICH component
         * caused it.
         * ==================================================
         */

        console.error(
          `Proposal component failed: ${componentName}`,
          error
        );


        const errorCard =
          document.createElement(
            'div'
          );

        errorCard.className =
          'component-card';

        errorCard.style.border =
          '2px solid #b74b4b';

        errorCard.style.background =
          '#fff6f6';

        errorCard.innerHTML =
          `
            <strong>
              ${componentName} could not load.
            </strong>

            <p>
              ${String(
                error.message ||
                error
              )}
            </p>
          `;

        app.appendChild(
          errorCard
        );


        /*
         * Stop here.
         *
         * This prevents later components
         * from hiding the location of the
         * original problem.
         */
        throw new Error(
          `${componentName}: ${
            error.message ||
            error
          }`
        );

      }

    }


    return true;

  };


  /*
   * ========================================================
   * GLOBAL PHILIP-ONLY ACTION
   * ========================================================
   */

  SWP.bindGlobalActions =
    () => {

      const trigger =
        document.querySelector(
          '#solution-simplified'
        );

      if (!trigger) {
        return;
      }


      trigger.addEventListener(
        'click',
        async () => {

          /*
           * Ordinary homeowners cannot
           * activate this area.
           */
          if (
            !new URLSearchParams(
              location.search
            ).has('philip')
          ) {
            return;
          }


          if (
            !SWP.data
              .decisionProfile
          ) {

            alert(
              'Load the Decision_Profile first.'
            );

            return;
          }


          const secret =
            prompt(
              'Philip access code'
            );

          if (!secret) {
            return;
          }


          try {

            const response =
              await fetch(
                '/.netlify/functions/solution-simplified',
                {
                  method:
                    'POST',

                  headers: {
                    'content-type':
                      'application/json',

                    'x-philip-secret':
                      secret
                  },

                  body:
                    JSON.stringify(
                      SWP.fullProfile()
                    )
                }
              );


            const contentType =
              response.headers.get(
                'content-type'
              ) || '';


            if (
              !contentType.includes(
                'application/json'
              )
            ) {

              throw new Error(
                `Solution Simplified returned ${response.status} instead of JSON.`
              );

            }


            const result =
              await response.json();


            if (!response.ok) {

              throw new Error(
                result.error ||
                'Could not create the consultation brief.'
              );

            }


            alert(
              `Solution Simplified brief created and saved. Reference: ${result.id}`
            );


          } catch (error) {

            console.error(
              'Solution Simplified:',
              error
            );

            alert(
              error.message
            );

          }

        }
      );

    };

})();
