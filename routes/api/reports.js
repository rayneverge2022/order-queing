import express from 'express';
import { supabase } from '../../db/config.js';

const router = express.Router();

// Helper function to get status counts
async function getStatusCounts(orders) {
    const statusCounts = {
        received: 0,
        settings: 0,
        printing: 0,
        finishing: 0,
        releasing: 0,
        billing: 0,
        completed: 0
    };

    orders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
            statusCounts[order.status]++;
        }
    });

    return statusCounts;
}

// Get report summary
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Get daily orders
        const { data: dailyOrders, error: dailyError } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_void', false)
            .gte('created_at', startOfDay);

        if (dailyError) throw dailyError;

        // Get weekly orders
        const { data: weeklyOrders, error: weeklyError } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_void', false)
            .gte('created_at', startOfWeek);

        if (weeklyError) throw weeklyError;

        // Get monthly orders
        const { data: monthlyOrders, error: monthlyError } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_void', false)
            .gte('created_at', startOfMonth);

        if (monthlyError) throw monthlyError;

        // Get status counts for each time period
        const dailyStatusCounts = await getStatusCounts(dailyOrders || []);
        const weeklyStatusCounts = await getStatusCounts(weeklyOrders || []);
        const monthlyStatusCounts = await getStatusCounts(monthlyOrders || []);

        // Prepare response data
        const responseData = {
            daily: {
                total: dailyOrders?.length || 0,
                completed: dailyOrders?.filter(o => o.status === 'completed').length || 0,
                inProgress: dailyOrders?.filter(o => o.status !== 'completed').length || 0,
                statusCounts: dailyStatusCounts
            },
            weekly: {
                total: weeklyOrders?.length || 0,
                completed: weeklyOrders?.filter(o => o.status === 'completed').length || 0,
                inProgress: weeklyOrders?.filter(o => o.status !== 'completed').length || 0,
                statusCounts: weeklyStatusCounts
            },
            monthly: {
                total: monthlyOrders?.length || 0,
                completed: monthlyOrders?.filter(o => o.status === 'completed').length || 0,
                inProgress: monthlyOrders?.filter(o => o.status !== 'completed').length || 0,
                statusCounts: monthlyStatusCounts
            },
            statusBreakdown: await getStatusCounts(monthlyOrders || [])
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Export report data
router.get('/export', async (req, res) => {
    try {
        const { format } = req.query;
        const { data: orders, error } = await supabase
            .from('job_orders')
            .select('*')
            .eq('is_void', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // For now, just send the data as JSON
        res.json(orders);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

export default router;
