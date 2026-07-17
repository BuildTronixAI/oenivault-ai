import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import * as reportService from '../services/reportService';
import * as exportService from '../services/exportService';
import { parseWineFilters } from '../utils/wineFilters';

const router = Router();

router.use(requireAuth);

router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    const report = await reportService.inventorySummary(req.user!);
    res.json({ report });
  })
);

router.get(
  '/value',
  asyncHandler(async (req, res) => {
    const report = await reportService.valueReport(req.user!);
    res.json({ report });
  })
);

router.get(
  '/climate',
  asyncHandler(async (req, res) => {
    const days = req.query.days ? Number(req.query.days) : 7;
    const report = await reportService.climateReport(req.user!, days);
    res.json({ report });
  })
);

router.get(
  '/export/csv',
  asyncHandler(async (req, res) => {
    const filters = parseWineFilters(req.query as Record<string, unknown>);
    const csv = await exportService.exportInventoryCsv(req.user!, filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oenivault-inventory.csv"');
    res.send(csv);
  })
);

router.get(
  '/export/pdf',
  asyncHandler(async (req, res) => {
    const filters = parseWineFilters(req.query as Record<string, unknown>);
    const pdf = await exportService.exportInventoryPdf(req.user!, filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="oenivault-inventory.pdf"');
    res.send(pdf);
  })
);

export default router;
