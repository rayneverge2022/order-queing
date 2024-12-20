import express from 'express';
import { supabase } from '../../db/config.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_orders')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(data);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        console.log('Received order data:', req.body); // Log the incoming data
        const { job_order_id, customer_name, project_details, status } = req.body;
        
        const orderData = { 
            job_order_id,
            customer_name, 
            project_details, 
            status: status || 'received',
            created_at: new Date().toISOString()
        };
        console.log('Attempting to insert order:', orderData); // Log the data being inserted

        const { data, error } = await supabase
            .from('job_orders')
            .insert([orderData])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error); // Log any Supabase errors
            throw error;
        }
        console.log('Successfully created order:', data); // Log the created order
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
});

// Update order
router.put('/:id', async (req, res) => {
    try {
        const { job_order_id, customer_name, project_details } = req.body;
        const { data, error } = await supabase
            .from('job_orders')
            .update({ job_order_id, customer_name, project_details })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(data);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Update order status
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase
            .from('job_orders')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(data);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('job_orders')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

export default router;
