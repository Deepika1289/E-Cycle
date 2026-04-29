import express from 'express';
import { 
  getAllZones, 
  getZoneById, 
  createZone, 
  updateZone, 
  deleteZone,
  getCyclesInZone,
  assignCyclesToZone,
  removeCyclesFromZone
} from '../controllers/zones.js';
import { authenticate } from '../middleware/auth.js';

export const router = express.Router();

// All zone routes require authentication and manager/admin role
router.use(authenticate);
// Zone CRUD routes
router.get('/', getAllZones);
router.get('/:id', getZoneById);
router.post('/', createZone);
router.put('/:id', updateZone);
router.delete('/:id', deleteZone);

// Zone-cycle management routes
router.get('/:id/cycles', getCyclesInZone);
router.post('/:id/cycles', assignCyclesToZone);
router.delete('/:id/cycles', removeCyclesFromZone);

export default router;