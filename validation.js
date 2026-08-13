/*
  TAX VALIDATION ENGINE
  AY 2026-27

  Purpose:
  Check whether entered taxpayer information is:
  - complete
  - logically consistent
  - compatible with selected ITR
  - compatible with selected tax regime

  This is a pre-validation layer.
  Final filing validation must always be checked
  against the official Income Tax Department utility.
*/


// =====================================================
// HELPERS
// =====================================================

function valNum(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
        return 0;
    }

    return n;
}


function isPositive(value) {
    return valNum(value) > 0;
}


function isTrue(value) {
    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "yes"
    );
}


function addError(errors, code, message) {

    errors.push({
        severity: "ERROR",
        code,
        message
    });
}


function addWarning(warnings, code, message) {

    warnings.push({
        severity: "WARNING",
        code,
        message
    });
}


// =====================================================
// BASIC TAXPAYER VALIDATION
// =====================================================

function validateBasicInformation(data = {}) {

    const errors = [];
    const warnings = [];


    if (!data.taxpayerType) {

        addError(
            errors,
            "TAXPAYER_TYPE_MISSING",
            "Taxpayer type is required."
        );
    }


    if (!data.residentialStatus) {

        addWarning(
            warnings,
            "RESIDENTIAL_STATUS_MISSING",
            "Residential status should be provided."
        );
    }


    if (!data.assessmentYear) {

        addWarning(
            warnings,
            "AY_MISSING",
            "Assessment Year should be specified."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// REGIME VALIDATION
// =====================================================

function validateRegime(data = {}) {

    const errors = [];
    const warnings = [];


    const regime =
        data.regime || "";


    if (
        regime &&
        regime !== "Old" &&
        regime !== "New"
    ) {

        addError(
            errors,
            "INVALID_REGIME",
            "Tax regime must be Old or New."
        );
    }


    /*
      New regime deduction warning.

      Do not automatically delete deductions.
      Instead flag them for the calculation engine.
    */

    if (
        regime === "New"
    ) {

        const deductions =
            data.deductions || {};


        const restrictedFields = [

            "section80C",
            "section80CCC",
            "section80CCD1",
            "section80CCD1B",
            "section80D",
            "section80DD",
            "section80DDB",
            "section80E",
            "section80EE",
            "section80EEA",
            "section80EEB",
            "section80G",
            "section80GG",
            "section80TTA",
            "section80TTB",
            "section80U"
        ];


        for (
            const field
            of restrictedFields
        ) {

            if (
                isPositive(
                    deductions[field]
                )
            ) {

                addWarning(
                    warnings,
                    "NEW_REGIME_DEDUCTION",
                    `${field} may not be available under the New Tax Regime and should be reviewed.`
                );
            }
        }
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// INCOME VALIDATION
// =====================================================

function validateIncome(data = {}) {

    const errors = [];
    const warnings = [];


    const salary =
        valNum(data.salaryIncome);


    const houseProperty =
        valNum(data.housePropertyIncome);


    const business =
        valNum(data.businessIncome);


    const profession =
        valNum(data.professionIncome);


    const capitalGain =
        valNum(data.capitalGain);


    const otherIncome =
        valNum(data.otherIncome);


    const total =
        valNum(data.totalIncome);


    const calculatedTotal =
        salary +
        houseProperty +
        business +
        profession +
        capitalGain +
        otherIncome;


    /*
      Only compare when total income
      has actually been supplied.
    */

    if (
        total > 0 &&
        Math.abs(
            total -
            calculatedTotal
        ) > 1
    ) {

        addWarning(
            warnings,
            "TOTAL_INCOME_MISMATCH",
            "Entered total income does not match the income components."
        );
    }


    if (
        total < 0
    ) {

        addError(
            errors,
            "INVALID_TOTAL_INCOME",
            "Total income cannot be negative."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// BUSINESS VALIDATION
// =====================================================

function validateBusiness(data = {}) {

    const errors = [];
    const warnings = [];


    const hasBusiness =
        isTrue(data.hasBusinessIncome) ||
        isTrue(data.hasProfessionalIncome) ||
        isPositive(data.businessIncome) ||
        isPositive(data.professionIncome);


    if (!hasBusiness) {

        return {
            errors,
            warnings
        };
    }


    const method =
        data.businessMethod ||
        data.method ||
        "";


    if (!method) {

        addWarning(
            warnings,
            "BUSINESS_METHOD_MISSING",
            "Business/profession income method should be specified."
        );

        return {
            errors,
            warnings
        };
    }


    // -----------------------------------------------
    // 44AD
    // -----------------------------------------------

    if (
        method === "44AD"
    ) {

        const digital =
            valNum(
                data.digitalReceipts
            );


        const other =
            valNum(
                data.otherReceipts
            );


        const receipts =
            digital +
            other;


        if (
            receipts <= 0
        ) {

            addError(
                errors,
                "44AD_RECEIPTS_MISSING",
                "44AD requires business gross receipts/turnover."
            );
        }


        if (
            receipts > 30000000
        ) {

            addWarning(
                warnings,
                "44AD_LIMIT",
                "Gross receipts exceed the ₹3 crore threshold; verify 44AD eligibility."
            );
        }
    }


    // -----------------------------------------------
    // 44ADA
    // -----------------------------------------------

    if (
        method === "44ADA"
    ) {

        const digital =
            valNum(
                data.digitalReceipts
            );


        const cash =
            valNum(
                data.cashReceipts
            );


        const other =
            valNum(
                data.otherReceipts
            );


        const receipts =
            digital +
            cash +
            other;


        if (
            receipts <= 0
        ) {

            addError(
                errors,
                "44ADA_RECEIPTS_MISSING",
                "44ADA requires professional gross receipts."
            );
        }


        const cashRatio =
            receipts > 0
                ? cash / receipts
                : 0;


        const applicableLimit =
            cashRatio <= 0.05
                ? 7500000
                : 5000000;


        if (
            receipts >
            applicableLimit
        ) {

            addWarning(
                warnings,
                "44ADA_LIMIT",
                "Professional receipts exceed the applicable 44ADA threshold; verify eligibility."
            );
        }
    }


    // -----------------------------------------------
    // 44AE
    // -----------------------------------------------

    if (
        method === "44AE"
    ) {

        if (
            !Array.isArray(
                data.vehicles
            ) ||
            data.vehicles.length === 0
        ) {

            addError(
                errors,
                "44AE_VEHICLES_MISSING",
                "44AE requires goods-carriage vehicle details."
            );
        }
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// CAPITAL GAINS VALIDATION
// =====================================================

function validateCapitalGains(data = {}) {

    const errors = [];
    const warnings = [];


    const hasCG =
        isTrue(data.hasCapitalGains) ||
        isPositive(data.capitalGain) ||
        isPositive(data.shortTermCapitalGain) ||
        isPositive(data.longTermCapitalGain);


    if (!hasCG) {

        return {
            errors,
            warnings
        };
    }


    if (
        !data.capitalGains &&
        !data.transactions
    ) {

        addWarning(
            warnings,
            "CG_DETAILS_MISSING",
            "Capital gain is reported but transaction details are missing."
        );
    }


    if (
        isPositive(
            data.capitalGain
        ) &&
        !data.assetType
    ) {

        addWarning(
            warnings,
            "ASSET_TYPE_MISSING",
            "Asset type should be provided for capital-gain computation."
        );
    }


    /*
      Special-rate income should not be treated
      as normal slab-rate income.
    */

    if (
        isTrue(
            data.hasSpecialRateIncome
        ) &&
        !data.specialRateDetails
    ) {

        addWarning(
            warnings,
            "SPECIAL_RATE_DETAILS",
            "Special-rate income details are required for correct tax computation."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// HOUSE PROPERTY VALIDATION
// =====================================================

function validateHouseProperty(data = {}) {

    const errors = [];
    const warnings = [];


    const hasHouseProperty =
        isTrue(data.hasHouseProperty) ||
        isPositive(data.housePropertyIncome) ||
        isPositive(data.rentReceived) ||
        isPositive(data.homeLoanInterest);


    if (!hasHouseProperty) {

        return {
            errors,
            warnings
        };
    }


    const type =
        data.propertyType || "";


    if (!type) {

        addWarning(
            warnings,
            "PROPERTY_TYPE_MISSING",
            "House-property type should be specified."
        );
    }


    if (
        type === "LET_OUT"
    ) {

        if (
            !isPositive(
                data.rentReceived
            )
        ) {

            addWarning(
                warnings,
                "RENT_MISSING",
                "Let-out property should normally contain rental/annual-value information."
            );
        }
    }


    if (
        isPositive(
            data.municipalTax
        ) &&
        type === "SELF_OCCUPIED"
    ) {

        addWarning(
            warnings,
            "SELF_OCCUPIED_MUNICIPAL_TAX",
            "Review municipal-tax entry for self-occupied property."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// DEDUCTION VALIDATION
// =====================================================

function validateDeductions(data = {}) {

    const errors = [];
    const warnings = [];


    const deductions =
        data.deductions || {};


    const section80C =
        valNum(
            deductions.section80C
        );


    const section80CCC =
        valNum(
            deductions.section80CCC
        );


    const section80CCD1 =
        valNum(
            deductions.section80CCD1
        );


    const combined80C =
        section80C +
        section80CCC +
        section80CCD1;


    if (
        combined80C > 150000
    ) {

        addWarning(
            warnings,
            "80C_GROUP_LIMIT",
            "80C/80CCC/80CCD(1) combined claim exceeds ₹1.5 lakh; excess should be reviewed."
        );
    }


    const ccd1b =
        valNum(
            deductions.section80CCD1B
        );


    if (
        ccd1b > 50000
    ) {

        addWarning(
            warnings,
            "80CCD1B_LIMIT",
            "80CCD(1B) claim exceeds ₹50,000; excess should be reviewed."
        );
    }


    const section80TTA =
        valNum(
            deductions.section80TTA
        );


    if (
        section80TTA > 10000
    ) {

        addWarning(
            warnings,
            "80TTA_LIMIT",
            "80TTA claim exceeds ₹10,000."
        );
    }


    const section80TTB =
        valNum(
            deductions.section80TTB
        );


    if (
        section80TTB > 50000
    ) {

        addWarning(
            warnings,
            "80TTB_LIMIT",
            "80TTB claim exceeds ₹50,000."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// ITR VALIDATION
// =====================================================

function validateITR(data = {}) {

    const errors = [];
    const warnings = [];


    const itr =
        data.itr ||
        data.itrForm ||
        "";


    const hasBusiness =
        isTrue(data.hasBusinessIncome) ||
        isTrue(data.hasProfessionalIncome) ||
        isPositive(data.businessIncome) ||
        isPositive(data.professionIncome);


    const hasCapitalGains =
        isTrue(data.hasCapitalGains) ||
        isPositive(data.capitalGain) ||
        isPositive(data.shortTermCapitalGain) ||
        isPositive(data.longTermCapitalGain);


    if (
        itr === "ITR-1" &&
        hasBusiness
    ) {

        addError(
            errors,
            "ITR1_BUSINESS",
            "Business/profession income is inconsistent with ITR-1."
        );
    }


    if (
        itr === "ITR-1" &&
        hasCapitalGains
    ) {

        addError(
            errors,
            "ITR1_CAPITAL_GAIN",
            "Capital-gain information requires review before using ITR-1."
        );
    }


    if (
        itr === "ITR-2" &&
        hasBusiness
    ) {

        addWarning(
            warnings,
            "ITR2_BUSINESS",
            "Business/profession income generally requires ITR-3/ITR-4 applicability review."
        );
    }


    if (
        itr === "ITR-4" &&
        hasCapitalGains
    ) {

        addWarning(
            warnings,
            "ITR4_CAPITAL_GAIN",
            "Capital gains may affect ITR-4 eligibility; verify the exact nature of the gain."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// DOCUMENT / DATA COMPLETENESS
// =====================================================

function validateDocuments(data = {}) {

    const errors = [];
    const warnings = [];


    if (
        isTrue(data.hasSalaryIncome) &&
        !data.form16
    ) {

        addWarning(
            warnings,
            "FORM16_MISSING",
            "Form 16 details/document should be available for salary-income reconciliation."
        );
    }


    if (
        isTrue(data.hasBankInterest) &&
        !data.interestDetails
    ) {

        addWarning(
            warnings,
            "INTEREST_DETAILS_MISSING",
            "Bank/interest income details should be available."
        );
    }


    if (
        isTrue(data.hasCapitalGains) &&
        !data.capitalGains
    ) {

        addWarning(
            warnings,
            "CAPITAL_GAIN_DOCUMENTS",
            "Capital-gain transaction details should be available."
        );
    }


    return {
        errors,
        warnings
    };
}


// =====================================================
// MAIN VALIDATION ENGINE
// =====================================================

function validateTaxReturn(data = {}) {

    const allErrors = [];
    const allWarnings = [];


    const modules = [

        validateBasicInformation(data),

        validateRegime(data),

        validateIncome(data),

        validateBusiness(data),

        validateCapitalGains(data),

        validateHouseProperty(data),

        validateDeductions(data),

        validateITR(data),

        validateDocuments(data)
    ];


    for (
        const result
        of modules
    ) {

        allErrors.push(
            ...result.errors
        );

        allWarnings.push(
            ...result.warnings
        );
    }


    /*
      Remove duplicate messages.
    */

    const uniqueErrors =
        Array.from(
            new Map(
                allErrors.map(
                    item => [
                        item.code,
                        item
                    ]
                )
            ).values()
        );


    const uniqueWarnings =
        Array.from(
            new Map(
                allWarnings.map(
                    item => [
                        item.code,
                        item
                    ]
                )
            ).values()
        );


    return {

        valid:
            uniqueErrors.length === 0,

        errorCount:
            uniqueErrors.length,

        warningCount:
            uniqueWarnings.length,

        errors:
            uniqueErrors,

        warnings:
            uniqueWarnings,

        status:
            uniqueErrors.length > 0
                ? "ERROR"
                : uniqueWarnings.length > 0
                    ? "WARNING"
                    : "OK"
    };
}


// =====================================================
// SIMPLE USER MESSAGE
// =====================================================

function getValidationMessage(result) {

    if (
        !result
    ) {

        return "Validation result unavailable.";
    }


    if (
        result.status === "ERROR"
    ) {

        return (
            "Return cannot be finalized yet. " +
            result.errorCount +
            " error(s) need attention."
        );
    }


    if (
        result.status === "WARNING"
    ) {

        return (
            "Return information is mostly complete, " +
            "but " +
            result.warningCount +
            " item(s) should be reviewed."
        );
    }


    return (
        "No validation issues were detected."
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

        validateBasicInformation,

        validateRegime,

        validateIncome,

        validateBusiness,

        validateCapitalGains,

        validateHouseProperty,

        validateDeductions,

        validateITR,

        validateDocuments,

        validateTaxReturn,

        getValidationMessage
    };
}
