/*
  ITR SELECTOR
  AY 2026-27

  Preliminary applicability engine for:
  ITR-1
  ITR-2
  ITR-3
  ITR-4

  ITR-5 / ITR-6 / ITR-7 are handled separately
  because they depend on entity/status-specific conditions.
*/


// =====================================================
// HELPERS
// =====================================================

function isTrue(value) {
    return value === true ||
           value === "true" ||
           value === 1 ||
           value === "yes";
}


function positive(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
}


// =====================================================
// SPECIAL CONDITIONS
// =====================================================

function hasBusinessIncome(data) {

    return (
        isTrue(data.hasBusinessIncome) ||
        isTrue(data.hasProfessionalIncome) ||
        positive(data.businessIncome) ||
        positive(data.professionIncome)
    );
}


function hasCapitalGain(data) {

    return (
        isTrue(data.hasCapitalGains) ||
        positive(data.shortTermCapitalGain) ||
        positive(data.longTermCapitalGain)
    );
}


function hasForeignIncomeOrAssets(data) {

    return (
        isTrue(data.hasForeignIncome) ||
        isTrue(data.hasForeignAssets)
    );
}


function hasUnlistedShares(data) {

    return isTrue(
        data.hasUnlistedShares
    );
}


function isDirectorInCompany(data) {

    return isTrue(
        data.isDirectorInCompany
    );
}


function hasIncomeFromMoreThanOneHouse(data) {

    return (
        isTrue(data.moreThanOneHouseProperty) ||
        Number(data.housePropertyCount || 0) > 1
    );
}


function hasSpecialRateIncome(data) {

    return (
        isTrue(data.hasSpecialRateIncome) ||
        positive(data.specialRateIncome)
    );
}


function hasOtherExcludedIncome(data) {

    return (
        isTrue(data.hasLotteryIncome) ||
        isTrue(data.hasGamblingIncome) ||
        isTrue(data.hasRaceHorseIncome) ||
        isTrue(data.hasSpecifiedSpecialIncome)
    );
}


// =====================================================
// ITR-1 CHECK
// =====================================================

function checkITR1(data = {}) {

    const reasons = [];


    /*
      ITR-1 is intended for eligible resident
      individual taxpayers satisfying the prescribed
      conditions.

      This is a preliminary screening layer.
    */


    if (
        data.taxpayerType &&
        data.taxpayerType !== "Individual"
    ) {

        reasons.push(
            "ITR-1 is for eligible individual taxpayers."
        );
    }


    if (
        data.residentialStatus === "NRI"
    ) {

        reasons.push(
            "NRI status requires a different ITR route."
        );
    }


    if (
        data.residentialStatus === "RNOR"
    ) {

        reasons.push(
            "RNOR status requires separate eligibility checks."
        );
    }


    if (
        hasBusinessIncome(data)
    ) {

        reasons.push(
            "Business/profession income is not eligible for ITR-1."
        );
    }


    if (
        hasCapitalGain(data)
    ) {

        reasons.push(
            "Capital gains require a different ITR route."
        );
    }


    if (
        hasForeignIncomeOrAssets(data)
    ) {

        reasons.push(
            "Foreign income/assets require a different ITR route."
        );
    }


    if (
        hasUnlistedShares(data)
    ) {

        reasons.push(
            "Unlisted shares require a different ITR route."
        );
    }


    if (
        isDirectorInCompany(data)
    ) {

        reasons.push(
            "Company directorship requires a different ITR route."
        );
    }


    if (
        hasOtherExcludedIncome(data)
    ) {

        reasons.push(
            "Specified special income is not eligible for ITR-1."
        );
    }


    if (
        hasIncomeFromMoreThanOneHouse(data)
    ) {

        reasons.push(
            "Multiple house-property conditions require additional eligibility checks."
        );
    }


    /*
      Total income limit.
    */

    const totalIncome =
        Number(data.totalIncome || 0);


    if (
        totalIncome > 5000000
    ) {

        reasons.push(
            "Total income exceeds the ITR-1 income threshold."
        );
    }


    return {

        form: "ITR-1",

        eligible:
            reasons.length === 0,

        reasons
    };
}


// =====================================================
// ITR-4 CHECK
// =====================================================

function checkITR4(data = {}) {

    const reasons = [];


    if (
        data.taxpayerType &&
        data.taxpayerType !== "Individual"
    ) {

        reasons.push(
            "ITR-4 is not the general return for companies/firms."
        );
    }


    if (
        data.residentialStatus === "NRI"
    ) {

        reasons.push(
            "NRI status is not eligible for ITR-4."
        );
    }


    if (
        data.residentialStatus === "RNOR"
    ) {

        reasons.push(
            "RNOR status requires separate eligibility checks."
        );
    }


    /*
      ITR-4 is primarily used by eligible
      presumptive taxpayers.
    */

    const method =
        data.businessMethod ||
        data.method ||
        "";


    const presumptive =
        method === "44AD" ||
        method === "44ADA" ||
        method === "44AE";


    if (!presumptive) {

        reasons.push(
            "No eligible presumptive taxation method was selected."
        );
    }


    if (
        hasCapitalGain(data)
    ) {

        reasons.push(
            "Capital gains require separate ITR applicability checks."
        );
    }


    if (
        hasForeignIncomeOrAssets(data)
    ) {

        reasons.push(
            "Foreign income/assets require a different ITR route."
        );
    }


    if (
        hasUnlistedShares(data)
    ) {

        reasons.push(
            "Unlisted shares require a different ITR route."
        );
    }


    if (
        isDirectorInCompany(data)
    ) {

        reasons.push(
            "Company directorship requires a different ITR route."
        );
    }


    const totalIncome =
        Number(data.totalIncome || 0);


    if (
        totalIncome > 5000000
    ) {

        reasons.push(
            "Total income exceeds the ITR-4 income threshold."
        );
    }


    return {

        form: "ITR-4",

        eligible:
            reasons.length === 0,

        reasons
    };
}


// =====================================================
// ITR-3 CHECK
// =====================================================

function checkITR3(data = {}) {

    const reasons = [];


    const business =
        hasBusinessIncome(data);


    if (!business) {

        reasons.push(
            "Business/profession income was not identified."
        );
    }


    /*
      ITR-3 can cover individual/HUF taxpayers
      having business or professional income when
      ITR-4 conditions are not satisfied.
    */


    return {

        form: "ITR-3",

        eligible:
            reasons.length === 0,

        reasons
    };
}


// =====================================================
// ITR-2 CHECK
// =====================================================

function checkITR2(data = {}) {

    const reasons = [];


    if (
        hasBusinessIncome(data)
    ) {

        reasons.push(
            "Business/profession income generally moves the taxpayer to ITR-3/ITR-4."
        );
    }


    /*
      Typical ITR-2 situations include:
      - Capital gains
      - Foreign assets/income
      - Multiple specified income situations
      - Other cases not covered by ITR-1
    */


    const trigger =
        hasCapitalGain(data) ||
        hasForeignIncomeOrAssets(data) ||
        hasUnlistedShares(data) ||
        isDirectorInCompany(data) ||
        data.residentialStatus === "NRI" ||
        data.residentialStatus === "RNOR";


    if (!trigger) {

        reasons.push(
            "No clear ITR-2 trigger was identified."
        );
    }


    return {

        form: "ITR-2",

        eligible:
            reasons.length === 0,

        reasons
    };
}


// =====================================================
// MAIN SELECTOR
// =====================================================

function selectITR(data = {}) {

    /*
      Entity-level forms are separated first.
    */

    const taxpayerType =
        data.taxpayerType ||
        "Individual";


    if (
        taxpayerType === "Company"
    ) {

        return {

            recommendedITR:
                "ITR-6",

            confidence:
                "Preliminary",

            reason:
                "Company taxpayer detected.",

            candidates: [
                "ITR-6"
            ]
        };
    }


    if (
        taxpayerType === "Firm" ||
        taxpayerType === "LLP"
    ) {

        return {

            recommendedITR:
                "ITR-5",

            confidence:
                "Preliminary",

            reason:
                "Firm/LLP taxpayer detected.",

            candidates: [
                "ITR-5"
            ]
        };
    }


    /*
      Trust / institution cases need separate
      ITR-7 eligibility logic.
    */

    if (
        taxpayerType === "Trust" ||
        taxpayerType === "Institution"
    ) {

        return {

            recommendedITR:
                "ITR-7",

            confidence:
                "Preliminary",

            reason:
                "Trust/institution taxpayer detected.",

            candidates: [
                "ITR-7"
            ]
        };
    }


    // =================================================
    // INDIVIDUAL / HUF
    // =================================================

    const itr1 =
        checkITR1(data);


    const itr4 =
        checkITR4(data);


    const itr3 =
        checkITR3(data);


    const itr2 =
        checkITR2(data);


    /*
      Priority:

      1. Business/profession
         -> ITR-4 if eligible
         -> otherwise ITR-3

      2. Capital gains / foreign / special cases
         -> ITR-2

      3. Otherwise
         -> ITR-1
    */


    if (
        hasBusinessIncome(data)
    ) {

        if (
            itr4.eligible
        ) {

            return {

                recommendedITR:
                    "ITR-4",

                confidence:
                    "Preliminary",

                reason:
                    "Eligible presumptive business/profession case detected.",

                candidates: [
                    "ITR-4",
                    "ITR-3"
                ],

                checks: {
                    itr4,
                    itr3
                }
            };
        }


        return {

            recommendedITR:
                "ITR-3",

            confidence:
                "Preliminary",

            reason:
                "Business/profession income detected but ITR-4 conditions were not satisfied.",

            candidates: [
                "ITR-3"
            ],

            checks: {
                itr3,
                itr4
            }
        };
    }


    if (
        hasCapitalGain(data) ||
        hasForeignIncomeOrAssets(data) ||
        hasUnlistedShares(data) ||
        isDirectorInCompany(data) ||
        data.residentialStatus === "NRI" ||
        data.residentialStatus === "RNOR"
    ) {

        return {

            recommendedITR:
                "ITR-2",

            confidence:
                "Preliminary",

            reason:
                "Capital gains/foreign/special eligibility condition detected.",

            candidates: [
                "ITR-2"
            ],

            checks: {
                itr2,
                itr1
            }
        };
    }


    if (
        itr1.eligible
    ) {

        return {

            recommendedITR:
                "ITR-1",

            confidence:
                "Preliminary",

            reason:
                "Basic ITR-1 eligibility conditions appear satisfied.",

            candidates: [
                "ITR-1"
            ],

            checks: {
                itr1
            }
        };
    }


    return {

        recommendedITR:
            "MANUAL_REVIEW",

        confidence:
            "Low",

        reason:
            "The supplied information does not clearly establish an ITR form.",

        candidates: [
            "ITR-1",
            "ITR-2",
            "ITR-3",
            "ITR-4"
        ],

        checks: {
            itr1,
            itr2,
            itr3,
            itr4
        }
    };
}


// =====================================================
// EXPLAIN RESULT
// =====================================================

function explainITRSelection(result) {

    if (
        result.recommendedITR ===
        "MANUAL_REVIEW"
    ) {

        return (
            "ITR applicability needs manual review " +
            "because the supplied information is incomplete " +
            "or contains a special condition."
        );
    }


    return (
        "Preliminary applicable ITR: " +
        result.recommendedITR +
        ". Final applicability should be validated " +
        "against the current official ITR utility."
    );
}


// =====================================================
// EXPORT
// =====================================================

if (
    typeof module !== "undefined" &&
    module.exports
) {

    module.exports = {

        checkITR1,

        checkITR2,

        checkITR3,

        checkITR4,

        selectITR,

        explainITRSelection
    };
}
