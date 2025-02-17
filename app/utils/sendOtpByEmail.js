const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { Email, EmailPassword } = require('../config/config');

const sendMail = async (to, subject, otp) => {
    // Read the predefined email template
    const templatePath = path.join(__dirname, '../templates', 'EmailTemplate.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual values 
    htmlTemplate = htmlTemplate.replace('{{OTP}}', otp);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: Email,
            pass: EmailPassword
        }
    });

    let mailOptions = {
        from: {
            name: "Fabric Bazar",
            address: Email
        },
        to: to,
        subject: subject,
        html: htmlTemplate  // Sending the formatted HTML email
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

module.exports = { sendMail };
