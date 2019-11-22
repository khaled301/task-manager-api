const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'khaledoffice301@gmail.com',
        subject: 'Welcome to SendGrid API testing using NodeJS',
        text: 'This is an nodejs email testing section'
    };

    sgMail.send(msg);
};

const sendCancelationEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'khaledoffice301@gmail.com',
        subject: 'Account deletion',
        text: `Good bye, ${name} Would you please help us to know why you are leaving and can we do anything to hold you back!`
    };

    sgMail.send(msg);
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
};
