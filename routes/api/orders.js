import express from 'express';
import { supabase } from '../../db/config.js';
import ExcelJS from 'exceljs'; // Import ExcelJS

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_hide', false)
            .eq('is_void', false)
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
        const { status, is_hide, is_void } = req.body;
        const updateData = {};
        
        // Add fields to update only if they are provided
        if (status !== undefined) updateData.status = status;
        if (is_hide !== undefined) updateData.is_hide = is_hide;
        if (is_void !== undefined) updateData.is_void = is_void;

        const { error } = await supabase
            .from('job_orders')
            .update(updateData)
            .eq('id', req.params.id);

        if (error) {
            console.error('Update error:', error);
            throw error;
        }

        // Just send success response
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order', details: error.message });
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

// Export orders
router.post('/export', async (req, res) => {
    try {
        const { status } = req.query;
        const orders = req.body;

        if (!orders || !Array.isArray(orders)) {
            return res.status(400).json({ error: 'Invalid orders data' });
        }

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');

        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Job Order ID', key: 'job_order_id', width: 15 },
            { header: 'Customer', key: 'customer_name', width: 20 },
            { header: 'Details', key: 'project_details', width: 30 },
            { header: 'Created At', key: 'created_at', width: 20 }
        ];

        // Add data
        orders.forEach(order => {
            worksheet.addRow({
                id: order.id,
                job_order_id: order.job_order_id || '',
                customer_name: order.customer_name,
                project_details: order.project_details,
                created_at: new Date(order.created_at).toLocaleString()
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=orders_${status}_${new Date().toISOString()}.xlsx`);
        
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ error: 'Failed to export to Excel' });
    }
});

export default router;
