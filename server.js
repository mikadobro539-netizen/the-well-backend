// =========================================================================
// ☁️ THE WELL BACKEND NODE SERVER WITH EMAIL & SMS GATEWAYS (server.js)
// =========================================================================
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: true }));

// 🔑 CONFIGURING YOUR GMAIL ENGINE
const SENDER_EMAIL = "mikadobro539@gmail.com"; 
const SENDER_APP_PASSWORD = "ynfm yuxp hgsn eoip"; 

// 🔑 CONFIGURING YOUR ARKESEL SMS ENGINE
const ARKESEL_API_KEY = "WlN6UVZBdXJrTUpPamdBdURucXo";
const ARKESEL_SENDER_ID = "TheWell"; // Max 11 characters alphabetic

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_APP_PASSWORD
    }
});

// --- 📡 ENDPOINT 1: PAYSTACK SUBACCOUNT GATEWAY ---
app.post("/register-subaccount", async (req, res) => {
    const { business_name, settlement_bank, account_number, percentage_charge } = req.body;

    if (!business_name || !settlement_bank || !account_number) {
        return res.status(400).json({ error: "Missing essential payload configurations." });
    }

    // ✅ Match your variable casing perfectly
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    try {
        console.log(`Forwarding subaccount creation request to Paystack for: ${business_name}`);
        const response = await fetch("https://api.paystack.co/subaccount", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${paystackSecretKey}`, // ✅ Corrected variable
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ business_name, settlement_bank, account_number, percentage_charge })
        });

        const resultData = await response.json();

        if (!response.ok || !resultData.status) {
            console.error("Paystack core API error response:", resultData);
            return res.status(400).json({ error: resultData.message || "Paystack integration configuration failed." });
        }

        console.log("✅ Subaccount successfully provisioned:", resultData.data.subaccount_code);
        return res.json({ subaccount_code: resultData.data.subaccount_code });

    } catch (error) {
        console.error("Internal processing channel failure:", error);
        return res.status(500).json({ error: "Internal background system gateway error." });
    }
});

// --- 📡 ENDPOINT 2: AUTOMATED EMAIL RECEIPTS ---
app.post("/send-email", async (req, res) => {
    const { recipient_email, subject, heading, body_text } = req.body;

    if (!recipient_email || !subject || !body_text) {
        return res.status(400).json({ error: "Missing email destination parameters." });
    }

    const htmlLayout = `
        <div style="font-family: sans-serif; background-color: #0f172a; padding: 40px; color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px;">
            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: 2px;">THE WELL</h1>
                <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 5px 0 0 0;">Community Ecosystem</p>
            </div>
            <div style="padding: 10px 0;">
                <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 15px;">${heading || "Notification Update"}</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-line;">${body_text}</p>
            </div>
            <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 11px;">
                <p>This is an automated system receipt from your room space.</p>
                <p style="color: #475569;">&copy; 2026 The Well. All rights reserved.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"The Well" <${SENDER_EMAIL}>`,
        to: recipient_email,
        subject: subject,
        html: htmlLayout
    };

    try {
        console.log(`Sending automated email alert to: ${recipient_email}`);
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully!");
        return res.json({ success: true, message: "Email transmitted smoothly." });
    } catch (error) {
        console.error("❌ NODEMAILER CRASH ERROR:", error);
        return res.status(500).json({ error: "Failed to broadcast email over the network." });
    }
});

// --- 📡 ENDPOINT 3: AUTOMATED ARKESEL SMS GATEWAY ---
app.post("/send-sms", async (req, res) => {
    const { phone_number, message_text } = req.body;

    if (!phone_number || !message_text) {
        return res.status(400).json({ error: "Missing phone number or message content." });
    }

    // Standardize Ghanaian numbers to international format (e.g., 0541234567 -> 233541234567)
    let formattedPhone = phone_number.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith("0")) {
        formattedPhone = "233" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.substring(1);
    }

    try {
        console.log(`Initiating Arkesel SMS routing payload to: ${formattedPhone}`);
        
        const smsUrl = `https://sms.arkesel.com/api/v2/sms/send?key=${ARKESEL_API_KEY}&to=${formattedPhone}&msg=${encodeURIComponent(message_text)}&sender=${ARKESEL_SENDER_ID}`;
        
        const response = await fetch(smsUrl, { method: "GET" });
        const resultData = await response.json();

        // Arkesel usually returns a status text or code 100 for success
        if (resultData.status === "success" || resultData.code === 100) {
            console.log("✅ SMS broadcast complete across Ghana telco grids!");
            return res.json({ success: true, data: resultData });
        } else {
            console.error("Arkesel gateway rejected transmission payload:", resultData);
            return res.status(400).json({ error: resultData.message || "SMS delivery rejected by carrier." });
        }

    } catch (error) {
        console.error("❌ ARKESEL GATEWAY CRASH ERROR:", error);
        return res.status(500).json({ error: "Internal SMS service communication breakdown." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 The Well server engine running smoothly on port ${PORT}`));