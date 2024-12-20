import express from 'express';
import { supabase } from './db/config.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import cookieParser from 'cookie-parser';
import ordersRouter from './routes/api/orders.js';
import settingsRouter from './routes/api/settings.js';
import authRouter from './routes/api/auth.js';
import publicRouter from './routes/api/public.js';
import reportsRouter from './routes/api/reports.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Define allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://order-queing.onrender.com']
  : ['http://localhost:3001', 'http://localhost:3002', /\.ngrok\.io$/, /\.ngrok-free\.app$/];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    console.log('Request origin:', origin);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any of our allowed origins (including regex patterns)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (!isAllowed) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Auth Routes
app.use('/api/auth', authRouter);

// Public API Routes
app.use('/api/public', publicRouter);

// Protected API Routes
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/reports', requireAuth, reportsRouter);

// Public Routes
app.get('/', (req, res) => {
  res.render('client/orders');
});

app.get('/login', (req, res) => {
  res.render('auth/login');
});

// Protected Routes
app.get('/admin', requireAuth, (req, res) => {
  res.render('admin/index');
});

app.get('/admin/status-overview', requireAuth, (req, res) => {
  res.render('admin/status-overview');
});

app.get('/admin/dashboard', requireAuth, (req, res) => {
  res.render('admin/dashboard');
});

app.get('/admin/reports', requireAuth, (req, res) => {
  res.render('admin/reports');
});

app.get('/admin/settings', requireAuth, (req, res) => {
  res.render('admin/settings');
});

// Reporting Endpoints
app.get('/api/reports/summary', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('job_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate daily, weekly, and monthly stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const stats = {
      daily: {
        total: 0,
        completed: 0,
        inProgress: 0
      },
      weekly: {
        total: 0,
        completed: 0,
        inProgress: 0
      },
      monthly: {
        total: 0,
        completed: 0,
        inProgress: 0
      },
      averageCompletionTime: 0,
      statusBreakdown: {
        received: 0,
        printing: 0,
        packaging: 0,
        completed: 0
      }
    };

    let totalCompletionTime = 0;
    let completedOrders = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      
      // Status breakdown
      stats.statusBreakdown[order.status]++;

      // Calculate completion time for completed orders
      if (order.status === 'completed') {
        const completionTime = new Date(order.updated_at) - new Date(order.created_at);
        totalCompletionTime += completionTime;
        completedOrders++;
      }

      // Daily stats
      if (orderDate >= today) {
        stats.daily.total++;
        if (order.status === 'completed') {
          stats.daily.completed++;
        } else {
          stats.daily.inProgress++;
        }
      }

      // Weekly stats
      if (orderDate >= lastWeek) {
        stats.weekly.total++;
        if (order.status === 'completed') {
          stats.weekly.completed++;
        } else {
          stats.weekly.inProgress++;
        }
      }

      // Monthly stats
      if (orderDate >= lastMonth) {
        stats.monthly.total++;
        if (order.status === 'completed') {
          stats.monthly.completed++;
        } else {
          stats.monthly.inProgress++;
        }
      }
    });

    // Calculate average completion time in hours
    stats.averageCompletionTime = completedOrders > 0 
      ? Math.round(totalCompletionTime / completedOrders / (1000 * 60 * 60)) 
      : 0;

    res.json(stats);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/export', async (req, res) => {
  try {
    const { format } = req.query;
    const { data: orders, error } = await supabase
      .from('job_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      const csv = Papa.unparse(orders);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      // Add headers
      worksheet.columns = [
        { header: 'Order ID', key: 'id' },
        { header: 'Customer Name', key: 'customer_name' },
        { header: 'Project Details', key: 'project_details' },
        { header: 'Status', key: 'status' },
        { header: 'Created At', key: 'created_at' },
        { header: 'Updated At', key: 'updated_at' }
      ];

      // Add rows
      worksheet.addRows(orders);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
      
      return workbook.xlsx.write(res);
    }

    res.status(400).json({ error: 'Invalid format specified' });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { data: orders, error } = await supabase
      .from('job_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reportData = orders.map(order => ({
      'Order ID': order.id,
      'Customer Name': order.customer_name,
      'Project Details': order.project_details,
      'Status': order.status,
      'Created At': new Date(order.created_at).toLocaleString(),
      'Updated At': new Date(order.updated_at).toLocaleString(),
      'Time Taken (hours)': order.status === 'completed' 
        ? Math.round((new Date(order.updated_at) - new Date(order.created_at)) / (1000 * 60 * 60))
        : 'In Progress'
    }));

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_report.csv');
        const csv = Papa.unparse(reportData);
        res.send(csv);
        break;

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders Report');
        
        // Add headers
        worksheet.columns = Object.keys(reportData[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));

        // Add rows
        worksheet.addRows(reportData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');
        await workbook.xlsx.write(res);
        break;

      default:
        res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});