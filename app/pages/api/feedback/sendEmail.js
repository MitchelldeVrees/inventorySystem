const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Load the service account key
const serviceAccountKey = require('../app/service-account-key.json');

// Function to create a transport for Nodemailer using Gmail API
async function createTransport() {
  const auth = new google.auth.JWT(
    serviceAccountKey.client_email,
    null,
    serviceAccountKey.private_key,
    ['https://www.googleapis.com/auth/gmail.send'] // Gmail API scope
  );

  await auth.authorize();

  const accessToken = await auth.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'mitchelldevries2001@gmail.com', // Replace with your Gmail address
      accessToken: accessToken.token,
      clientId: serviceAccountKey.client_id,
      clientSecret: serviceAccountKey.private_key_id,
      refreshToken: '', // Not needed for service accounts
    },
  });
}

// Function to send an email
async function sendEmail() {
    console.log("I am called")
  const transporter = await createTransport();

  const mailOptions = {
    from: 'mitchelldevries2001@gmail.com', // Replace with your Gmail address
    to: 'mitchelldevries2001@gmail.com',
    subject: 'Verification Email',
    text: 'This is a test email sent using the Gmail API with a service account.',
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Call the function to send an email
sendEmail();