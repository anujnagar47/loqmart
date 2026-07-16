import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azwrehborbnfkigsappg.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6d3JlaGJvcmJuZmtpZ3NhcHBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg4NDYyOSwiZXhwIjoyMDkxNDYwNjI5fQ.wLrwFpFJep1SLi32CmxUYY3yr27hGYS8-FiSUduhQOE';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false }
});

async function createAdminUser() {
  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@loqmart.com',
      password: 'loqmart123',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (authError) {
      console.error('Auth error:', authError.message);
      return;
    }

    console.log('Admin user created:', authData.user.id);

    // Update user role in users table
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: 'admin@loqmart.com',
        full_name: 'Admin',
        role: 'admin',
        email_verified: true
      }, { onConflict: 'email' });

    if (updateError) {
      console.error('Update error:', updateError.message);
    } else {
      console.log('Admin user role set to admin');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

createAdminUser();