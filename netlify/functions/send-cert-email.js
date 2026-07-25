exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing RESEND_API_KEY' }) };
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

    // Resend requires a verified domain in the 'from' field. We'll use 'onboarding@resend.dev' for testing, 
    // or they can use their own domain once verified on Resend.
    const resendReq = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'HK Workshop <onboarding@resend.dev>',
        to: [email],
        subject: `Your Certificate for ${courseTitle || 'completion'} is ready!`,
        html: htmlContent
      })
    });

    const resendRes = await resendReq.json();

    if (!resendReq.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Resend API Error: ' + JSON.stringify(resendRes) }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, data: resendRes }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
