import dotenv from 'dotenv';
import twilio from 'twilio';
dotenv.config({
    path: './.env'
});

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = new twilio(accountSid, authToken)

const sendVerificationSms = async(otp , phoneNumber)=>{
    await twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
    });
}

export default sendVerificationSms