import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { parseBody, customerSchema, customerUpdateSchema } from '../utils/validation';
import * as customerService from '../services/customerService';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const customers = await customerService.listCustomers();
    res.json({ customers });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(customerSchema, req.body);
    const customer = await customerService.createCustomer(body);
    res.status(201).json({ customer });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomer(req.params.id);
    res.json({ customer });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = parseBody(customerUpdateSchema, req.body);
    const customer = await customerService.updateCustomer(req.params.id, body);
    res.json({ customer });
  })
);

export default router;
