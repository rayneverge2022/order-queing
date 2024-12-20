import express from 'express';
import { supabase } from '../../db/config.js';

const router = express.Router();

// Get all job orders (public)
router.get('/orders', async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_hide', false)
            .eq('is_void', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single job order (public)
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: order, error } = await supabase
            .from('job_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

export default router;
