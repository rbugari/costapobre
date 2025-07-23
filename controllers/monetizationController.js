const User = require('../models/User');
const UserGameState = require('../models/UserGameState'); // Importar UserGameState
const GameLevel = require('../models/GameLevel');     // Importar GameLevel
const GameConfig = require('../models/GameConfig');
const { sequelize } = require('../config/db');

// Helper function to get config value
const getConfigValue = async (key) => {
  const config = await GameConfig.findOne({ where: { config_key: key } });
  return config ? config.config_value : null;
};

exports.simulatePremiumPurchase = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from authentication middleware
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.premium) {
      return res.status(400).json({ message: 'Premium already purchased.' });
    }

    user.premium = true;
    // Check if both payments are made
    
    await user.save();

    res.status(200).json({ message: 'Premium pass simulated successfully.', user });
  } catch (error) {
    console.error('Error simulating premium purchase:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.simulateScandalRescuePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.rescatePago) {
      return res.status(400).json({ message: 'Scandal rescue already purchased for this incident.' });
    }

    user.rescatePago = true;
    // Check if both payments are made
    const precioRescateEscandalo = parseFloat(await getConfigValue('PRECIO_RESCATE_ESCANDALO'));
    const precioTotalDesbloqueo = parseFloat(await getConfigValue('PRECIO_TOTAL_DESBLOQUEO'));

    if (user.premium && precioRescateEscandalo >= precioTotalDesbloqueo) {
    }
    await user.save();
    res.status(200).json({ message: 'Scandal rescue simulated successfully.', user });
  } catch (error) {
    console.error('Error simulating scandal rescue purchase:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.rewardAd = async (req, res) => {
  try {
    const userId = req.user.id;
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);

    if (!gameState || !user) {
      return res.status(404).json({ message: 'User or game state not found.' });
    }

    // Apply reward: +20 PC, -5 BE (example values)
    gameState.pc += 20;
    gameState.be = Math.max(0, gameState.be - 5);

    await gameState.save();

    res.status(200).json({
      message: 'Ad rewarded successfully.',
      updated_game_state: {
        ...gameState.toJSON(),
        userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url, premium: user.premium, tipo_invitado: user.tipo_invitado } : null,
      },
    });
  } catch (error) {
    console.error('Error rewarding ad:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


