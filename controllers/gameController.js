const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const GameConfig = require('../models/GameConfig');
const { getGameConfig } = require('../config/gameConfig');
const aiService = require('../services/aiService'); // Importar aiService
const UserLog = require('../models/UserLog'); // Importar el modelo UserLog

// Helper function to get config value
const getConfigValue = async (key) => {
  const config = await GameConfig.findOne({ where: { config_key: key } });
  return config ? config.config_value : null;
};

exports.loadProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);

    if (!gameState) {
      gameState = await UserGameState.create({ user_id: userId });
    }

    const gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const maxLevel = await GameLevel.max('level_number');

    let scandalTriggered = false;
    let scandalHeadline = null;

    // Si la BE es alta al cargar el progreso, disparar el evento de escándalo
    if (gameState.be >= 85) {
      scandalTriggered = true;
      scandalHeadline = await aiService.generateScandalHeadline(gameLevel.title, user.selected_language || 'es', gameState.be);
    }

    const gameConfig = getGameConfig();

    res.json({
      ...gameState.toJSON(),
      levelInfo: gameLevel ? gameLevel.toJSON() : null,
      userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url, premium: user.premium, tipo_invitado: user.tipo_invitado, anuncios_vistos: user.anuncios_vistos } : null,
      maxLevel: maxLevel,
      scandal_triggered: scandalTriggered,
      scandal_headline: scandalHeadline,
      gameMode: gameConfig.GAME_MODE,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.saveProgress = async (req, res) => {
  const { pc, inf, be, action_title, tags, narrated_plan } = req.body;
  const userId = req.user.id;

  try {
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);

    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found' });
    }

    // Calculate changes for logging
    const pc_change = pc - gameState.pc;
    const inf_change = inf - gameState.inf;
    const be_change = be - gameState.be;

    gameState.pc = pc;
    gameState.inf = Math.min(100, inf); // Ensure influence does not exceed 100
    gameState.be = be;

    let ascended = false;
    let gameWon = false; // Initialize gameWon to false
    let msg = null; // Initialize msg to null

    // Monetization logic for scandal and game over
    const umbralEscandaloMinimo = parseInt(await getConfigValue('UMBRAL_ESCANDALO_MINIMO'));

    if (gameState.be >= umbralEscandaloMinimo && !user.rescatePago && !user.pagoTotal && !user.tipo_invitado) {
      return res.status(402).json({ msg: 'Scandal too high. Purchase rescue to continue.', requiresRescue: true });
    } else if (gameState.be < umbralEscandaloMinimo && user.rescatePago) {
      user.rescatePago = false; // Clear rescatePago if scandal is below threshold
    }

    await gameState.save();

    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const updatedUser = await User.findByPk(userId); // Obtener los datos del usuario actualizados

    

    

    // Obtener la información del *nuevo* siguiente nivel si hubo ascenso
    const newNextLevelNumber = gameState.level + 1;
    const newNextLevel = await GameLevel.findOne({ where: { level_number: newNextLevelNumber } });

    res.json({
      ...gameState.toJSON(),
      levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
      userInfo: updatedUser ? { nickname: updatedUser.nickname, avatar_url: updatedUser.avatar_url, premium: updatedUser.premium, tipo_invitado: updatedUser.tipo_invitado, anuncios_vistos: updatedUser.anuncios_vistos } : null,
      nextLevelInfo: newNextLevel ? newNextLevel.toJSON() : null,
       // Ensure gameWon is always present
      msg: msg || null, // Ensure msg is always present
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.reduceScandal = async (req, res) => {
  const { inf_to_spend } = req.body;
  const userId = req.user.id;

  try {
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId); // Declare user once here

    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found' });
    }

    if (gameState.inf < inf_to_spend) {
      return res.status(400).json({ msg: 'Not enough Influence to spend' });
    }

    const beReduction = inf_to_spend * 2;
    gameState.inf -= inf_to_spend;
    gameState.be = Math.max(0, gameState.be - beReduction);

    // Reset rescatePago flag after successful reduction
    if (user) {
      user.rescatePago = false;
      await user.save();
    }

    const gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const nextLevelNumber = gameState.level + 1;
    const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

    res.json({
      ...gameState.toJSON(),
      levelInfo: gameLevel ? gameLevel.toJSON() : null,
      userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url, premium: user.premium, tipo_invitado: user.tipo_invitado, anuncios_vistos: user.anuncios_vistos } : null,
      nextLevelInfo: nextLevel ? nextLevel.toJSON() : null,
      be_reduced_this_turn: beReduction,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.resolveScandal = async (req, res) => {
  const { choice } = req.body;
  const userId = req.user.id;

  try {
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);
    const currentLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });

    if (!gameState || !user || !currentLevel) {
      return res.status(404).json({ msg: 'Game state, user, or level not found' });
    }

    let msg = '';
    let gameOver = false;

    switch (choice) {
      case 'A': // Comprar Silencio y Voluntades
        let paymentMessage = '';
        if (!user.rescatePago) {
          // Simulate 1 euro payment - Placeholder for actual payment integration
          console.log(`User ${userId} is making a one-time 1 euro payment for Option A.`);
          user.rescatePago = true;
          await user.save(); // Save the user object to persist the change
          paymentMessage = ' (pago de 1 euro realizado)';
        }

        const pcLoss = Math.round(gameState.pc * 0.10); // 10% de los PC actuales
        const infLoss = Math.round(gameState.inf * 0.10); // 10% de la INF actual

        // No longer leads to GAME OVER for insufficient resources, as payment (or prior payment) resolves the scandal.

        gameState.pc -= pcLoss;
        gameState.inf -= infLoss;
        gameState.be = 0; // BE se reinicia a 0
        msg = `¡Has comprado el silencio! El escándalo ha sido enterrado. Perdiste ${pcLoss} PC y ${infLoss} INF.${paymentMessage}`;
        break;

      case 'B': // Degradación Estratégica
            const pcReduction = Math.round(gameState.pc * 0.50); // 50% de el PC actual
            const infReduction = Math.round(gameState.inf * 0.50); // 50% de la INF actual
            gameState.be = 30; // BE se establece en 30%
   
            const newLevelNumber = Math.max(1, gameState.level - 1); // Reducir 1 nivel
            const newLevelInfo = await GameLevel.findOne({ where: { level_number: newLevelNumber } });
   
            if (!newLevelInfo) {
              // This case should ideally not lead to GAME OVER if levels are well-defined
              // but as a fallback, if a valid level cannot be found after degradation
              gameOver = true;
              msg = 'Error al degradar nivel. ¡GAME OVER!';
              break;
            }
   
            gameState.level = newLevelNumber;
   
            msg = `Has sido degradado a ${newLevelInfo.title}. Perdiste ${infReduction} INF. Tu BE ahora es 30.
    Tu carrera continúa, por ahora.`;
            break;
   
        gameState.level = newLevelNumber;
        
        msg = `Has sido degradado a ${newLevelInfo.title}. Perdiste ${infReduction} INF. Tu BE ahora es 30. Tu carrera continúa, por ahora.`;
        break;

      case 'C': // Negarlo Todo y Afrontar las Consecuencias
        msg = 'Has negado todo. No se tomaron acciones. ¡Cuidado! Si tu Barra de Escándalo llega al 100%, será GAME OVER.';
        // No changes to gameState (PC, INF, BE, Level) for this option
        break;

      default:
        return res.status(400).json({ msg: 'Opción de resolución de escándalo inválida.' });
    }

    // Check for Game Over condition after scandal resolution
    if (gameState.be >= 100) {
      gameOver = true;
      msg = '¡Tu Barra de Escándalo ha llegado al 100%! ¡GAME OVER!';
    }

    // Calculate changes for logging BEFORE saving
    const pc_change = gameState.pc - (gameState._previousDataValues.pc || gameState.pc);
    const inf_change = gameState.inf - (gameState._previousDataValues.inf || gameState.inf);
    const be_change = gameState.be - (gameState._previousDataValues.be || gameState.be);

    await gameState.save();

    // Log the scandal resolution event
    await UserLog.create({
      user_id: userId,
      event_type: 'scandal_resolved',
      level: gameState.level,
      pc_change: pc_change,
      inf_change: inf_change,
      be_change: be_change,
      pc_current: gameState.pc, 
      inf_current: gameState.inf, 
      be_current: gameState.be,
      details: { 
        choice: choice,
        message: msg
      },
    });

    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const updatedUser = await User.findByPk(userId);

    const finalGameState = {
      ...gameState.toJSON(),
      levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
      userInfo: updatedUser ? { nickname: updatedUser.nickname, avatar_url: updatedUser.avatar_url, premium: updatedUser.premium, tipo_invitado: updatedUser.tipo_invitado, anuncios_vistos: updatedUser.anuncios_vistos } : null,
    };

    if (gameOver) {
      return res.status(200).json({ msg, gameOver: true, updated_game_state: finalGameState });
    }

    res.json({
      msg,
      gameOver: false,
      updated_game_state: finalGameState,
    });

  } catch (err) {
    console.error('Error resolving scandal:', err.message);
    res.status(500).send('Server error');
  }
};

exports.getGameConfig = async (req, res) => {

  try {
    const configs = await GameConfig.findAll();
    const configMap = configs.reduce((acc, config) => {
      acc[config.config_key] = config.config_value;
      return acc;
    }, {});
    res.json(configMap);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

    