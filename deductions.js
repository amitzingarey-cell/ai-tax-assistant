/*
  DEDUCTIONS ENGINE
  AY 2026-27

  Purpose:
  Calculate eligible deductions under:
  - Old Tax Regime
  - New Tax Regime

  IMPORTANT:
  This module calculates eligibility/limits.
  Final ITR validation must be performed against
  the applicable Income Tax Department utility.
*/


// =====================================================
// HELPERS
// =====================================================

function dNum(value) {

    const n = Number(value);

    if (!Number.isFinite(n) || n < 0) {
        return 0;
    }

    return n;
}


function dRound(value) {
    return Math.round(dNum(value));
}


function min(value, limit) {
    return Math.min(
        dNum(value),
        dNum(limit)
    );
}


// =====================================================
// SECTION 80C / 80CCC / 80CCD(1)
// =====================================================

function calculate80CGroup(data) {

    const section80C =
        dNum(data.section80C);

    const section80CCC =
        dNum(data.section80CCC);

    const section80CCD1 =
        dNum(data.section80CCD1);


    /*
      Combined maximum limit:
      ₹1,50,000
    */

    const totalClaim =
        section80C +
        section80CCC +
        section80CCD1;


    const eligible =
        Math.min(
            totalClaim,
            150000
        );


    return {

        section80C:
            dRound(
                Math.min(
                    section80C,
                    150000
                )
            ),

        section80CCC:
            dRound(
                section80CCC
            ),

        section80CCD1:
            dRound(
                section80CCD1
            ),

        combinedClaim:
            dRound(totalClaim),

        eligible:
            dRound(eligible),

        limit:
            150000
    };
}


// =====================================================
// SECTION 80CCD(1B)
// =====================================================

function calculate80CCD1B(data) {

    const contribution =
        dNum(
            data.section80CCD1B
        );


    return {

        claimed:
            dRound(contribution),

        eligible:
            dRound(
                min(
                    contribution,
                    50000
                )
            ),

        limit:
            50000
    };
}


// =====================================================
// SECTION 80CCD(2)
// Employer NPS contribution
// =====================================================

function calculate80CCD2(data) {

    const employerContribution =
        dNum(
            data.section80CCD2
        );


    const basicSalary =
        dNum(
            data.basicSalary
        );


    const dearnessAllowance =
        dNum(
            data.dearnessAllowance
        );


    /*
      Salary for this purpose:
      Basic + eligible DA
    */

    const salary =
        basicSalary +
        dearnessAllowance;


    const employerType =
        data.employerType ||
        "Other";


    let allowedPercentage;


    /*
      Current AY 2026-27 framework:
      Central/State Government:
      14%

      Other employers:
      Old regime:
      10%

      New regime:
      14%
    */

    if (
        data.regime === "New"
    ) {

        allowedPercentage =
            0.14;

    }

    else {

        allowedPercentage =
            employerType ===
            "Central Government" ||
            employerType ===
            "State Government"
                ? 0.14
                : 0.10;
    }


    const maximumAllowed =
        salary *
        allowedPercentage;


    return {

        employerContribution:
            dRound(
                employerContribution
            ),

        salary:
            dRound(salary),

        allowedPercentage,

        maximumAllowed:
            dRound(maximumAllowed),

        eligible:
            dRound(
                Math.min(
                    employerContribution,
                    maximumAllowed
                )
            )
    };
}


// =====================================================
// SECTION 80D
// Health Insurance
// =====================================================

function calculate80D(data) {

    const selfInsurance =
        dNum(
            data.healthInsuranceSelf
        );


    const parentInsurance =
        dNum(
            data.healthInsuranceParents
        );


    const selfSenior =
        Boolean(
            data.selfSeniorCitizen
        );


    const parentSenior =
        Boolean(
            data.parentSeniorCitizen
        );


    /*
      Self/family:
      ₹25,000 normally
      ₹50,000 if senior citizen

      Parents:
      ₹25,000 normally
      ₹50,000 if senior citizen
    */

    const selfLimit =
        selfSenior
            ? 50000
            : 25000;


    const parentLimit =
        parentSenior
            ? 50000
            : 25000;


    const eligibleSelf =
        Math.min(
            selfInsurance,
            selfLimit
        );


    const eligibleParents =
        Math.min(
            parentInsurance,
            parentLimit
        );


    return {

        selfClaim:
            dRound(selfInsurance),

        parentClaim:
            dRound(parentInsurance),

        selfLimit,

        parentLimit,

        eligibleSelf:
            dRound(eligibleSelf),

        eligibleParents:
            dRound(eligibleParents),

        eligible:
            dRound(
                eligibleSelf +
                eligibleParents
            )
    };
}


// =====================================================
// SECTION 80DD
// Dependent with disability
// =====================================================

function calculate80DD(data) {

    const amount =
        dNum(
            data.section80DD
        );


    /*
      The actual deduction depends on
      prescribed disability conditions.

      We therefore don't blindly allow
      the entered amount.
    */

    const disability =
        data.disabilityPercentage ||
        0;


    let eligibleLimit = 0;


    if (
        disability >= 80
    ) {

        eligibleLimit =
            125000;

    }

    else if (
        disability >= 40
    ) {

        eligibleLimit =
            75000;
    }


    return {

        claimed:
            dRound(amount),

        disabilityPercentage:
            disability,

        eligible:
            dRound(
                Math.min(
                    amount,
                    eligibleLimit
                )
            ),

        limit:
            eligibleLimit
    };
}


// =====================================================
// SECTION 80DDB
// Medical treatment
// =====================================================

function calculate80DDB(data) {

    const amount =
        dNum(
            data.section80DDB
        );


    const senior =
        Boolean(
            data.patientSeniorCitizen
        );


    /*
      Maximum depends on applicable
      medical treatment and patient status.
    */

    const limit =
        senior
            ? 100000
            : 40000;


    return {

        claimed:
            dRound(amount),

        eligible:
            dRound(
                Math.min(
                    amount,
                    limit
                )
            ),

        limit
    };
}


// =====================================================
// SECTION 80E
// Education loan interest
// =====================================================

function calculate80E(data) {

    const interest =
        dNum(
            data.section80E
        );


    /*
      Deduction is generally the eligible
      interest amount, subject to conditions.
      Maximum period is handled separately
      in validation.
    */

    return {

        claimed:
            dRound(interest),

        eligible:
            dRound(interest)
    };
}


// =====================================================
// SECTION 80EE
// First home buyer
// =====================================================

function calculate80EE(data) {

    const amount =
        dNum(
            data.section80EE
        );


    return {

        claimed:
            dRound(amount),

        eligible:
            dRound(
                Math.min(
                    amount,
                    50000
                )
            ),

        limit:
            50000
    };
}


// =====================================================
// SECTION 80EEA
// Affordable housing
// =====================================================

function calculate80EEA(data) {

    const amount =
        dNum(
            data.section80EEA
        );


    return {

        claimed:
            dRound(amount),

        eligible:
            dRound(
                Math.min(
                    amount,
                    150000
                )
            ),

        limit:
            150000
    };
}


// =====================================================
// SECTION 80EEB
// Electric vehicle loan interest
// =====================================================

function calculate80EEB(data) {

    const amount =
        dNum(
            data.section80EEB
        );


    return {

        claimed:
            dRound(amount),

        eligible:
            dRound(
                Math.min(
                    amount,
                    150000
                )
            ),

        limit:
            150000
    };
}


// =====================================================
// SECTION 80G
// Donations
// =====================================================

function calculate80G(data) {

    const eligibleDonation =
        dNum(
            data.section80GEligible
        );


    const qualifyingLimit =
        dNum(
            data.section80GQualifyingLimit
        );


    const donationType =
        data.section80GType ||
        "50%";


    let percentage = 0.50;


    if (
        donationType === "100%"
    ) {

        percentage = 1;

    }


    /*
      Some donations are subject to
      qualifying-limit rules.
    */

    let base =
        eligibleDonation;


    if (
        qualifyingLimit > 0
    ) {

        base =
            Math.min(
                eligibleDonation,
                qualifyingLimit
            );
    }


    const eligible =
        base *
        percentage;


    return {

        claimed:
            dRound(
                eligibleDonation
            ),

        percentage,

        qualifyingLimit:
            dRound(
                qualifyingLimit
            ),

        eligible:
            dRound(eligible)
    };
}


// =====================================================
// SECTION 80GG
// Rent paid
// =====================================================

function calculate80GG(data) {

    const rentPaid =
        dNum(
            data.rentPaid
        );


    const totalIncome =
        dNum(
            data.totalIncomeBefore80GG
        );


    const monthlyLimit =
        5000;


    const annualRentLimit =
        monthlyLimit * 12;


    /*
      80GG calculation:

      Least of:
      1. Rent paid - 10% of total income
      2. ₹5,000 per month
      3. 25% of total income
    */

    const option1 =
        Math.max(
            0,
            rentPaid -
            (0.10 * totalIncome)
        );


    const option2 =
        annualRentLimit;


    const option3 =
        0.25 *
        totalIncome;


    const eligible =
        Math.max(
            0,
            Math.min(
                option1,
                option2,
                option3
            )
        );


    return {

        rentPaid:
            dRound(rentPaid),

        option1:
            dRound(option1),

        option2:
            dRound(option2),

        option3:
            dRound(option3),

        eligible:
            dRound(eligible)
    };
}


// =====================================================
// SECTION 80TTA
// Savings bank interest
// =====================================================

function calculate80TTA(data) {

    const interest =
        dNum(
            data.savingsInterest
        );


    const limit =
        10000;


    return {

        interest:
            dRound(interest),

        eligible:
            dRound(
                Math.min(
                    interest,
                    limit
                )
            ),

        limit
    };
}


// =====================================================
// SECTION 80TTB
// Senior citizen interest
// =====================================================

function calculate80TTB(data) {

    const interest =
        dNum(
            data.section80TTB
        );


    const limit =
        50000;


    return {

        interest:
            dRound(interest),

        eligible:
            dRound(
                Math.min(
                    interest,
                    limit
                )
            ),

        limit
    };
}


// =====================================================
// SECTION 80U
// Disability of taxpayer
// =====================================================

function calculate80U(data) {

    const disability =
        dNum(
            data.disabilityPercentage
        );


    const limit =
        disability >= 80
            ? 125000
            : disability >= 40
                ? 75000
                : 0;


    return {

        disabilityPercentage:
            disability,

        eligible:
            limit
    };
}


// =====================================================
// SECTION 80CCH
// Agniveer Corpus Fund
// =====================================================

function calculate80CCH(data) {

    const amount =
        dNum(
            data.section80CCH
        );


    return {

        claimed:
            dRound(amount),

        eligible:
            dRound(amount)
    };
}


// =====================================================
// OLD REGIME TOTAL
// =====================================================

function calculateOldRegimeDeductions(data = {}) {

    const group80C =
        calculate80CGroup(data);


    const ccd1b =
        calculate80CCD1B(data);


    const ccd2 =
        calculate80CCD2({
            ...data,
            regime: "Old"
        });


    const d80 =
        calculate80D(data);


    const dd =
        calculate80DD(data);


    const dddb =
        calculate80DDB(data);


    const e =
        calculate80E(data);


    const ee =
        calculate80EE(data);


    const eea =
        calculate80EEA(data);


    const eeb =
        calculate80EEB(data);


    const g =
        calculate80G(data);


    const gg =
        calculate80GG(data);


    const tta =
        calculate80TTA(data);


    const ttb =
        calculate80TTB(data);


    const u =
        calculate80U(data);


    const cch =
        calculate80CCH(data);


    const total =

        group80C.eligible +

        ccd1b.eligible +

        ccd2.eligible +

        d80.eligible +

        dd.eligible +

        dddb.eligible +

        e.eligible +

        ee.eligible +

        eea.eligible +

        eeb.eligible +

        g.eligible +

        gg.eligible +

        tta.eligible +

        ttb.eligible +

        u.eligible +

        cch.eligible;


    return {

        section80CGroup:
            group80C,

        section80CCD1B:
            ccd1b,

        section80CCD2:
            ccd2,

        section80D:
            d80,

        section80DD:
            dd,

        section80DDB:
            dddb,

        section80E:
            e,

        section80EE:
            ee,

        section80EEA:
            eea,

        section80EEB:
            eeb,

        section80G:
            g,

        section80GG:
            gg,

        section80TTA:
            tta,

        section80TTB:
            ttb,

        section80U:
            u,

        section80CCH:
            cch,

        total:
            dRound(total)
    };
}


// =====================================================
// NEW REGIME TOTAL
// =====================================================

function calculateNewRegimeDeductions(data = {}) {

    /*
      For AY 2026-27, most of the normal
      Chapter VI-A deductions are not available
      under the new regime.

      80CCD(2) and 80CCH are among the
      important exceptions.

      New-regime 80CCD(2) is calculated here.
    */

    const ccd2 =
        calculate80CCD2({
            ...data,
            regime: "New"
        });


    const cch =
        calculate80CCH(data);


    const total =

        ccd2.eligible +
        cch.eligible;


    return {

        section80CCD2:
            ccd2,

        section80CCH:
            cch,

        total:
            dRound(total)
    };
}


// =====================================================
// COMPARISON
// =====================================================

function compareDeductionRegimes(data = {}) {

    const oldRegime =
        calculateOldRegimeDeductions(
            data
        );


    const newRegime =
        calculateNewRegimeDeductions(
            data
        );


    return {

        oldRegime,

        newRegime,

        difference:
            dRound(
                oldRegime.total -
                newRegime.total
            )
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

        calculate80CGroup,

        calculate80CCD1B,

        calculate80CCD2,

        calculate80D,

        calculate80DD,

        calculate80DDB,

        calculate80E,

        calculate80EE,

        calculate80EEA,

        calculate80EEB,

        calculate80G,

        calculate80GG,

        calculate80TTA,

        calculate80TTB,

        calculate80U,

        calculate80CCH,

        calculateOldRegimeDeductions,

        calculateNewRegimeDeductions,

        compareDeductionRegimes
    };
}
