require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const JWT_AUTH_TOKEN = process.env.JWT_AUTH_TOKEN;
const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN;
const smsKey = process.env.SMS_SECRET_KEY;
const client = require("twilio")(accountSid, authToken);
const app = express();

app.use(express.json());

app.post("/sendOTP", (req, res) => {
    const phone = req.body.phone;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const ttl = 2 * 60 * 1000;
    const expires = Date.now() + ttl;
    const data = `${phone}.${otp}.${expires}`;
    const hash = crypto.createHmac("sha256", smsKey).update(data).digest("hex");
    const fullhash = `${hash}.${expires}`;

    client.messages
        .create({
            body: `Your otp code is ${otp}`,
            from: +12766336725,
            to: phone,
        })
        .then((message) => console.log(message))
        .catch((err) => console.error(err));

    res.status(200).send({phone, hash: fullhash, otp});
});

app.post("/verifyOTP", (req, res) => {
    const {phone, hash, otp} = req.body;
    let [hashValue, expires] = hash.split(".");
    // console.log(typeof hash);
    let now = Date.now();
    if (now > parseInt(expires)) {
        return res.status(504).send({msg: "Timeout pls try again"});
    }

    const data = `${phone}.${otp}.${expires}`;
    const newCalculatedHash = crypto.createHmac("sha256", smsKey).update(data).digest("hex");

    if (newCalculatedHash === hashValue) {
        return res.status(202).send({msg: "User confirmed"});
    } else {
        return res.status(400).send({verification: false, msg: "Incorrect OTP"});
    }
});

app.listen(3000, () => {
    console.log(`Sms Otp app | Listening att http://localhost:3000`);
});
