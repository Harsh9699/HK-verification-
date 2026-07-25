const nodemailer = require('nodemailer');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing EMAIL_USER or EMAIL_PASS in Netlify environment variables.' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, studentName, courseTitle, verifyUrl } = body;

    if (!email || !studentName || !verifyUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px; border-radius: 8px;">
        <h1 style="color: #0f172a; text-align: center;">Congratulations, ${studentName}! 🎉</h1>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center;">
          You have successfully completed <strong>${courseTitle || 'the course'}</strong>. We are thrilled to issue your official certificate of completion!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Your Certificate</a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          You can share this secure link on LinkedIn or with employers to verify your achievement.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} HK Workshop. All rights reserved.
        </p>
      </div>
    `;

    // Create a Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"HK Workshop" <${EMAIL_USER}>`,
      to: email,
      subject: `Your Certificate for ${courseTitle || 'completion'} is ready!`,
      html: htmlContent
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: info.messageId }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
