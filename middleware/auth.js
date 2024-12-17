import { supabase } from '../db/config.js';

export const requireAuth = async (req, res, next) => {
    const token = req.cookies['sb-access-token'];
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            res.clearCookie('sb-access-token');
            return res.redirect('/login');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.clearCookie('sb-access-token');
        return res.redirect('/login');
    }
};
