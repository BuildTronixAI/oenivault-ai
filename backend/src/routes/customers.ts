import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { parseBody, customerSchema, customerUpdateSchema } from '../utils/validation';
import * as customerService from '../services/customerService';
import * as authService from '../services/authService';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const customers = await customerService.listCustomers(req.user!);
    res.json({ customers });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(customerSchema, req.body);
    const customer = await customerService.createCustomer({
      ...body,
      facilityId: body.facilityId ?? req.user!.facilityId,
    });
    res.status(201).json({ customer });
  })
);

router.post(
  '/invite',
  asyncHandler(async (req, res) => {
    const result = await authService.createInvite({
      email: String(req.body?.email ?? ''),
      fullName: String(req.body?.fullName ?? ''),
      facilityId: req.body?.facilityId ?? req.user!.facilityId,
      invitedBy: req.user!.id,
    });
    res.status(201).json(result);
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
