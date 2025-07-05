const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/ai/get-corruption-types
// @desc    Generate 10 corruption types for the roulette
// @access  Private
router.post('/get-corruption-types', authMiddleware, aiController.getCorruptionTypes);

// @route   POST api/ai/get-cards
// @desc    Generate 5 sub-options (cards)
// @access  Private
router.post('/get-cards', authMiddleware, aiController.getCards);

// @route   POST api/ai/evaluate-plan
// @desc    Evaluate the player's narrated plan
// @access  Private
router.post('/evaluate-plan', authMiddleware, aiController.evaluatePlan);

module.exports = router;
