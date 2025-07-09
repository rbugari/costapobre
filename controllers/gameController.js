const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const GameConfig = require('../models/GameConfig');
const { getGameConfig } = require('../config/gameConfig');
const aiService = require('../services/aiService'); // Importar aiService

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
  const { pc, inf, be } = req.body;
  const userId = req.user.id;

  try {
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);

    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found' });
    }

    gameState.pc = pc;
    gameState.inf = inf;
    gameState.be = be;

    // Lógica de ascenso de nivel (CORREGIDA)
    const currentLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    let ascended = false;

    if (currentLevel && gameState.pc >= currentLevel.pc_required_for_ascension && gameState.inf >= currentLevel.inf_required_for_ascension) {
      const nextLevelNumber = gameState.level + 1;
      const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });
      
      if (nextLevel) {
        const monetizacionNivelPremium = parseInt(await getConfigValue('MONETIZACION_NIVEL_PREMIUM'));
        if (nextLevel.level_number >= monetizacionNivelPremium && !user.premium && !user.tipo_invitado) {
          return res.status(403).json({ msg: 'Premium pass required to access this level.' });
        }
        gameState.level = nextLevelNumber;
        ascended = true;
        console.log(`¡Jugador ${userId} ha ascendido al nivel ${nextLevelNumber}!`);
      }
    }

    // Monetization logic for scandal and game over
    const umbralEscandaloMinimo = parseInt(await getConfigValue('UMBRAL_ESCANDALO_MINIMO'));
    const umbralGameover = parseInt(await getConfigValue('UMBRAL_GAMEOVER'));
    const valorBeReinicioPago = parseInt(await getConfigValue('VALOR_BE_REINICIO_PAGO'));
    const reiniciarRecursosConCaida = (await getConfigValue('REINICIAR_RECURSOS_CON_CAIDA')) === 'true';

    if (gameState.be >= umbralGameover) {
      if (user.pagoTotal) {
        // Degrade level
        gameState.level = Math.max(1, gameState.level - 1);
        gameState.be = valorBeReinicioPago;
        if (reiniciarRecursosConCaida) {
          const newLevelInfo = await GameLevel.findOne({ where: { level_number: gameState.level } });
          gameState.pc = newLevelInfo.pc_gain_factor; // Assuming pc_gain_factor is the base PC for the level
          gameState.inf = newLevelInfo.inf_required_for_ascension; // Assuming inf_required_for_ascension is the base INF for the level
        }
        // Mark degradation in history (not implemented yet, but placeholder for future)
        console.log(`Jugador ${userId} degradado al nivel ${gameState.level} debido a escándalo.`);
        user.rescatePago = false; // Reset rescatePago after degradation
      } else {
        return res.status(402).json({ msg: 'GAME OVER: Scandal too high. Purchase full unlock to continue.' });
      }
    } else if (gameState.be >= umbralEscandaloMinimo && !user.rescatePago && !user.pagoTotal && !user.tipo_invitado) {
      return res.status(402).json({ msg: 'Scandal too high. Purchase rescue to continue.', requiresRescue: true });
    } else if (gameState.be < umbralEscandaloMinimo && user.rescatePago) {
      user.rescatePago = false; // Clear rescatePago if scandal is below threshold
    }

    await gameState.save();

    // Volver a cargar la información del nivel después de un posible ascenso o degradación
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
      ascended: ascended,
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
        const pcCost = gameState.pc * 0.5; // 50% de los PC actuales
        const infCost = 50; // 50 INF

        if (gameState.pc < pcCost || gameState.inf < infCost) {
          // No tiene recursos para la opción A, GAME OVER
          gameOver = true;
          msg = 'No tienes suficientes recursos para comprar el silencio. ¡GAME OVER!';
          break;
        }

        gameState.pc -= pcCost;
        gameState.inf -= infCost;
        gameState.be = 30; // BE se reduce drásticamente a 30
        msg = '¡Has comprado el silencio! El escándalo ha sido enterrado.';
        break;

      case 'B': // Degradación Estratégica
        const infCostB = 25; // 25 INF

        if (gameState.inf < infCostB) {
          // No tiene recursos para la opción B, GAME OVER
          gameOver = true;
          msg = 'No tienes suficiente Influencia para negociar tu salida. ¡GAME OVER!';
          break;
        }

        gameState.inf -= infCostB;
        const newLevelNumber = Math.max(1, gameState.level - 1);
        const newLevelInfo = await GameLevel.findOne({ where: { level_number: newLevelNumber } });

        if (!newLevelInfo) {
          // Esto no debería pasar si los niveles están bien definidos
          gameOver = true;
          msg = 'Error al degradar nivel. ¡GAME OVER!';
          break;
        }

        gameState.level = newLevelNumber;
        gameState.pc = newLevelInfo.pc_required_for_ascension; // Reajuste de PC al valor base del nuevo nivel
        gameState.inf = newLevelInfo.inf_required_for_ascension; // Reajuste de INF al valor base del nuevo nivel
        gameState.be = 10; // BE se resetea a 10
        msg = `Has sido degradado a ${newLevelInfo.title}. Tu carrera continúa, por ahora.`;
        break;

      case 'C': // Negarlo Todo y Afrontar las Consecuencias
        gameOver = true;
        msg = 'Has negado todo y afrontado las consecuencias. Tu carrera política ha terminado. ¡GAME OVER!';
        break;

      default:
        return res.status(400).json({ msg: 'Opción de resolución de escándalo inválida.' });
    }

    if (gameOver) {
      // Aquí podrías resetear el estado del juego o marcar al usuario como GAME OVER
      // Por ahora, solo enviamos el mensaje y el estado de GAME OVER
      return res.status(200).json({ msg, gameOver: true });
    }

    await gameState.save();

    // Volver a cargar la información del nivel después de un posible cambio
    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const updatedUser = await User.findByPk(userId);

    res.json({
      msg,
      gameOver: false,
      updated_game_state: {
        ...gameState.toJSON(),
        levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
        userInfo: updatedUser ? { nickname: updatedUser.nickname, avatar_url: updatedUser.avatar_url, premium: updatedUser.premium, tipo_invitado: updatedUser.tipo_invitado, anuncios_vistos: updatedUser.anuncios_vistos } : null,
      },
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