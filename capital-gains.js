/*
  CAPITAL GAINS ENGINE
  AY 2026-27

  Handles:
  - Equity shares
  - Equity-oriented mutual funds
  - Other assets
  - Property
  - STCG
  - LTCG
  - Section 111A
  - Section 112
  - Section 112A
  - Transfer expenses
  - Capital losses
  - Basic loss classification

  IMPORTANT:
  This is a computation module.
  Final ITR filing must be validated against
  the applicable Income Tax Department utility/rules.
*/


// =====================================================
// HELPERS
// =====================================================

function cgNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return 0;
    }

    return number;
}


function cgRound(value) {

    return Math.round(
        cgNumber(value)
    );
}


// =====================================================
// ASSET TYPE
// =====================================================

const ASSET_TYPES = {

    EQUITY_111A:
        "EQUITY_111A",

    EQUITY_112A:
        "EQUITY_112A",

    OTHER_SECURITY:
        "OTHER_SECURITY",

    IMMOVABLE_PROPERTY:
        "IMMOVABLE_PROPERTY",

    OTHER_ASSET:
        "OTHER_ASSET"

};


// =====================================================
// HOLDING PERIOD
// =====================================================

function calculateHoldingPeriod(
    purchaseDate,
    saleDate
) {

    const purchase =
        new Date(purchaseDate);

    const sale =
        new Date(saleDate);


    if (
        Number.isNaN(purchase.getTime()) ||
        Number.isNaN(sale.getTime())
    ) {

        return {
            days: 0,
            months: 0,
            years: 0
        };

    }


    const difference =
        sale.getTime() -
        purchase.getTime();


    const days =
        Math.max(
            0,
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            )
        );


    const months =
        Math.floor(
            days / 30.4375
        );


    const years =
        months / 12;


    return {

        days,

        months,

        years
    };
}


// =====================================================
// CLASSIFY STCG / LTCG
// =====================================================

function classifyCapitalGain(
    assetType,
    purchaseDate,
    saleDate
) {

    const holding =
        calculateHoldingPeriod(
            purchaseDate,
            saleDate
        );


    /*
      Current-law holding periods can differ
      by asset category.

      For this first engine:
      - Listed equity / equity MF:
        > 12 months = LTCG
      - Immovable property:
        > 24 months = LTCG
      - Other assets:
        > 24 months = LTCG

      This classification layer can be expanded
      for special assets in the validation stage.
    */


    let longTerm = false;


    if (
        assetType ===
        ASSET_TYPES.EQUITY_111A ||

        assetType ===
        ASSET_TYPES.EQUITY_112A
    ) {

        longTerm =
            holding.months > 12;

    }

    else {

        longTerm =
            holding.months > 24;
    }


    return {

        type:
            longTerm
                ? "LTCG"
                : "STCG",

        holding
    };
}


// =====================================================
// BASIC CAPITAL GAIN
// =====================================================

function calculateBasicCapitalGain(data) {

    const saleValue =
        cgNumber(
            data.saleValue
        );


    const purchaseCost =
        cgNumber(
            data.purchaseCost
        );


    const improvementCost =
        cgNumber(
            data.improvementCost
        );


    const transferExpenses =
        cgNumber(
            data.transferExpenses
        );


    const netSaleValue =
        Math.max(
            0,
            saleValue -
            transferExpenses
        );


    const gain =
        netSaleValue -
        purchaseCost -
        improvementCost;


    return {

        saleValue,

        purchaseCost,

        improvementCost,

        transferExpenses,

        netSaleValue,

        capitalGain:
            cgRound(gain)
    };
}


// =====================================================
// EQUITY / 111A
// =====================================================

function calculateSection111A(data) {

    const basic =
        calculateBasicCapitalGain(
            data
        );


    const classification =
        classifyCapitalGain(
            ASSET_TYPES.EQUITY_111A,
            data.purchaseDate,
            data.saleDate
        );


    return {

        ...basic,

        section:
            "111A",

        gainType:
            classification.type,

        holdingPeriod:
            classification.holding,

        stcg111A:
            classification.type === "STCG"
                ? basic.capitalGain
                : 0,

        ltcg:
            classification.type === "LTCG"
                ? basic.capitalGain
                : 0
    };
}


// =====================================================
// EQUITY / 112A
// =====================================================

function calculateSection112A(data) {

    const basic =
        calculateBasicCapitalGain(
            data
        );


    const classification =
        classifyCapitalGain(
            ASSET_TYPES.EQUITY_112A,
            data.purchaseDate,
            data.saleDate
        );


    return {

        ...basic,

        section:
            "112A",

        gainType:
            classification.type,

        holdingPeriod:
            classification.holding,

        stcg:
            classification.type === "STCG"
                ? basic.capitalGain
                : 0,

        ltcg112A:
            classification.type === "LTCG"
                ? basic.capitalGain
                : 0
    };
}


// =====================================================
// IMMOVABLE PROPERTY
// =====================================================

function calculatePropertyGain(data) {

    const basic =
        calculateBasicCapitalGain(
            data
        );


    const classification =
        classifyCapitalGain(
            ASSET_TYPES.IMMOVABLE_PROPERTY,
            data.purchaseDate,
            data.saleDate
        );


    return {

        ...basic,

        section:
            "PROPERTY",

        gainType:
            classification.type,

        holdingPeriod:
            classification.holding,

        stcg:
            classification.type === "STCG"
                ? basic.capitalGain
                : 0,

        ltcg:
            classification.type === "LTCG"
                ? basic.capitalGain
                : 0
    };
}


// =====================================================
// OTHER ASSET
// =====================================================

function calculateOtherAssetGain(data) {

    const basic =
        calculateBasicCapitalGain(
            data
        );


    const classification =
        classifyCapitalGain(
            ASSET_TYPES.OTHER_ASSET,
            data.purchaseDate,
            data.saleDate
        );


    return {

        ...basic,

        section:
            "OTHER_ASSET",

        gainType:
            classification.type,

        holdingPeriod:
            classification.holding,

        stcg:
            classification.type === "STCG"
                ? basic.capitalGain
                : 0,

        ltcg:
            classification.type === "LTCG"
                ? basic.capitalGain
                : 0
    };
}


// =====================================================
// MULTIPLE CAPITAL-GAIN TRANSACTIONS
// =====================================================

function calculateCapitalGains(transactions = []) {

    let stcg111A = 0;

    let stcgOther = 0;

    let ltcg112A = 0;

    let ltcgOther = 0;


    let totalShortTermLoss = 0;

    let totalLongTermLoss = 0;


    const results = [];


    for (
        const transaction
        of transactions
    ) {

        let result;


        switch (
            transaction.assetType
        ) {

            case ASSET_TYPES.EQUITY_111A:

                result =
                    calculateSection111A(
                        transaction
                    );

                break;


            case ASSET_TYPES.EQUITY_112A:

                result =
                    calculateSection112A(
                        transaction
                    );

                break;


            case ASSET_TYPES.IMMOVABLE_PROPERTY:

                result =
                    calculatePropertyGain(
                        transaction
                    );

                break;


            default:

                result =
                    calculateOtherAssetGain(
                        transaction
                    );

                break;
        }


        results.push(result);


        const gain =
            cgNumber(
                result.capitalGain
            );


        if (
            result.gainType === "STCG"
        ) {

            if (
                result.section ===
                "111A"
            ) {

                if (gain >= 0) {

                    stcg111A += gain;

                }

                else {

                    totalShortTermLoss +=
                        Math.abs(gain);

                }

            }

            else {

                if (gain >= 0) {

                    stcgOther += gain;

                }

                else {

                    totalShortTermLoss +=
                        Math.abs(gain);

                }

            }

        }


        else {

            if (
                result.section ===
                "112A"
            ) {

                if (gain >= 0) {

                    ltcg112A += gain;

                }

                else {

                    totalLongTermLoss +=
                        Math.abs(gain);

                }

            }

            else {

                if (gain >= 0) {

                    ltcgOther += gain;

                }

                else {

                    totalLongTermLoss +=
                        Math.abs(gain);

                }

            }
        }
    }


    return {

        transactions: results,

        summary: {

            stcg111A:
                cgRound(stcg111A),

            stcgOther:
                cgRound(stcgOther),

            ltcg112A:
                cgRound(ltcg112A),

            ltcgOther:
                cgRound(ltcgOther),

            shortTermLoss:
                cgRound(totalShortTermLoss),

            longTermLoss:
                cgRound(totalLongTermLoss)
        }
    };
}


// =====================================================
// LOSS SET-OFF
// =====================================================

function calculateCapitalLossSetOff(summary) {

    let stcg111A =
        cgNumber(
            summary.stcg111A
        );


    let stcgOther =
        cgNumber(
            summary.stcgOther
        );


    let ltcg112A =
        cgNumber(
            summary.ltcg112A
        );


    let ltcgOther =
        cgNumber(
            summary.ltcgOther
        );


    let shortTermLoss =
        cgNumber(
            summary.shortTermLoss
        );


    let longTermLoss =
        cgNumber(
            summary.longTermLoss
        );


    /*
      Short-term capital loss can generally
      be adjusted against capital gains,
      subject to applicable provisions.
    */


    let remainingShortTermLoss =
        shortTermLoss;


    let adjustedLTCG =
        ltcg112A +
        ltcgOther;


    const shortLossAgainstLTCG =
        Math.min(
            remainingShortTermLoss,
            adjustedLTCG
        );


    adjustedLTCG -=
        shortLossAgainstLTCG;


    remainingShortTermLoss -=
        shortLossAgainstLTCG;


    let adjustedSTCG =
        stcg111A +
        stcgOther;


    const shortLossAgainstSTCG =
        Math.min(
            remainingShortTermLoss,
            adjustedSTCG
        );


    adjustedSTCG -=
        shortLossAgainstSTCG;


    remainingShortTermLoss -=
        shortLossAgainstSTCG;


    /*
      Long-term loss can be adjusted
      against long-term gains.
    */


    const longLossAgainstLTCG =
        Math.min(
            longTermLoss,
            adjustedLTCG
        );


    adjustedLTCG -=
        longLossAgainstLTCG;


    const remainingLongTermLoss =
        Math.max(
            0,
            longTermLoss -
            longLossAgainstLTCG
        );


    return {

        adjustedSTCG:
            cgRound(adjustedSTCG),

        adjustedLTCG:
            cgRound(adjustedLTCG),

        shortTermLossRemaining:
            cgRound(remainingShortTermLoss),

        longTermLossRemaining:
            cgRound(remainingLongTermLoss),

        shortLossAgainstSTCG:
            cgRound(shortLossAgainstSTCG),

        shortLossAgainstLTCG:
            cgRound(shortLossAgainstLTCG),

        longLossAgainstLTCG:
            cgRound(longLossAgainstLTCG)
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

        ASSET_TYPES,

        calculateHoldingPeriod,

        classifyCapitalGain,

        calculateBasicCapitalGain,

        calculateSection111A,

        calculateSection112A,

        calculatePropertyGain,

        calculateOtherAssetGain,

        calculateCapitalGains,

        calculateCapitalLossSetOff
    };
}
