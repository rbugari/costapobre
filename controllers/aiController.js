const aiService = require('../services/aiService');
const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const { getGameConfig } = require('../config/gameConfig');
const GameConfig = require('../models/GameConfig'); // Importar GameConfig
const UserLog = require('../models/UserLog'); // Importar el modelo UserLog

// Helper function to get config value
const getConfigValue = async (key) => {
  const config = await GameConfig.findOne({ where: { config_key: key } });
  return config ? config.config_value : null;
};

exports.getCorruptionTypes = async (req, res) => {
  console.log('Backend: Solicitud recibida para getCorruptionTypes.');
  const { cargo_actual, idioma } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    const gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const playerLevel = gameState ? gameState.level : 1; // Default to 1 if no game state
    const num_tipos = parseInt(await getConfigValue('NUM_CORRUPTION_TYPES')) || 10; // Get from game_config, default to 10

    const types = await aiService.getCorruptionTypes(
      userId,
      cargo_actual,
      user.age,
      user.political_ideology,
      user.personal_profile,
      idioma,
      num_tipos,
      playerLevel
    );
    res.json(types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getCards = async (req, res) => {
  const { cargo_actual, tipo_de_corrupcion_elegido, idioma } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    const gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const playerLevel = gameState ? gameState.level : 1; // Default to 1 if no game state

    const cards = await aiService.getCards(
      userId,
      cargo_actual,
      tipo_de_corrupcion_elegido,
      idioma,
      playerLevel
    );
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.evaluatePlan = async (req, res) => {
  const { cargo_actual, titulo_accion_elegida, tags_accion_elegida, plan_del_jugador, idioma } = req.body;
  const userId = req.user.id; // Obtener el ID del usuario autenticado

  try {
    // 1. Obtener el estado actual del juego y el nivel del jugador
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found for user.' });
    }

    let gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    if (!gameLevel) {
      return res.status(404).json({ msg: 'Game level information not found.' });
    }

    const user = await User.findByPk(userId); // Obtener los datos del usuario para pasar al LLM

    const tagsArray = Array.isArray(tags_accion_elegida) ? tags_accion_elegida : [tags_accion_elegida];

    // 2. Obtener la evaluación del LLM
    const evaluationResult = await aiService.evaluatePlan(
      userId, 
      cargo_actual, 
      titulo_accion_elegida, 
      tagsArray, 
      plan_del_jugador, 
      idioma, 
      user.country_of_origin, 
      user.age, 
      user.political_ideology, 
      user.personal_profile
    );
    const llmEvaluation = evaluationResult.llm_evaluation_json;
    const llmAdvice = evaluationResult.llm_advice_json;

    console.log('aiController: llmEvaluation.pc_ganancia.valor =', llmEvaluation.pc_ganancia.valor);
    console.log('aiController: gameLevel.pc_gain_factor =', gameLevel.pc_gain_factor);
    console.log('aiController: llmEvaluation.be_aumento.valor =', llmEvaluation.be_aumento.valor);
    console.log('aiController: llmEvaluation.inf_ganancia.valor =', llmEvaluation.inf_ganancia.valor);
    console.log('aiController: gameLevel.inf_gain_factor =', gameLevel.inf_gain_factor);

    // 3. Aplicar fórmulas de ganancia de recursos
    const pcGanado = Math.round(llmEvaluation.pc_ganancia.valor * gameLevel.pc_gain_factor * (1 + (gameState.inf / 100)));
    const aumentoBE = llmEvaluation.be_aumento.valor / 2;
    const infGanado = Math.round(llmEvaluation.inf_ganancia.valor * gameLevel.inf_gain_factor);

    console.log('aiController: Calculated infGanado =', infGanado);
    console.log('aiController: Calculated aumentoBE =', aumentoBE);

    gameState.pc += pcGanado;
    gameState.inf = Math.round(Math.min(100, gameState.inf + infGanado));
    gameState.be += aumentoBE;

    // Asegurarse de que BE no exceda 100
    gameState.be = Math.min(100, gameState.be);

    // 4. Reducción pasiva de BE (al final de cada turno exitoso)
    gameState.be = Math.max(0, gameState.be - 1);

    // 5. Lógica de ascenso de nivel (CORREGIDA)
    const currentLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    let ascended = false;

    if (currentLevel && gameState.pc >= currentLevel.pc_required_for_ascension) {
      const nextLevelNumber = gameState.level + 1;
      const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

      if (nextLevel) {
        const monetizacionNivelPremium = parseInt(await getConfigValue('MONETIZACION_NIVEL_PREMIUM'));
        if (nextLevel.level_number >= monetizacionNivelPremium && !user.premium && !user.tipo_invitado) {
          // Si el usuario no es premium/invitado y el siguiente nivel requiere premium, denegar el ascenso
          return res.json({
            requiresPremiumAccess: true,
            msg: 'Premium pass required to access this level.',
            // Incluir el estado actual del juego para que el frontend pueda mostrarlo
            updated_game_state: {
              ...gameState.toJSON(),
              levelInfo: currentLevel ? currentLevel.toJSON() : null,
              userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null,
            },
          });
        }
        gameState.level = nextLevelNumber;
        ascended = true;
        console.log(`¡Jugador ${userId} ha ascendido al nivel ${nextLevelNumber}!`);
        // Reduce influence by 80% upon level up
        gameState.inf = Math.round(gameState.inf * 0.20);
      }
    }

    // Verificar si se dispara un escándalo
    let scandalTriggered = false;
    let scandalHeadline = null;
    if (gameState.be >= 85) {
      try {
        scandalTriggered = true;
        scandalHeadline = await aiService.generateScandalHeadline(gameLevel.title, user.selected_language || 'es', gameState.be);
        console.log(`¡Jugador ${userId} ha disparado un escándalo! BE: ${gameState.be}, Titular: ${scandalHeadline}`);
      } catch (scandalError) {
        console.error('Error generating scandal headline:', scandalError.message);
        // If the scandal headline generation fails, we'll send an error to the client
        // and prevent the player from being penalized.
        return res.status(500).json({ msg: 'Error generating scandal headline. Please try again.' });
      }
    }

    // 6. Guardar el estado del juego actualizado
    await gameState.save();

    // Calculate changes for logging
    const pc_change = gameState.pc - (gameState._previousDataValues.pc || gameState.pc);
    const inf_change = gameState.inf - (gameState._previousDataValues.inf || gameState.inf);
    const be_change = gameState.be - (gameState._previousDataValues.be || gameState.be);

    // Log the turn played event
    await UserLog.create({
      user_id: userId,
      event_type: 'turn_played',
      level: gameState.level,
      pc_change: pc_change,
      inf_change: inf_change,
      be_change: be_change,
      pc_current: gameState.pc,
      inf_current: gameState.inf,
      be_current: gameState.be,
      action_title: titulo_accion_elegida, 
      details: { tags: tagsArray, narrated_plan: plan_del_jugador },
    });

    // 7. Volver a cargar la información del nivel después de un posible ascenso
    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    // const user = await User.findByPk(userId); // Eliminada la declaración duplicada

    // Obtener la información del *nuevo* siguiente nivel si hubo ascenso
    const newNextLevelNumber = gameState.level + 1;
    const newNextLevel = await GameLevel.findOne({ where: { level_number: newNextLevelNumber } });

    // Calculate dev calculation details
    const llm_pc_valor = llmEvaluation.pc_ganancia.valor;
    const pc_gain_factor = gameLevel.pc_gain_factor;
    const inf_actual = gameState.inf;
    const influence_multiplier = (1 + (inf_actual / 100));
    const raw_pc_gain = llm_pc_valor * pc_gain_factor * influence_multiplier;
    const final_pc_gain = Math.round(raw_pc_gain);

    const dev_calculation_details = {
      llm_pc_valor: llm_pc_valor,
      pc_gain_factor: pc_gain_factor,
      inf_actual: inf_actual,
      influence_multiplier: influence_multiplier,
      raw_pc_gain: raw_pc_gain,
      final_pc_gain: final_pc_gain,
    };

    res.json({
      llm_evaluation_json: llmEvaluation,
      llm_advice_json: llmAdvice,
      updated_game_state: {
        ...gameState.toJSON(),
        levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
        userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null,
        nextLevelInfo: newNextLevel ? newNextLevel.toJSON() : null,
      },
      ascended: ascended,
      scandal_triggered: scandalTriggered, // Añadir la bandera de escándalo
      scandal_headline: scandalHeadline, // Añadir el titular del escándalo
      pc_ganado_this_turn: pcGanado,
      inf_ganado_this_turn: Math.floor(infGanado),
      be_aumento_this_turn: Math.floor(aumentoBE),
      dev_calculation_details: dev_calculation_details, // Add dev calculation details
    });

  } catch (err) {
    console.error('Error evaluating plan:', err.message);
    res.status(500).send('Server error');
  }
};

exports.generateDevPlan = async (req, res) => {
  const { getGameConfig } = require('../config/gameConfig');
  const config = getGameConfig();
  if (config.GAME_MODE !== 'desarrollo') {
    return res.status(403).send('This feature is only available in development mode.');
  }

  const { titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, quality_level, idioma } = req.body;

  try {
    const plan = await aiService.generateDevPlan(
      titulo_accion_elegida,
      descripcion_accion_elegida,
      tags_accion_elegida,
      quality_level,
      idioma
    );
    res.json({ plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
