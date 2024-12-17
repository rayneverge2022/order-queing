import { supabase } from './config.js';

async function createTables() {
  try {
    const { error } = await supabase
      .from('job_orders')
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase
        .from('job_orders')
        .insert([
          {
            customer_name: 'Test Customer',
            project_details: 'Test Project',
            status: 'received'
          }
        ]);

      if (createError) {
        console.error('Error creating table:', createError);
        return;
      }
      console.log('Table created successfully');
    } else {
      console.log('Table already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run migration
createTables();
