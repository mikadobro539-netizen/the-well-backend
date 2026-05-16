// =========================================================================
// ☁️ THE WELL BACKEND NODE SERVER (server.js)
// =========================================================================
const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: true })); // Permits frontend web calls without CORS failures

app.post("/register-subaccount", async (req, res) => {
    const { business_name, settlement_bank, account_number, percentage_charge } = req.body;

    // Guard rail parameters validation
    if (!business_name || !settlement_bank || !account_number) {
        return res.status(400).json({ error: "Missing essential payload configurations." });
    }

    const PAYSTACK_SECRET_KEY = "sk_test_72f0365f7441f25beee4d697f82d7b11efabf7a5"; 

    try {
        console.log(`Forwarding subaccount creation request to Paystack for: ${business_name}`);

        const response = await fetch("https://api.paystack.co/subaccount", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                business_name,
                settlement_bank,
                account_number,
                percentage_charge
            })
        });

        const resultData = await response.json();

        // Handle error responses directly from Paystack
        if (!response.ok || !resultData.status) {
            console.error("Paystack core API error response:", resultData);
            return res.status(400).json({ error: resultData.message || "Paystack integration configuration failed." });
        }

        console.log("✅ Subaccount successfully provisioned:", resultData.data.subaccount_code);
        
        // Pass the subaccount code back to the client browser layout
        return res.json({ subaccount_code: resultData.data.subaccount_code });

    } catch (error) {
        console.error("Internal processing channel failure:", error);
        return res.status(500).json({ error: "Internal background system gateway error." });
    }
});

// Use port assigned by host environment or fallback to 3000 for local workspace testing
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 The Well server engine running smoothly on port ${PORT}`));