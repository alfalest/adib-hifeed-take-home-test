import express from 'express';
import cors from 'cors';
import { mockAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import inventoryRoutes from './routes/inventory';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(mockAuthMiddleware);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hifeed-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/inventory', inventoryRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HiFeed Backend API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Inventory API: http://localhost:${PORT}/api/v1/inventory`);
});

export default app;
