/*
  ============================================================
  TAX ENGINE
  AY 2026-27
  Advanced Preliminary Computation Engine

  Includes:
  - Old Regime
  - New Regime
  - Salary
  - Other Income
  - Business / Profession
  - STCG
  - LTCG
  - Section 111A STCG
  - Section 112A LTCG
  - Other LTCG
  - 87A rebate
  - 87A marginal relief
  - Surcharge
  - Capital-gain surcharge cap
  - Surcharge marginal relief
  - 4% Health & Education Cess

  IMPORTANT:
  This is an estimation engine.
  It is NOT the official Income Tax Department utility.
  Final filing should be verified against the applicable
  ITR form, schedules and current Income Tax Department rules.
*/


// ============================================================
// BASIC HELPERS
// ============================================================

function num(value) {

    const n = Number(value);

    return Number.isFinite(n) && n > 0
        ? n
        : 0;
}


function round(value) {

    return Math.round(
        Number.isFinite(Number(value))
            ? Number(value)
            : 0
    );
}


function max0(value) {

    return Math.max(
        0,
        num(value)
    );
}


// ============================================================
// CAPITAL GAINS INPUT NORMALIZER
// ============================================================

function getCapitalGains(data) {

    /*
      The UI may use different field names.

      This function supports several possible names
      so the engine remains compatible with the existing UI.
    */

    const stcg111A =
        num(data.stcg111A) ||
        num(data.stcgEquity) ||
        num(data.stcgListed) ||
        0;


    const stcgOther =
        num(data.stcgOther) ||
        num(data.otherSTCG) ||
        0;


    const ltcg112A =
        num(data.ltcg112A) ||
        num(data.ltcgEquity) ||
        num(data.ltcgListed) ||
        0;


    const ltcgOther =
        num(data.ltcgOther) ||
        num(data.otherLTCG) ||
        0;


    /*
      If the UI only sends generic STCG/LTCG,
      use them as fallback.
    */

    const genericSTCG =
        num(data.stcg);


    const genericLTCG =
        num(data.ltcg);


    const finalSTCG111A =
        stcg111A > 0
            ? stcg111A
            : (
                stcgOther === 0
                    ? genericSTCG
                    : 0
            );


    const finalLTCG112A =
        ltcg112A > 0
            ? ltcg112A
            : (
                ltcgOther === 0
                    ? genericLTCG
                    : 0
            );


    return {

        stcg111A:
            finalSTCG111A,

        stcgOther,

        ltcg112A:
            finalLTCG112A,

        ltcgOther,

        totalSTCG:
            finalSTCG111A +
            stcgOther,

        totalLTCG:
            finalLTCG112A +
            ltcgOther,

        totalCapitalGains:
            finalSTCG111A +
            stcgOther +
            finalLTCG112A +
            ltcgOther
    };
}


// ============================================================
// OLD REGIME NORMAL SLABS
// ============================================================

function calculateOldRegimeSlabTax(
    taxableIncome,
    age = 0
) {

    const income =
        max0(taxableIncome);

    const taxpayerAge =
        num(age);

    let tax = 0;


    // Below 60

    if (taxpayerAge < 60) {

        if (income <= 250000) {

            tax = 0;

        }

        else if (income <= 500000) {

            tax =
                (income - 250000) *
                0.05;

        }

        else if (income <= 1000000) {

            tax =
                12500 +
                (income - 500000) *
                0.20;

        }

        else {

            tax =
                112500 +
                (income - 1000000) *
                0.30;
        }
    }


    // 60 to below 80

    else if (taxpayerAge < 80) {

        if (income <= 300000) {

            tax = 0;

        }

        else if (income <= 500000) {

            tax =
                (income - 300000) *
                0.05;

        }

        else if (income <= 1000000) {

            tax =
                10000 +
                (income - 500000) *
                0.20;

        }

        else {

            tax =
                110000 +
                (income - 1000000) *
                0.30;
        }
    }


    // 80+

    else {

        if (income <= 500000) {

            tax = 0;

        }

        else if (income <= 1000000) {

            tax =
                (income - 500000) *
                0.20;

        }

        else {

            tax =
                100000 +
                (income - 1000000) *
                0.30;
        }
    }


    return round(tax);
}


// ============================================================
// NEW REGIME NORMAL SLABS - AY 2026-27
// ============================================================

function calculateNewRegimeSlabTax(
    taxableIncome
) {

    const income =
        max0(taxableIncome);

    let tax = 0;


    if (income <= 400000) {

        tax = 0;
    }

    else if (income <= 800000) {

        tax =
            (income - 400000) *
            0.05;
    }

    else if (income <= 1200000) {

        tax =
            20000 +
            (income - 800000) *
            0.10;
    }

    else if (income <= 1600000) {

        tax =
            60000 +
            (income - 1200000) *
            0.15;
    }

    else if (income <= 2000000) {

        tax =
            120000 +
            (income - 1600000) *
            0.20;
    }

    else if (income <= 2400000) {

        tax =
            200000 +
            (income - 2000000) *
            0.25;
    }

    else {

        tax =
            300000 +
            (income - 2400000) *
            0.30;
    }


    return round(tax);
}


// ============================================================
// CAPITAL GAINS TAX
// ============================================================

function calculateCapitalGainsTax(
    capitalGains
) {

    const cg =
        capitalGains || {};


    /*
      Section 111A
      STCG on specified equity / units

      AY 2026-27:
      20%
    */

    const stcg111ATax =
        round(
            num(cg.stcg111A) *
            0.20
        );


    /*
      Other STCG

      This is kept at normal slab rate
      in this engine unless the UI later
      identifies another special-rate section.
    */

    const stcgOther =
        num(cg.stcgOther);


    /*
      Section 112A

      LTCG on specified equity-oriented
      shares / units.

      First ₹1,25,000 is covered by the
      threshold and balance is taxed at 12.5%.
    */

    const ltcg112A =
        num(cg.ltcg112A);


    const ltcg112ATaxable =
        Math.max(
            0,
            ltcg112A - 125000
        );


    const ltcg112ATax =
        round(
            ltcg112ATaxable *
            0.125
        );


    /*
      Other LTCG under section 112.

      General preliminary treatment:
      12.5%

      Specific assets may have different
      rules, exemptions or grandfathering.
    */

    const ltcgOther =
        num(cg.ltcgOther);


    const ltcgOtherTax =
        round(
            ltcgOther *
            0.125
        );


    return {

        stcg111A:
            num(cg.stcg111A),

        stcg111ATax,

        stcgOther,

        ltcg112A,

        ltcg112AExemption:
            Math.min(
                ltcg112A,
                125000
            ),

        ltcg112ATaxable,

        ltcg112ATax,

        ltcgOther,

        ltcgOtherTax,

        specialRateTax:

            stcg111ATax +
            ltcg112ATax +
            ltcgOtherTax
    };
}


// ============================================================
// OLD REGIME DEDUCTIONS
// ============================================================

function calculateOldRegimeDeductions(
    data
) {

    const incomeType =
        data.incomeType ||
        "";


    const standardDeduction =
        incomeType === "Salary"
            ? 50000
            : 0;


    const section80C =
        Math.min(
            num(data.investment80C),
            150000
        );


    const age =
        num(data.age);


    const section80DLimit =
        age >= 60
            ? 50000
            : 25000;


    const section80D =
        Math.min(
            num(data.healthInsurance),
            section80DLimit
        );


    const section80CCD1B =
        Math.min(
            num(data.nps),
            50000
        );


    const homeLoanInterest =
        Math.min(
            num(data.homeLoanInterest),
            200000
        );


    const total =
        standardDeduction +
        section80C +
        section80D +
        section80CCD1B +
        homeLoanInterest;


    return {

        standardDeduction,

        section80C,

        section80D,

        section80CCD1B,

        homeLoanInterest,

        total:
            round(total)
    };
}


// ============================================================
// NEW REGIME DEDUCTIONS
// ============================================================

function calculateNewRegimeDeductions(
    data
) {

    const standardDeduction =
        data.incomeType === "Salary"
            ? 75000
            : 0;


    return {

        standardDeduction,

        total:
            round(
                standardDeduction
            )
    };
}


// ============================================================
// SURCHARGE RATE
// ============================================================

function getNormalSurchargeRate(
    totalIncome,
    regime
) {

    const income =
        num(totalIncome);


    if (income <= 5000000) {

        return 0;
    }


    if (income <= 10000000) {

        return 0.10;
    }


    if (income <= 20000000) {

        return 0.15;
    }


    /*
      New regime:
      maximum general surcharge = 25%

      Old regime:
      above ₹5 crore = 37%
    */

    if (income <= 50000000) {

        return 0.25;
    }


    return regime === "Old Regime"
        ? 0.37
        : 0.25;
}


// ============================================================
// SURCHARGE CALCULATION
// ============================================================

function calculateSurcharge(
    totalIncome,
    normalTax,
    specialRateTax = 0,
    regime = "New Regime"
) {

    const income =
        num(totalIncome);


    const normalRate =
        getNormalSurchargeRate(
            income,
            regime
        );


    /*
      Special-rate capital gains under
      sections 111A / 112 / 112A are
      subject to surcharge, but enhanced
      25% / 37% surcharge does not apply
      to those special-rate tax components.

      Maximum surcharge on such special-rate
      tax is therefore capped at 15%.
    */

    const specialRate =
        Math.min(
            normalRate,
            0.15
        );


    const normalSurcharge =
        round(
            num(normalTax) *
            normalRate
        );


    const specialSurcharge =
        round(
            num(specialRateTax) *
            specialRate
        );


    return {

        normalRate,

        specialRate,

        normalSurcharge,

        specialSurcharge,

        amount:
            normalSurcharge +
            specialSurcharge
    };
}


// ============================================================
// SURCHARGE MARGINAL RELIEF
// ============================================================

function calculateSurchargeMarginalRelief(
    totalIncome,
    taxBeforeSurcharge,
    surcharge,
    regime
) {

    const income =
        num(totalIncome);


    let threshold = 0;


    /*
      New regime:
      50L, 1Cr, 2Cr thresholds

      Old regime:
      50L, 1Cr, 2Cr, 5Cr
    */

    if (income > 5000000 &&
        income <= 10000000) {

        threshold = 5000000;

    }

    else if (income > 10000000 &&
             income <= 20000000) {

        threshold = 10000000;

    }

    else if (income > 20000000 &&
             income <= 50000000) {

        threshold = 20000000;

    }

    else if (
        regime === "Old Regime" &&
        income > 50000000
    ) {

        threshold = 50000000;
    }


    if (!threshold) {

        return {

            threshold: 0,

            relief: 0
        };
    }


    /*
      Approximate tax + surcharge at
      threshold income.

      The engine calculates normal slab
      tax at the threshold and compares
      the excess tax burden with the
      excess income.
    */

    const thresholdNormalTax =
        regime === "Old Regime"
            ? calculateOldRegimeSlabTax(
                threshold,
                0
            )
            : calculateNewRegimeSlabTax(
                threshold
            );


    const thresholdSurchargeRate =
        getNormalSurchargeRate(
            threshold,
            regime
        );


    const thresholdTaxWithSurcharge =
        thresholdNormalTax +
        round(
            thresholdNormalTax *
            thresholdSurchargeRate
        );


    const currentTaxWithSurcharge =
        num(taxBeforeSurcharge) +
        num(surcharge);


    const maximumAllowed =
        thresholdTaxWithSurcharge +
        (
            income -
            threshold
        );


    const relief =
        Math.max(
            0,
            currentTaxWithSurcharge -
            maximumAllowed
        );


    return {

        threshold,

        relief:
            round(relief)
    };
}


// ============================================================
// 87A OLD REGIME
// ============================================================

function calculateOldRegimeRebate(
    taxableIncome,
    normalTax,
    resident = true
) {

    if (
        !resident ||
        taxableIncome > 500000
    ) {

        return 0;
    }


    return Math.min(
        12500,
        num(normalTax)
    );
}


// ============================================================
// 87A NEW REGIME
// ============================================================

function calculateNewRegimeRebate(
    totalIncome,
    normalTax,
    resident = true
) {

    /*
      AY 2026-27:

      Resident individual
      Total income <= ₹12 lakh

      Maximum rebate ₹60,000.

      Special-rate tax is kept separate
      and is NOT reduced by this rebate.
    */

    if (
        !resident ||
        totalIncome > 1200000
    ) {

        return 0;
    }


    return Math.min(
        60000,
        num(normalTax)
    );
}


// ============================================================
// 87A MARGINAL RELIEF - NEW REGIME
// ============================================================

function calculateNewRegime87AMarginalRelief(
    totalIncome,
    normalTax
) {

    const income =
        num(totalIncome);


    /*
      Applies when total income is
      slightly above ₹12 lakh.

      Preliminary computation:
      tax should not exceed the amount
      by which total income exceeds
      ₹12 lakh.
    */

    if (
        income <= 1200000 ||
        income > 1275000
    ) {

        return 0;
    }


    const excessIncome =
        income -
        1200000;


    const relief =
        Math.max(
            0,
            num(normalTax) -
            excessIncome
        );


    return round(relief);
}


// ============================================================
// CESS
// ============================================================

function calculateCess(
    taxAfterReliefAndSurcharge
) {

    return round(
        Math.max(
            0,
            num(taxAfterReliefAndSurcharge)
        ) *
        0.04
    );
}


// ============================================================
// NORMAL INCOME CALCULATION
// ============================================================

function calculateNormalIncome(
    data,
    deductions
) {

    const salary =
        num(data.salaryIncome);


    const otherIncome =
        num(data.otherIncome);


    const businessIncome =
        num(data.businessIncome) ||
        num(data.professionIncome);


    const housePropertyIncome =
        num(data.housePropertyIncome);


    const grossNormalIncome =
        salary +
        otherIncome +
        businessIncome +
        housePropertyIncome;


    const taxableNormalIncome =
        Math.max(
            0,
            grossNormalIncome -
            deductions.total
        );


    return {

        salary,

        otherIncome,

        businessIncome,

        housePropertyIncome,

        grossNormalIncome,

        taxableNormalIncome
    };
}


// ============================================================
// OLD REGIME
// ============================================================

function calculateOldRegime(
    data
) {

    const capitalGains =
        getCapitalGains(data);


    const capitalGainTax =
        calculateCapitalGainsTax(
            capitalGains
        );


    const deductions =
        calculateOldRegimeDeductions(
            data
        );


    const normalIncome =
        calculateNormalIncome(
            data,
            deductions
        );


    const totalIncome =
        normalIncome.taxableNormalIncome +
        capitalGains.totalCapitalGains;


    /*
      STCG other than 111A is added to
      normal taxable income for slab taxation.
    */

    const slabIncome =
        normalIncome.taxableNormalIncome +
        capitalGains.stcgOther;


    const basicNormalTax =
        calculateOldRegimeSlabTax(
            slabIncome,
            num(data.age)
        );


    const resident =
        String(
            data.residentialStatus ||
            "Resident"
        ).toLowerCase() ===
        "resident";


    const rebate =
        calculateOldRegimeRebate(
            totalIncome,
            basicNormalTax,
            resident
        );


    const normalTaxAfterRebate =
        Math.max(
            0,
            basicNormalTax -
            rebate
        );


    /*
      Capital gains special-rate tax
    */

    const specialRateTax =
        capitalGainTax.specialRateTax;


    const taxBeforeSurcharge =
        normalTaxAfterRebate +
        specialRateTax;


    const surcharge =
        calculateSurcharge(
            totalIncome,
            normalTaxAfterRebate,
            specialRateTax,
            "Old Regime"
        );


    const surchargeRelief =
        calculateSurchargeMarginalRelief(
            totalIncome,
            taxBeforeSurcharge,
            surcharge.amount,
            "Old Regime"
        );


    const finalTaxBeforeCess =
        Math.max(
            0,
            taxBeforeSurcharge +
            surcharge.amount -
            surchargeRelief.relief
        );


    const cess =
        calculateCess(
            finalTaxBeforeCess
        );


    const finalTax =
        finalTaxBeforeCess +
        cess;


    return {

        regime:
            "Old Regime",

        grossNormalIncome:
            normalIncome.grossNormalIncome,

        normalTaxableIncome:
            normalIncome.taxableNormalIncome,

        totalIncome:
            round(totalIncome),

        deductions,

        capitalGains,

        capitalGainTax,

        slabIncome,

        basicNormalTax,

        rebate,

        normalTaxAfterRebate,

        specialRateTax,

        taxBeforeSurcharge,

        surcharge,

        surchargeMarginalRelief:
            surchargeRelief,

        cess,

        finalTax:
            round(finalTax)
    };
}


// ============================================================
// NEW REGIME
// ============================================================

function calculateNewRegime(
    data
) {

    const capitalGains =
        getCapitalGains(data);


    const capitalGainTax =
        calculateCapitalGainsTax(
            capitalGains
        );


    const deductions =
        calculateNewRegimeDeductions(
            data
        );


    const normalIncome =
        calculateNormalIncome(
            data,
            deductions
        );


    const totalIncome =
        normalIncome.taxableNormalIncome +
        capitalGains.totalCapitalGains;


    /*
      STCG other than 111A remains normal
      slab income in this preliminary engine.
    */

    const slabIncome =
        normalIncome.taxableNormalIncome +
        capitalGains.stcgOther;


    const basicNormalTax =
        calculateNewRegimeSlabTax(
            slabIncome
        );


    const resident =
        String(
            data.residentialStatus ||
            "Resident"
        ).toLowerCase() ===
        "resident";


    /*
      87A is applied to normal slab tax,
      not special-rate capital gains tax.
    */

    let rebate =
        calculateNewRegimeRebate(
            totalIncome,
            basicNormalTax,
            resident
        );


    /*
      If income exceeds ₹12 lakh,
      normal 87A rebate is not applied.
    */

    if (totalIncome > 1200000) {

        rebate = 0;
    }


    let normalTaxAfterRebate =
        Math.max(
            0,
            basicNormalTax -
            rebate
        );


    /*
      87A marginal relief around ₹12 lakh.

      Applied to normal slab tax.
    */

    let rebateMarginalRelief = 0;


    if (
        totalIncome > 1200000 &&
        totalIncome <= 1275000
    ) {

        rebateMarginalRelief =
            calculateNewRegime87AMarginalRelief(
                totalIncome,
                basicNormalTax
            );


        normalTaxAfterRebate =
            Math.max(
                0,
                basicNormalTax -
                rebateMarginalRelief
            );
    }


    const specialRateTax =
        capitalGainTax.specialRateTax;


    const taxBeforeSurcharge =
        normalTaxAfterRebate +
        specialRateTax;


    const surcharge =
        calculateSurcharge(
            totalIncome,
            normalTaxAfterRebate,
            specialRateTax,
            "New Regime"
        );


    const surchargeRelief =
        calculateSurchargeMarginalRelief(
            totalIncome,
            taxBeforeSurcharge,
            surcharge.amount,
            "New Regime"
        );


    const finalTaxBeforeCess =
        Math.max(
            0,
            taxBeforeSurcharge +
            surcharge.amount -
            surchargeRelief.relief
        );


    const cess =
        calculateCess(
            finalTaxBeforeCess
        );


    const finalTax =
        finalTaxBeforeCess +
        cess;


    return {

        regime:
            "New Regime",

        grossNormalIncome:
            normalIncome.grossNormalIncome,

        normalTaxableIncome:
            normalIncome.taxableNormalIncome,

        totalIncome:
            round(totalIncome),

        deductions,

        capitalGains,

        capitalGainTax,

        slabIncome,

        basicNormalTax,

        rebate,

        rebateMarginalRelief,

        normalTaxAfterRebate,

        specialRateTax,

        taxBeforeSurcharge,

        surcharge,

        surchargeMarginalRelief:
            surchargeRelief,

        cess,

        finalTax:
            round(finalTax)
    };
}


// ============================================================
// REGIME COMPARISON
// ============================================================

function compareTaxRegimes(
    data
) {

    const oldRegime =
        calculateOldRegime(data);


    const newRegime =
        calculateNewRegime(data);


    let recommendation;


    if (
        oldRegime.finalTax <
        newRegime.finalTax
    ) {

        recommendation =
            "Old Regime";

    }

    else if (
        newRegime.finalTax <
        oldRegime.finalTax
    ) {

        recommendation =
            "New Regime";

    }

    else {

        recommendation =
            "Both regimes are approximately equal";
    }


    return {

        oldRegime,

        newRegime,

        recommendation,

        difference:
            round(
                Math.abs(
                    oldRegime.finalTax -
                    newRegime.finalTax
                )
            )
    };
}


// ============================================================
// EXPORTS
// ============================================================

if (
    typeof module !== "undefined" &&
    module.exports
) {

    module.exports = {

        calculateOldRegime,

        calculateNewRegime,

        compareTaxRegimes,

        calculateOldRegimeSlabTax,

        calculateNewRegimeSlabTax,

        calculateCapitalGainsTax,

        calculateOldRegimeDeductions,

        calculateNewRegimeDeductions,

        calculateOldRegimeRebate,

        calculateNewRegimeRebate,

        calculateNewRegime87AMarginalRelief,

        calculateCess,

        calculateSurcharge,

        calculateSurchargeMarginalRelief,

        getCapitalGains
    };
}
