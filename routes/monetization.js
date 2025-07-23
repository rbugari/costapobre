const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes below will be protected by authMiddleware
router.use(authMiddleware);

// Simulate premium pass purchase
router.post('/simulate-premium', monetizationController.simulatePremiumPurchase);

// Simulate scandal rescue purchase
router.post('/simulate-scandal-rescue', monetizationController.simulateScandalRescuePurchase);

// Simulate adding an ad view for guest users


router.post('/reward-ad', monetizationController.rewardAd);

module.exports = router;
