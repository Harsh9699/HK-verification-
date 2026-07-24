// This runs on Netlify's server, NEVER in the browser.
// It is the only place the secret service_role key is ever used.

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const body = JSON.parse(event.body);
    const { adminToken, fullName, email, password, courseTitle } = body;

    if (!adminToken || !fullName || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // 1. Verify the caller is actually the logged-in admin (not just anyone hitting this function)
    const whoRes = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + adminToken
      }
    });
    const whoData = await whoRes.json();
    if (!whoRes.ok || !whoData || (whoData.app_metadata && whoData.app_metadata.role) !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized — admin only' }) };
    }

    // 2. Create the student's login using the admin API (needs service_role key)
    const createRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true,
        app_metadata: { role: 'student' }
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: createData.msg || createData.error_description || JSON.stringify(createData) }) };
    }

    const newUserId = createData.id;

    // 3. Create their profile row in the students table
    const profileRes = await fetch(SUPABASE_URL + '/rest/v1/students', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: newUserId,
        full_name: fullName,
        email: email,
        course_title: courseTitle || 'AI Tools for Everyone'
      })
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.json();
      return { statusCode: 400, body: JSON.stringify({ error: 'User created but profile failed: ' + JSON.stringify(profileErr) }) };
    }

    // 4. Create 6 blank session rows for progress tracking
    const sessions = [];
    for (let i = 1; i <= 6; i++) {
      sessions.push({ student_id: newUserId, session_number: i, attended: false });
    }
    await fetch(SUPABASE_URL + '/rest/v1/session_progress', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sessions)
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, studentId: newUserId }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
