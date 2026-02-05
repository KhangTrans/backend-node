const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to,
    subject: 'Xác thực tài khoản của bạn',
    html: `
      <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Chào mừng bạn đến với chúng tôi!</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Xác thực Email</a>
        <p>Hoặc copy đường dẫn này vào trình duyệt của bạn:</p>
        <p>${verificationUrl}</p>
        <p>Link này sẽ hết hạn sau 5 phút.</p>
      </div>
    `
  };

  try {
    // Manually resolve IPv4 address to avoid ENETUNREACH on IPv6-enabled servers
    const addresses = await dns.resolve4('smtp.gmail.com');
    const gmailIp = addresses[0];
    console.log(`Resolved Gmail SMTP IPv4: ${gmailIp}`);

    const transporter = nodemailer.createTransport({
      host: gmailIp, // Connect to IP directly
      port: 465, // Try Port 465 again with IPv4
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
      },
      // Increase timeouts for cloud environments
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 10000      // 10 seconds
    });

    await transporter.sendMail(message);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = {
  sendVerificationEmail
};
