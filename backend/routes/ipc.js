const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/ipcController');

// ── /api/ipc  (IPC-only, backward-compat) ────────────────────────────────────
router.get('/chapters', controller.listChapters);          // GET /api/ipc/chapters
router.get('/',         controller.listSections);          // GET /api/ipc?q=...
router.get('/:section', controller.getSection);            // GET /api/ipc/302

module.exports = router;
