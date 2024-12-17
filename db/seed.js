import { supabase } from './config.js';

const sampleOrders = [
  {
    customer_name: 'John Doe',
    project_details: 'Business Card Design - 500pcs',
    status: 'received'
  },
  {
    customer_name: 'Jane Smith',
    project_details: 'Wedding Invitation Cards - 200pcs',
    status: 'printing'
  },
  {
    customer_name: 'Acme Corp',
    project_details: 'Company Brochures - 1000pcs',
    status: 'packaging'
  },
  {
    customer_name: 'Tech Startup',
    project_details: 'Marketing Flyers - 2000pcs',
    status: 'completed'
  }
];

async function seedDatabase() {
  for (const order of sampleOrders) {
    const { error } = await supabase
      .from('job_orders')
      .insert(order);
    
    if (error) {
      console.error('Error inserting order:', error);
      continue;
    }
  }
  console.log('Database seeded successfully');
}

// Run seeding
seedDatabase();
