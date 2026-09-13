const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/ipcController');

// ── /api/laws  (unified — all acts) ──────────────────────────────────────────
router.get('/acts',           controller.getActsList);        // GET /api/laws/acts
router.get('/categories',     controller.getCategoriesList);  // GET /api/laws/categories
router.get('/',               controller.listLaws);           // GET /api/laws?q=...&act=IPC
router.get('/:act/:section',  controller.getLawByActSection); // GET /api/laws/IPC/302

module.exports = router;
