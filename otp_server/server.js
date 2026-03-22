require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");

const app = express();
app.use(express.json());

// ENV
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

// SendGrid setup
sgMail.setApiKey(SENDGRID_API_KEY);

// MongoDB connect
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

// OTP Schema (TTL cleanup + exact expiry handled manually)
const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 59 // auto delete ~ after 59s (MongoDB TTL)
  }
});

const OTP = mongoose.model("OTP", otpSchema);

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Email
async function sendEmail(email, otp) {
  try {
    const response = await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`
    });

    console.log("EMAIL STATUS:", response[0].statusCode);
  } catch (err) {
    console.log("SENDGRID ERROR:", err.response?.body || err);
  }
}

// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.send("Email required ❌");

    const existing = await OTP.findOne({ email });

    // ⏳ Cooldown 30 sec
    if (existing) {
      const diff = (Date.now() - existing.createdAt) / 1000;

      if (diff < 30) {
        return res.send(`Wait ${Math.ceil(30 - diff)} sec ⏳`);
      }

      await OTP.deleteOne({ email });
    }

    const otp = generateOTP();
     console.log("OTP:", otp);
    await OTP.create({ email, otp });

    await sendEmail(email, otp);

    res.send("OTP sent ✅");

  } catch (err) {
  console.log("FULL ERROR:", err.response?.body || err.message || err);
  res.send("Error sending OTP ❌");
}
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.send("Invalid OTP ❌");
    }

    // ⏳ EXACT expiry check (59 sec)
    const diff = (Date.now() - record.createdAt) / 1000;

    if (diff > 59) {
      await OTP.deleteOne({ email });
      return res.send("OTP expired ⏳");
    }

    await OTP.deleteOne({ email });

    res.send("OTP verified ✅");

  } catch (err) {
    console.log(err);
    res.send("Error verifying OTP ❌");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});