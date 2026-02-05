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
        From: process.env.FROM_EMAIL || 'khangtdce181439@fpt.edu.vn', // Must be a verified Sender Signature
        To: to,
        Subject: 'Xác thực tài khoản của bạn',
        HtmlBody: htmlBody,
        MessageStream: 'outbound' // Default stream
      },
      {
        headers: {
          'X-Postmark-Server-Token': process.env.SMTP_PASSWORD, // Using the token we stored here
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Verification email sent via Postmark API to:', to);
    console.log('Postmark Response:', response.data);

  } catch (error) {
    const postmarkError = error.response?.data;
    console.error('Error sending email via Postmark API:', postmarkError || error.message);
    
    // Construct a more detailed error message
    let errorMessage = 'Gửi email xác thực thất bại.';
    if (postmarkError && postmarkError.Message) {
      errorMessage += ` (Lỗi Postmark: ${postmarkError.Message})`;
    } else {
       errorMessage += ' Vui lòng thử lại sau.';
    }

    throw new Error(errorMessage);
  }
};

module.exports = {
  sendVerificationEmail
};
