import express from 'express';
import { supabase } from '../../db/config.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

// Get user settings
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;

        res.json(data || {
            email_notifications: false,
            email_address: req.user.email,
            orders_per_page: 5,
            dark_mode: false,
            refresh_interval: 0
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update user settings
router.post('/', requireAuth, async (req, res) => {
    try {
        const settings = {
            user_id: req.user.id,
            email_notifications: req.body.email_notifications,
            email_address: req.body.email_address,
            orders_per_page: req.body.orders_per_page,
            dark_mode: req.body.dark_mode,
            refresh_interval: req.body.refresh_interval,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_settings')
            .upsert(settings)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;
