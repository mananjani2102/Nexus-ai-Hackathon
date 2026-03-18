const express  = require('express');
const History  = require('../models/History');

const router = express.Router();

// GET /api/history
router.get('/history', async (req, res) => {
  try {
    const history = await History.find().sort({ date: -1 }).limit(20);
    res.json(history);
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
