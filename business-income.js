/*
  BUSINESS / PROFESSION INCOME ENGINE
  AY 2026-27

  Handles:
  - Normal business
  - Normal profession
  - Section 44AD
  - Section 44ADA
  - Section 44AE
  - Digital / account-payee receipts
  - Cash / other receipts
  - Actual income override
  - Business expenses
  - Depreciation
  - Profit / loss
*/


// =====================================================
// HELPERS
// =====================================================

function biNum(value) {

    const n = Number(value);

    if (!Number.isFinite(n) || n < 0) {
        return 0;
    }

    return n;
}


function biRound(value) {
    return Math.round(
        biNum(value)
    );
}


// =====================================================
// NORMAL BUSINESS
// =====================================================

function calculateNormalBusinessIncome(data = {}) {

    const grossReceipts =
        biNum(data.grossReceipts);

    const expenses =
        biNum(data.businessExpenses);

    const depreciation =
        biNum(data.depreciation);

    const otherAdjustments =
        biNum(data.otherAdjustments);


    const profit =
        grossReceipts -
        expenses -
        depreciation +
        otherAdjustments;


    return {

        method:
            "NORMAL_BUSINESS",

        grossReceipts:
            biRound(grossReceipts),

        expenses:
            biRound(expenses),

        depreciation:
            biRound(depreciation),

        otherAdjustments:
            biRound(otherAdjustments),

        profit:
            biRound(profit),

        loss:
            profit < 0
                ? biRound(
                    Math.abs(profit)
                )
                : 0
    };
}


// =====================================================
// 44AD
// =====================================================

function calculate44AD(data = {}) {

    const digitalReceipts =
        biNum(
            data.digitalReceipts
        );

    const otherReceipts =
        biNum(
            data.otherReceipts
        );


    const grossReceipts =
        digitalReceipts +
        otherReceipts;


    /*
      AY 2026-27:
      6% for qualifying receipts
      received through prescribed banking/
      electronic modes.

      8% for other receipts.
    */

    const digitalPresumptive =
        digitalReceipts * 0.06;


    const otherPresumptive =
        otherReceipts * 0.08;


    const minimumIncome =
        digitalPresumptive +
        otherPresumptive;


    /*
      Assessee can declare a higher
      actual/claimed income.
    */

    const claimedIncome =
        biNum(
            data.claimedIncome44AD
        );


    const presumptiveIncome =
        Math.max(
            minimumIncome,
            claimedIncome
        );


    const turnoverLimit =
        30000000;


    const eligible =
        grossReceipts <=
        turnoverLimit;


    return {

        section:
            "44AD",

        digitalReceipts:
            biRound(digitalReceipts),

        otherReceipts:
            biRound(otherReceipts),

        grossReceipts:
            biRound(grossReceipts),

        digitalRate:
            0.06,

        otherRate:
            0.08,

        digitalPresumptiveIncome:
            biRound(
                digitalPresumptive
            ),

        otherPresumptiveIncome:
            biRound(
                otherPresumptive
            ),

        minimumIncome:
            biRound(
                minimumIncome
            ),

        claimedIncome:
            biRound(
                claimedIncome
            ),

        presumptiveIncome:
            biRound(
                presumptiveIncome
            ),

        turnoverLimit,

        eligible,

        warning:
            !eligible
                ? "Gross receipts exceed the 44AD limit."
                : ""
    };
}


// =====================================================
// 44ADA
// =====================================================

function calculate44ADA(data = {}) {

    const digitalReceipts =
        biNum(
            data.digitalReceipts
        );

    const cashReceipts =
        biNum(
            data.cashReceipts
        );

    const otherReceipts =
        biNum(
            data.otherReceipts
        );


    const grossReceipts =
        digitalReceipts +
        cashReceipts +
        otherReceipts;


    const cashRatio =
        grossReceipts > 0
            ? cashReceipts /
              grossReceipts
            : 0;


    /*
      Standard limit:
      ₹50 lakh

      Extended limit:
      ₹75 lakh where cash receipts
      do not exceed 5% of total receipts.
    */

    const extendedEligible =
        cashRatio <= 0.05;


    const receiptLimit =
        extendedEligible
            ? 7500000
            : 5000000;


    const minimumIncome =
        grossReceipts *
        0.50;


    const claimedIncome =
        biNum(
            data.claimedIncome44ADA
        );


    const presumptiveIncome =
        Math.max(
            minimumIncome,
            claimedIncome
        );


    const eligible =
        grossReceipts <=
        receiptLimit;


    return {

        section:
            "44ADA",

        digitalReceipts:
            biRound(digitalReceipts),

        cashReceipts:
            biRound(cashReceipts),

        otherReceipts:
            biRound(otherReceipts),

        grossReceipts:
            biRound(grossReceipts),

        cashRatio:
            Number(
                (
                    cashRatio * 100
                ).toFixed(2)
            ),

        standardRate:
            0.50,

        minimumIncome:
            biRound(
                minimumIncome
            ),

        claimedIncome:
            biRound(
                claimedIncome
            ),

        presumptiveIncome:
            biRound(
                presumptiveIncome
            ),

        receiptLimit,

        extendedLimitApplied:
            extendedEligible,

        eligible,

        warning:
            !eligible
                ? "Gross receipts exceed the 44ADA limit."
                : ""
    };
}


// =====================================================
// 44AE
// GOODS CARRIAGE
// =====================================================

function calculate44AE(data = {}) {

    const vehicles =
        Array.isArray(
            data.vehicles
        )
            ? data.vehicles
            : [];


    let totalIncome = 0;


    const vehicleResults = [];


    for (
        const vehicle
        of vehicles
    ) {

        const months =
            Math.max(
                0,
                biNum(
                    vehicle.months
                )
            );


        const tonnage =
            Math.max(
                0,
                biNum(
                    vehicle.tonnage
                )
            );


        let monthlyRate;


        /*
          For goods carriage:
          Up to 12 MT:
          ₹7,500 per month

          Above 12 MT:
          ₹1,000 per ton per month
        */

        if (tonnage > 12) {

            monthlyRate =
                1000 * tonnage;

        } else {

            monthlyRate =
                7500;
        }


        const minimumIncome =
            monthlyRate *
            months;


        const actualIncome =
            biNum(
                vehicle.actualIncome
            );


        const presumptiveIncome =
            Math.max(
                minimumIncome,
                actualIncome
            );


        totalIncome +=
            presumptiveIncome;


        vehicleResults.push({

            registrationNumber:
                vehicle.registrationNumber ||
                "",

            tonnage:
                biRound(tonnage),

            months:
                biRound(months),

            monthlyRate:
                biRound(monthlyRate),

            minimumIncome:
                biRound(
                    minimumIncome
                ),

            actualIncome:
                biRound(
                    actualIncome
                ),

            presumptiveIncome:
                biRound(
                    presumptiveIncome
                )
        });
    }


    return {

        section:
            "44AE",

        vehicles:
            vehicleResults,

        totalIncome:
            biRound(totalIncome)
    };
}


// =====================================================
// BUSINESS EXPENSE SUMMARY
// =====================================================

function calculateBusinessExpenses(data = {}) {

    const salaries =
        biNum(
            data.employeeSalary
        );

    const rent =
        biNum(
            data.businessRent
        );

    const electricity =
        biNum(
            data.electricity
        );

    const professionalFees =
        biNum(
            data.professionalFees
        );

    const interest =
        biNum(
            data.businessInterest
        );

    const depreciation =
        biNum(
            data.depreciation
        );

    const otherExpenses =
        biNum(
            data.otherExpenses
        );


    const total =
        salaries +
        rent +
        electricity +
        professionalFees +
        interest +
        depreciation +
        otherExpenses;


    return {

        salaries:
            biRound(salaries),

        rent:
            biRound(rent),

        electricity:
            biRound(electricity),

        professionalFees:
            biRound(professionalFees),

        interest:
            biRound(interest),

        depreciation:
            biRound(depreciation),

        otherExpenses:
            biRound(otherExpenses),

        total:
            biRound(total)
    };
}


// =====================================================
// MAIN BUSINESS ENGINE
// =====================================================

function calculateBusinessIncome(data = {}) {

    const method =
        data.method ||
        "NORMAL";


    switch (method) {

        case "44AD":

            return calculate44AD(
                data
            );


        case "44ADA":

            return calculate44ADA(
                data
            );


        case "44AE":

            return calculate44AE(
                data
            );


        case "NORMAL":

        default:

            return calculateNormalBusinessIncome(
                data
            );
    }
}


// =====================================================
// LOSS / PROFIT SUMMARY
// =====================================================

function calculateBusinessSummary(data = {}) {

    const result =
        calculateBusinessIncome(
            data
        );


    const income =
        biNum(
            result.profit ??
            result.presumptiveIncome ??
            result.totalIncome
        );


    return {

        method:
            result.section ||
            result.method,

        income:
            biRound(income),

        loss:
            income < 0
                ? biRound(
                    Math.abs(income)
                )
                : 0,

        calculation:
            result
    };
}


// =====================================================
// VALIDATION
// =====================================================

function validateBusinessData(data = {}) {

    const errors = [];


    const method =
        data.method ||
        "NORMAL";


    if (
        method === "44AD"
    ) {

        const receipts =
            biNum(
                data.digitalReceipts
            ) +
            biNum(
                data.otherReceipts
            );


        if (
            receipts > 30000000
        ) {

            errors.push(
                "44AD gross receipts exceed ₹3 crore."
            );
        }
    }


    if (
        method === "44ADA"
    ) {

        const receipts =
            biNum(
                data.digitalReceipts
            ) +
            biNum(
                data.cashReceipts
            ) +
            biNum(
                data.otherReceipts
            );


        const cash =
            biNum(
                data.cashReceipts
            );


        const cashRatio =
            receipts > 0
                ? cash / receipts
                : 0;


        const limit =
            cashRatio <= 0.05
                ? 7500000
                : 5000000;


        if (
            receipts > limit
        ) {

            errors.push(
                "44ADA gross receipts exceed the applicable limit."
            );
        }
    }


    return {

        valid:
            errors.length === 0,

        errors
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

        calculateNormalBusinessIncome,

        calculate44AD,

        calculate44ADA,

        calculate44AE,

        calculateBusinessExpenses,

        calculateBusinessIncome,

        calculateBusinessSummary,

        validateBusinessData
    };
}
