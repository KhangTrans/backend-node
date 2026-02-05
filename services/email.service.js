const nodemailer = require('nodemailer');

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
    // Configure Postmark SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.postmarkapp.com', // Postmark SMTP Server
      port: 587,
      secure: false, // TLS
      auth: {
        // Postmark requires API Token as both username and password
        // We will misuse SMTP_PASSWORD env var to store this Token
        user: process.env.SMTP_PASSWORD, 
        pass: process.env.SMTP_PASSWORD
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
