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
    const precioPremiumPass = parseFloat(await getConfigValue('PRECIO_PREMIUM_PASS'));
    const precioRescateEscandalo = parseFloat(await getConfigValue('PRECIO_RESCATE_ESCANDALO'));
    const precioTotalDesbloqueo = parseFloat(await getConfigValue('PRECIO_TOTAL_DESBLOQUEO'));

    if (user.rescatePago && (precioPremiumPass + precioRescateEscandalo) >= precioTotalDesbloqueo) {
      user.pagoTotal = true;
    }

    await user.save();

    // Lógica para ascender al usuario si estaba bloqueado por el nivel premium
    const monetizacionNivelPremium = parseInt(await getConfigValue('MONETIZACION_NIVEL_PREMIUM'));
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });

    if (gameState && gameState.level < monetizacionNivelPremium) {
      const targetLevelInfo = await GameLevel.findOne({ where: { level_number: monetizacionNivelPremium } });
      if (targetLevelInfo) {
        gameState.level = monetizacionNivelPremium;
        gameState.pc = targetLevelInfo.pc_required_for_ascension; // Ajustar PC al requisito del nuevo nivel
        gameState.inf = targetLevelInfo.inf_required_for_ascension; // Ajustar INF al requisito del nuevo nivel
        gameState.be = 0; // Resetear BE al ascender por pago
        await gameState.save();
        console.log(`Usuario ${userId} ascendido automáticamente al nivel ${monetizacionNivelPremium} tras compra premium.`);
      }
    }

    res.status(200).json({ message: 'Premium pass simulated successfully.', user, gameState });
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
    const precioPremiumPass = parseFloat(await getConfigValue('PRECIO_PREMIUM_PASS'));
    const precioRescateEscandalo = parseFloat(await getConfigValue('PRECIO_RESCATE_ESCANDALO'));
    const precioTotalDesbloqueo = parseFloat(await getConfigValue('PRECIO_TOTAL_DESBLOQUEO'));

    if (user.premium && (precioPremiumPass + precioRescateEscandalo) >= precioTotalDesbloqueo) {
      user.pagoTotal = true;
    }

    await user.save();
    res.status(200).json({ message: 'Scandal rescue simulated successfully.', user });
  } catch (error) {
    console.error('Error simulating scandal rescue purchase:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.simulateSetGuestUser = async (req, res) => {
  try {
    const { userId, isGuest } = req.body; // Admin panel would send userId
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.tipo_invitado = isGuest;
    await user.save();
    res.status(200).json({ message: `User ${user.nickname} guest status set to ${isGuest}.`, user });
  } catch (error) {
    console.error('Error setting guest user status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.simulateAddAdView = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const invitadoMaxAnuncios = parseInt(await getConfigValue('INVITADO_MAX_ANUNCIOS'));

    if (user.tipo_invitado && user.anuncios_vistos < invitadoMaxAnuncios) {
      user.anuncios_vistos += 1;
      await user.save();
      return res.status(200).json({ message: 'Ad view recorded.', user });
    } else if (!user.tipo_invitado) {
      return res.status(400).json({ message: 'User is not a guest user.' });
    } else {
      return res.status(400).json({ message: 'Guest user has reached maximum ad views.' });
    }
  } catch (error) {
    console.error('Error adding ad view:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
