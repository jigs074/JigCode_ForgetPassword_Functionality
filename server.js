const express = require('express');
const { Server } = require('ws');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config({ path: './EmailCreds.env' });

const app = express();
app.set('view engine', 'ejs')
 
const server = require('http').createServer(app);

app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

// Store OTPs in memory (for demonstration purposes; consider using a database for production)
const otpStore = new Map();
app.get('/', (req, res) => {
    res.render('forgot-password');
});


app.get('/verify-otp', (req, res)=> {
    res.render('verify-otp'); 
 });  



app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log('Email : ', email);
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store the OTP with the user's email
    otpStore.set(email, otp);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email: ', error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ', info.response);
            res.redirect('/verify-otp'); 
        }
    });
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    const storedOtp = otpStore.get(email);

    if (storedOtp && storedOtp === otp) {
        // OTP is correct
        otpStore.delete(email); // Remove the OTP after verification
        res.status(200).send('OTP verified');
    } else {
        // OTP is incorrect
        res.status(400).send('Invalid OTP');
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
 