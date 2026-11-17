import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import all route modules
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patients.routes';
import doctorRoutes from './routes/doctors.routes';
import availabilityRoutes from './routes/availability.routes';
import appointmentRoutes from './routes/appointments.routes';
import prescriptionRoutes from './routes/prescriptions.routes';
import medicineRoutes from './routes/medicines.routes';
import billRoutes from './routes/bills.routes';
import paymentRoutes from './routes/payments.routes';
import reportRoutes from './routes/reports.routes';
import reviewRoutes from './routes/reviews.routes';
import auditRoutes from './routes/audit.routes';
import analyticsRoutes from './routes/analytics.routes';
import sqlExplorerRoutes from './routes/sql-explorer.routes';
import acidLabRoutes from './routes/acid-lab.routes';
import rolesRoutes from './routes/roles.routes';
import vectorSearchRoutes from './routes/vector-search.routes';
import storageRoutes from './routes/storage.routes';

const app = express();

// Cross-Origin Resource Sharing
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Smart Healthcare API',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sql-explorer', sqlExplorerRoutes);
app.use('/api/acid-lab', acidLabRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/vector-search', vectorSearchRoutes);
app.use('/api/storage', storageRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;

