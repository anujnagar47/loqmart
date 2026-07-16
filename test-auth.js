const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log("Testing Email Registration & Login...");
  
  // 1. Sign up a test user
  const email = `testuser_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("❌ Sign Up Failed:", signUpError.message);
  } else {
    console.log("✅ Sign Up Succeeded for:", email);
    
    // 2. Sign In the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("❌ Sign In Failed:", signInError.message);
    } else {
      console.log("✅ Sign In Succeeded!");
      console.log("Access Token received:", signInData.session.access_token.substring(0, 20) + "...");
    }
  }
}

testAuth();
