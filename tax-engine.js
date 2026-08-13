
/*
  TAX ENGINE
  AY 2026-27
  Preliminary computation engine

  IMPORTANT:
  This is an estimation engine.
  It is not a substitute for the official Income Tax
  Department utility or professional tax verification.
*/


// ==========================================
// HELPERS
// ==========================================

function num(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
}


function round(value) {
    return Math.round(num(value));
}


// ==========================================
// OLD REGIME - NORMAL SLAB TAX
// ==========================================

function calculateOldRegimeSlabTax(taxableIncome, age = 0) {

    const income = Math.max(0, num(taxableIncome));

    let tax = 0;

    // Individual below 60
    if (age < 60) {

        if (income <= 250000) {
            tax = 0;
        }

        else if (income <= 500000) {
            tax =
                (income - 250000) * 0.05;
        }

        else if (income <= 1000000) {
            tax =
                12500 +
                (income - 500000) * 0.20;
        }

        else {
            tax =
                112500 +
                (income - 1000000) * 0.30;
        }
    }

    // Senior citizen 60 to below 80
    else if (age < 80) {

        if (income <= 300000) {
            tax = 0;
        }

        else if (income <= 500000) {
            tax =
                (income - 300000) * 0.05;
        }

        else if (income <= 1000000) {
            tax =
                10000 +
                (income - 500000) * 0.20;
        }

        else {
            tax =
                110000 +
                (income - 1000000) * 0.30;
        }
    }

    // Super senior citizen
    else {

        if (income <= 500000) {
            tax = 0;
        }

        else if (income <= 1000000) {
            tax =
                (income - 500000) * 0.20;
        }

        else {
            tax =
                100000 +
                (income - 1000000) * 0.30;
        }
    }

    return round(tax);
}


// ==========================================
// NEW REGIME - AY 2026-27 NORMAL SLABS
// ==========================================

function calculateNewRegimeSlabTax(taxableIncome) {

    const income = Math.max(0, num(taxableIncome));

    let tax = 0;

    if (income <= 400000) {

        tax = 0;

    }

    else if (income <= 800000) {

        tax =
            (income - 400000) * 0.05;

    }

    else if (income <= 1200000) {

        tax =
            20000 +
            (income - 800000) * 0.10;

    }

    else if (income <= 1600000) {

        tax =
            60000 +
            (income - 1200000) * 0.15;

    }

    else if (income <= 2000000) {

        tax =
            120000 +
            (income - 1600000) * 0.20;

    }

    else if (income <= 2400000) {

        tax =
            200000 +
            (income - 2000000) * 0.25;

    }

    else {

        tax =
            300000 +
            (income - 2400000) * 0.30;
    }

    return round(tax);
}


// ==========================================
// 87A REBATE - OLD REGIME
// ==========================================

function calculateOldRegimeRebate(taxableIncome, tax) {

    if (taxableIncome <= 500000) {

        return Math.min(
            12500,
            tax
        );
    }

    return 0;
}


// ==========================================
// 87A REBATE - NEW REGIME
// ==========================================

function calculateNewRegimeRebate(taxableIncome, tax) {

    if (taxableIncome <= 1200000) {

        return Math.min(
            60000,
            tax
        );
    }

    return 0;
}


// ==========================================
// HEALTH & EDUCATION CESS
// ==========================================

function calculateCess(taxAfterRebate) {

    return round(
        Math.max(0, taxAfterRebate) * 0.04
    );
}


// ==========================================
// OLD REGIME DEDUCTIONS
// ==========================================

function calculateOldRegimeDeductions(data) {

    const salary =
        num(data.salaryIncome);

    const standardDeduction =
        data.incomeType === "Salary"
            ? 50000
            : 0;


    // 80C maximum
    const section80C =
        Math.min(
            num(data.investment80C),
            150000
        );


    // 80D
    const age =
        num(data.age);

    const insuranceLimit =
        age >= 60
            ? 50000
            : 25000;

    const section80D =
        Math.min(
            num(data.healthInsurance),
            insuranceLimit
        );


    // 80CCD(1B)
    const nps =
        Math.min(
            num(data.nps),
            50000
        );


    // Home loan interest
    const homeLoanInterest =
        Math.min(
            num(data.homeLoanInterest),
            200000
        );


    return {

        standardDeduction,

        section80C,

        section80D,

        section80CCD1B: nps,

        homeLoanInterest,

        total:

            standardDeduction +
            section80C +
            section80D +
            nps +
            homeLoanInterest
    };
}


// ==========================================
// NEW REGIME DEDUCTIONS
// ==========================================

function calculateNewRegimeDeductions(data) {

    const standardDeduction =
        data.incomeType === "Salary"
            ? 75000
            : 0;


    return {

        standardDeduction,

        total:
            standardDeduction
    };
}


// ==========================================
// SURCHARGE
// ==========================================

function calculateSurcharge(normalTaxableIncome, tax) {

    const income =
        num(normalTaxableIncome);

    let rate = 0;

    /*
      General surcharge structure.
      Special-rate income will require
      separate treatment in the advanced
      capital-gains engine.
    */

    if (income > 50000000) {

        rate = 0.37;

    }

    else if (income > 20000000) {

        rate = 0.25;

    }

    else if (income > 10000000) {

        rate = 0.15;

    }

    else if (income > 5000000) {

        rate = 0.10;
    }


    return {

        rate,

        amount:
            round(tax * rate)
    };
}


// ==========================================
// COMPLETE OLD REGIME CALCULATION
// ==========================================

function calculateOldRegime(data) {

    const salaryIncome =
        num(data.salaryIncome);

    const otherIncome =
        num(data.otherIncome);


    const grossIncome =
        salaryIncome +
        otherIncome;


    const deductions =
        calculateOldRegimeDeductions(data);


    const taxableIncome =
        Math.max(
            0,
            grossIncome -
            deductions.total
        );


    let tax =
        calculateOldRegimeSlabTax(
            taxableIncome,
            num(data.age)
        );


    const rebate =
        calculateOldRegimeRebate(
            taxableIncome,
            tax
        );


    tax =
        Math.max(
            0,
            tax - rebate
        );


    const surcharge =
        calculateSurcharge(
            taxableIncome,
            tax
        );


    const taxAfterSurcharge =
        tax +
        surcharge.amount;


    const cess =
        calculateCess(
            taxAfterSurcharge
        );


    const finalTax =
        taxAfterSurcharge +
        cess;


    return {

        regime: "Old Regime",

        grossIncome,

        deductions,

        taxableIncome,

        basicTax: tax,

        rebate,

        surcharge,

        cess,

        finalTax:
            round(finalTax)
    };
}


// ==========================================
// COMPLETE NEW REGIME CALCULATION
// ==========================================

function calculateNewRegime(data) {

    const salaryIncome =
        num(data.salaryIncome);

    const otherIncome =
        num(data.otherIncome);


    const grossIncome =
        salaryIncome +
        otherIncome;


    const deductions =
        calculateNewRegimeDeductions(data);


    const taxableIncome =
        Math.max(
            0,
            grossIncome -
            deductions.total
        );


    let tax =
        calculateNewRegimeSlabTax(
            taxableIncome
        );


    const rebate =
        calculateNewRegimeRebate(
            taxableIncome,
            tax
        );


    tax =
        Math.max(
            0,
            tax - rebate
        );


    const surcharge =
        calculateSurcharge(
            taxableIncome,
            tax
        );


    const taxAfterSurcharge =
        tax +
        surcharge.amount;


    const cess =
        calculateCess(
            taxAfterSurcharge
        );


    const finalTax =
        taxAfterSurcharge +
        cess;


    return {

        regime: "New Regime",

        grossIncome,

        deductions,

        taxableIncome,

        basicTax: tax,

        rebate,

        surcharge,

        cess,

        finalTax:
            round(finalTax)
    };
}


// ==========================================
// COMPARE BOTH REGIMES
// ==========================================

function compareTaxRegimes(data) {

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
            Math.abs(
                oldRegime.finalTax -
                newRegime.finalTax
            )
    };
}


// ==========================================
// EXPORT
// ==========================================

if (typeof module !== "undefined") {

    module.exports = {

        calculateOldRegime,

        calculateNewRegime,

        compareTaxRegimes,

        calculateOldRegimeSlabTax,

        calculateNewRegimeSlabTax,

        calculateOldRegimeRebate,

        calculateNewRegimeRebate,

        calculateCess,

        calculateSurcharge
    };
}
