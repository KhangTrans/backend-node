const axios = require('axios');

const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  // Postmark API Endpoint
  const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';
  
  // Construct the email body
  const htmlBody = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Chào mừng bạn đến với chúng tôi!</h2>
      <p>Cảm ơn bạn đã đăng ký. Vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Xác thực Email</a>
      <p>Hoặc copy đường dẫn này vào trình duyệt của bạn:</p>
      <p>${verificationUrl}</p>
      <p>Link này sẽ hết hạn sau 5 phút.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      POSTMARK_API_URL,
      {
        From: process.env.FROM_EMAIL || 'khangtdce181439@fpt.edu.vn', 
        To: to,
        Subject: 'Xác thực tài khoản của bạn',
        HtmlBody: htmlBody,
        MessageStream: 'outbound'
      },
      {
        headers: {
          'X-Postmark-Server-Token': process.env.SMTP_PASSWORD, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Verification email sent via Postmark API to:', to);
  } catch (error) {
    const postmarkError = error.response?.data;
    console.error('Error sending email via Postmark API:', postmarkError || error.message);
    
    let errorMessage = 'Gửi email xác thực thất bại.';
    if (postmarkError && postmarkError.Message) {
      errorMessage += ` (Lỗi Postmark: ${postmarkError.Message})`;
    } else {
       errorMessage += ' Vui lòng thử lại sau.';
    }

    throw new Error(errorMessage);
  }
};

const sendResetPasswordOTP = async (to, otp) => {
  const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';
  
  // Construct the email body với OTP
  const htmlBody = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Đặt lại mật khẩu</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Mã OTP của bạn là:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
        <h1 style="color: #007bff; margin: 0; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
      </div>
      <p>Mã OTP này sẽ hết hạn sau <strong>10 phút</strong>.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      POSTMARK_API_URL,
      {
        From: process.env.FROM_EMAIL || 'khangtdce181439@fpt.edu.vn', 
        To: to,
        Subject: 'Mã OTP đặt lại mật khẩu',
        HtmlBody: htmlBody,
        MessageStream: 'outbound'
      },
      {
        headers: {
          'X-Postmark-Server-Token': process.env.SMTP_PASSWORD, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Reset password OTP email sent via Postmark API to:', to);
  } catch (error) {
    const postmarkError = error.response?.data;
    console.error('Error sending OTP email via Postmark API:', postmarkError || error.message);
    
    let errorMessage = 'Gửi email OTP thất bại.';
    if (postmarkError && postmarkError.Message) {
      errorMessage += ` (Lỗi Postmark: ${postmarkError.Message})`;
    } else {
       errorMessage += ' Vui lòng thử lại sau.';
    }

    throw new Error(errorMessage);
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordOTP
};
