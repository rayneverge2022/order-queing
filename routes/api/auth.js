import express from 'express';
import { supabase } from '../../db/config.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt started:', { 
            email: req.body.email,
            headers: req.headers,
            origin: req.get('origin'),
            host: req.get('host')
        });
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.error('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log('Attempting Supabase auth...');
        let authResponse;
        try {
            authResponse = await supabase.auth.signInWithPassword({
                email,
                password
            });
        } catch (authError) {
            console.error('Supabase auth threw error:', {
                message: authError.message,
                name: authError.name,
                stack: authError.stack,
                details: authError.details,
                originalError: authError.originalError
            });
            return res.status(500).json({ 
                error: 'Authentication failed',
                message: authError.message,
                details: process.env.NODE_ENV === 'development' ? authError : undefined
            });
        }

        const { data, error } = authResponse;

        if (error) {
            console.error('Supabase auth returned error:', error);
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }

        if (!data || !data.session) {
            console.error('No session data returned:', { data });
            return res.status(500).json({ error: 'No session data returned' });
        }

        console.log('Login successful, setting cookies...');
        
        try {
            // Set the access token in a cookie
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: true, // Always use secure cookies with ngrok
                sameSite: 'none', // Required for cross-site cookies
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Set refresh token if available
            if (data.session.refresh_token) {
                res.cookie('sb-refresh-token', data.session.refresh_token, {
                    httpOnly: true,
                    secure: true, // Always use secure cookies with ngrok
                    sameSite: 'none', // Required for cross-site cookies
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }
        } catch (cookieError) {
            console.error('Error setting cookies:', cookieError);
            return res.status(500).json({ 
                error: 'Failed to set authentication cookies',
                message: cookieError.message,
                details: process.env.NODE_ENV === 'development' ? cookieError : undefined
            });
        }

        console.log('Cookies set, sending response...');
        res.json({ 
            message: 'Logged in successfully',
            user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role
            }
        });
    } catch (error) {
        console.error('Unexpected error during login:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            details: error.details
        });
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// Logout route
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error during logout:', error);
            throw error;
        }

        // Clear the cookies
        res.clearCookie('sb-access-token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.clearCookie('sb-refresh-token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Failed to logout',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// Get current user
router.get('/user', async (req, res) => {
    try {
        const token = req.cookies['sb-access-token'];
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;

        res.json(user);
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Not authenticated' });
    }
});

export default router;
