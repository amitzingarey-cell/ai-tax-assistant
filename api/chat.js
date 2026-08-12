export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in Vercel."
      });
    }

    const {
      incomeType,
      income,
      homeLoan,
      insurance,
      investment,
      otherIncome
    } = req.body;

    if (!incomeType || !income) {
      return res.status(400).json({
        error: "Income type and annual income are required."
      });
    }

    const prompt = `
You are an Indian tax and ITR preparation assistant.

IMPORTANT RULE:
You must NEVER change, guess, calculate, or modify the user's supplied numbers.

The exact user information is:

Income Type: ${incomeType}
Annual Income: ₹${income}
Home Loan: ${homeLoan}
Health Insurance: ${insurance}
Investments: ${investment}
Other Income: ₹${otherIncome || 0}

Do NOT create a different income amount.

Your job is only to provide a preliminary checklist and general guidance.

Include:

1. Documents that may be required
2. Additional information needed
3. Possible tax-related considerations
4. Information needed for Old Regime vs New Regime comparison
5. Recommended next steps

If an amount is not provided, say "Amount not provided".

Do not invent deductions or tax amounts.

Do not claim to be a Chartered Accountant.

Do not provide final tax advice.
`;

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

    const response = await fetch(apiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "Never alter user-provided numbers. Never invent financial amounts."
            }
          ]
        },

        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "No response received from Gemini.";

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {

    console.error("Server Error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Internal server error."
    });
  }
}
