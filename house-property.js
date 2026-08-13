/*
  HOUSE PROPERTY ENGINE
  AY 2026-27

  Handles:
  - Self-occupied property
  - Let-out property
  - Deemed let-out property
  - Rent received
  - Municipal taxes
  - 30% standard deduction
  - Section 24(b) interest
  - House-property profit/loss
  - Multiple properties
*/

function hpNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function hpRound(value) {
    return Math.round(hpNum(value));
}


// =====================================================
// SINGLE HOUSE PROPERTY
// =====================================================

function calculateHouseProperty(data = {}) {

    const type =
        data.propertyType || "SELF_OCCUPIED";

    const rentReceived =
        Math.max(0, hpNum(data.rentReceived));

    const municipalTax =
        Math.max(0, hpNum(data.municipalTax));

    const interest =
        Math.max(0, hpNum(data.homeLoanInterest));

    const vacancyLoss =
        Math.max(0, hpNum(data.vacancyLoss));


    // -----------------------------------------------
    // SELF OCCUPIED
    // -----------------------------------------------

    if (type === "SELF_OCCUPIED") {

        /*
          For self-occupied property, annual value
          is generally taken as NIL, subject to
          applicable conditions.

          Interest calculation is kept separately.
        */

        const annualValue = 0;

        const netAnnualValue = 0;

        const standardDeduction = 0;

        let allowedInterest = interest;

        /*
          Section 24(b) limit for qualifying
          self-occupied home-loan cases:
          generally ₹2,00,000.

          Certain cases may have a lower limit,
          so this will be refined through validation.
        */

        if (data.regime === "New") {

            /*
              New regime has different treatment
              for self-occupied house-property interest.
            */

            allowedInterest = 0;

        } else {

            allowedInterest =
                Math.min(
                    interest,
                    200000
                );
        }


        const income =
            -allowedInterest;


        return {

            propertyType:
                "SELF_OCCUPIED",

            annualValue,

            municipalTax: 0,

            netAnnualValue,

            standardDeduction,

            interest,

            allowedInterest,

            income:
                hpRound(income),

            loss:
                income < 0
                    ? hpRound(
                        Math.abs(income)
                    )
                    : 0
        };
    }


    // =================================================
    // LET OUT / DEEMED LET OUT
    // =================================================

    const grossAnnualValue =
        Math.max(
            0,
            rentReceived -
            vacancyLoss
        );


    const netAnnualValue =
        Math.max(
            0,
            grossAnnualValue -
            municipalTax
        );


    /*
      Section 24(a):
      30% of Net Annual Value.
    */

    const standardDeduction =
        netAnnualValue * 0.30;


    /*
      Section 24(b).

      We keep the actual interest here.
      Regime-specific restrictions are handled
      separately.
    */

    let allowedInterest =
        interest;


    /*
      New regime restriction for house-property
      loss against other heads.

      The property computation itself still shows
      the property income/loss; the set-off engine
      will control inter-head adjustment.
    */


    const income =
        netAnnualValue -
        standardDeduction -
        allowedInterest;


    return {

        propertyType:
            type,

        grossAnnualValue:
            hpRound(
                grossAnnualValue
            ),

        rentReceived:
            hpRound(
                rentReceived
            ),

        vacancyLoss:
            hpRound(
                vacancyLoss
            ),

        municipalTax:
            hpRound(
                municipalTax
            ),

        netAnnualValue:
            hpRound(
                netAnnualValue
            ),

        standardDeduction:
            hpRound(
                standardDeduction
            ),

        interest:
            hpRound(
                interest
            ),

        allowedInterest:
            hpRound(
                allowedInterest
            ),

        income:
            hpRound(
                income
            ),

        loss:
            income < 0
                ? hpRound(
                    Math.abs(income)
                )
                : 0
    };
}


// =====================================================
// MULTIPLE PROPERTIES
// =====================================================

function calculateHouseProperties(
    properties = [],
    regime = "Old"
) {

    const results = [];

    let totalIncome = 0;

    let totalLoss = 0;


    for (
        const property
        of properties
    ) {

        const result =
            calculateHouseProperty({
                ...property,
                regime
            });


        results.push(result);


        if (result.income >= 0) {

            totalIncome +=
                result.income;

        } else {

            totalLoss +=
                Math.abs(
                    result.income
                );
        }
    }


    /*
      Overall house-property income.
    */

    const netHousePropertyIncome =
        totalIncome -
        totalLoss;


    return {

        properties:
            results,

        totalPositiveIncome:
            hpRound(totalIncome),

        totalLoss:
            hpRound(totalLoss),

        netIncome:
            hpRound(
                netHousePropertyIncome
            )
    };
}


// =====================================================
// HOUSE PROPERTY LOSS SET-OFF
// =====================================================

function calculateHousePropertySetOff(
    housePropertyIncome,
    otherIncome,
    regime = "Old"
) {

    const hpIncome =
        hpNum(housePropertyIncome);

    const other =
        hpNum(otherIncome);


    /*
      If there is no loss, there is nothing
      to set off.
    */

    if (hpIncome >= 0) {

        return {

            housePropertyIncome:
                hpRound(hpIncome),

            housePropertyLossSetOff: 0,

            remainingHousePropertyLoss: 0,

            taxableOtherIncome:
                hpRound(other)
        };
    }


    const loss =
        Math.abs(hpIncome);


    /*
      Old regime:
      Inter-head set-off is subject to the
      applicable statutory limit.

      We use ₹2,00,000 as the maximum
      inter-head set-off in this engine.
    */

    let allowedSetOff = 0;


    if (regime === "Old") {

        allowedSetOff =
            Math.min(
                loss,
                200000,
                other
            );

    } else {

        /*
          Under the new regime, house-property
          loss cannot generally be set off
          against other heads.

          It remains restricted to the
          house-property computation.
        */

        allowedSetOff = 0;
    }


    const remainingLoss =
        Math.max(
            0,
            loss -
            allowedSetOff
        );


    const taxableOtherIncome =
        Math.max(
            0,
            other -
            allowedSetOff
        );


    return {

        housePropertyIncome:
            hpRound(hpIncome),

        housePropertyLossSetOff:
            hpRound(allowedSetOff),

        remainingHousePropertyLoss:
            hpRound(remainingLoss),

        taxableOtherIncome:
            hpRound(taxableOtherIncome)
    };
}


// =====================================================
// PROPERTY SUMMARY
// =====================================================

function getHousePropertySummary(
    properties = [],
    regime = "Old"
) {

    const calculation =
        calculateHouseProperties(
            properties,
            regime
        );


    return {

        ...calculation,

        regime,

        message:
            calculation.netIncome >= 0
                ? "House property income calculated."
                : "House property loss calculated."
    };
}


// =====================================================
// EXPORT
// =====================================================

if (
    typeof module !== "undefined" &&
    module.exports
) {

    module.exports = {

        calculateHouseProperty,

        calculateHouseProperties,

        calculateHousePropertySetOff,

        getHousePropertySummary
    };
}
