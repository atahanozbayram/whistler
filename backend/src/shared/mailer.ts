import nodemailer from "nodemailer";

const email_user = process.env.EMAIL_USER;
const email_password = process.env.EMAIL_PASS;

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
	host: "smtp-mail.outlook.com",
	auth: { user: email_user, pass: email_password },
});

export { transporter };
