// Run this script using Node.js v18+ (which has native fetch support)
// Example: SUPABASE_URL=... SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... SITE_URL=... node tests/smoke-test.js

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hdjfodduhlmrmphaxsjj.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_YnubDZntig72f8Ge_7mQwQ_gVS-tZzq";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SITE_URL = process.env.SITE_URL || "https://hkcerts.netlify.app";

async function runSmokeTest() {
  console.log("🚀 Starting HK Workshop Smoke Test");

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  try {
    // 1. Log in as admin
    console.log("1. Authenticating as Admin...");
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (!loginRes.ok) throw new Error("Admin login failed");
    const loginData = await loginRes.json();
    const adminToken = loginData.access_token;
    console.log("   ✅ Admin authenticated");

    // 2. Create test student via Netlify Function
    console.log("2. Creating test student via Netlify Function...");
    const testEmail = `test_student_${Date.now()}@example.com`;
    const createRes = await fetch(`${SITE_URL}/.netlify/functions/create-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminToken: adminToken,
        fullName: "Automated Test Student",
        email: testEmail,
        password: "testpassword123",
        courseTitle: "AI Tools for Everyone"
      })
    });
    if (!createRes.ok) throw new Error("Student creation failed");
    const createData = await createRes.json();
    const testStudentId = createData.id;
    console.log("   ✅ Test student created: " + testStudentId);

    // 3. Generate certificate for test student
    console.log("3. Generating certificate...");
    const testCertId = "TEST-CERT-" + Date.now();
    const certRes = await fetch(`${SUPABASE_URL}/rest/v1/certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + adminToken,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        cert_id: testCertId,
        student_name: "Automated Test Student",
        course_title: "AI Tools for Everyone",
        skills: "Automated Testing, CI/CD",
        completion_date: new Date().toISOString().split('T')[0],
        student_id: testStudentId,
        qr_base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" // dummy pixel
      })
    });
    if (!certRes.ok) throw new Error("Certificate creation failed");
    console.log("   ✅ Certificate generated: " + testCertId);

    // 4. Verify certificate via public endpoint
    console.log("4. Verifying certificate public fetch...");
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/certificates?cert_id=eq.${testCertId}&select=*`, {
      headers: { "apikey": SUPABASE_ANON_KEY }
    });
    if (!verifyRes.ok) throw new Error("Certificate verify fetch failed");
    const verifyData = await verifyRes.json();
    if (!verifyData || verifyData.length === 0 || verifyData[0].cert_id !== testCertId) {
      throw new Error("Certificate data mismatch on verify");
    }
    console.log("   ✅ Certificate verified successfully");

    // 5. Clean up (Deactivate the student via REST to avoid breaking constraints, and delete cert)
    console.log("5. Cleaning up test data...");
    await fetch(`${SUPABASE_URL}/rest/v1/certificates?cert_id=eq.${testCertId}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer " + adminToken }
    });
    
    await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${testStudentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer " + adminToken },
      body: JSON.stringify({ active: false })
    });
    console.log("   ✅ Cleanup complete");

    console.log("🎉 All smoke tests passed successfully!");

  } catch (error) {
    console.error("❌ Smoke Test Failed:", error.message);
    process.exit(1);
  }
}

runSmokeTest();
