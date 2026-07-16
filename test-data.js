const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSeedData() {
  console.log("Checking seed data...");
  
  const { data: users } = await supabase.from('users').select('email, full_name');
  console.log(`\nUsers (${users?.length || 0}):`, users);

  const { data: cats } = await supabase.from('categories').select('name, slug');
  console.log(`\nCategories (${cats?.length || 0}):`, cats);

  const { data: products } = await supabase.from('products').select('name, price');
  console.log(`\nProducts (${products?.length || 0}):`, products);

  const { data: blogs } = await supabase.from('blog_posts').select('title, slug');
  console.log(`\nBlog Posts (${blogs?.length || 0}):`, blogs);
}

testSeedData();
