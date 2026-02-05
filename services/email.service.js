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
    // Resolve IPv4 for Postmark
    const addresses = await dns.resolve4('smtp.postmarkapp.com');
    const postmarkIp = addresses[0];
    console.log('Postmark IPv4:', postmarkIp);

    // Configure Postmark SMTP
    const transporter = nodemailer.createTransport({
      host: postmarkIp, 
      port: 587,
      secure: false, // TLS
      auth: {
        // Postmark requires API Token as both username and password
        // We will misuse SMTP_PASSWORD env var to store this Token
        user: process.env.SMTP_PASSWORD, 
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        servername: 'smtp.postmarkapp.com' // Explicitly set servername for TLS SNI
      }
    });

    await transporter.sendMail(message);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Gửi email xác thực thất bại. Vui lòng thử lại sau.');
  }
};

module.exports = {
  sendVerificationEmail
};
