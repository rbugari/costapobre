const aiService = require('../services/aiService');
const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const GameConfig = require('../models/GameConfig'); // Importar GameConfig

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
    const types = await aiService.getCorruptionTypes(cargo_actual, idioma, user.country_of_origin, user.age, user.political_ideology, user.personal_profile);
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
    const cards = await aiService.getCards(cargo_actual, tipo_de_corrupcion_elegido, idioma, user.country_of_origin, user.age, user.political_ideology, user.personal_profile);
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

    // 2. Obtener la evaluación del LLM
    const evaluationResult = await aiService.evaluatePlan(
      cargo_actual, 
      titulo_accion_elegida, 
      tags_accion_elegida, 
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
    console.log('aiController: llmEvaluation.be_aumento.valor =', llmEvaluation.be_aumento.valor); // Nuevo log

    // 3. Aplicar fórmulas de ganancia de recursos
    const pcGanado = (llmEvaluation.pc_ganancia.valor / 10) * gameLevel.pc_gain_factor * (1 + (gameState.inf / 100));
    const aumentoBE = llmEvaluation.be_aumento.valor;
    const infGanado = llmEvaluation.inf_ganancia.valor * gameLevel.inf_gain_factor;

    gameState.pc += pcGanado;
    gameState.inf = Math.min(100, gameState.inf + infGanado);
    gameState.be += aumentoBE;

    // Asegurarse de que BE no exceda 100
    gameState.be = Math.min(100, gameState.be);

    // 4. Reducción pasiva de BE (al final de cada turno exitoso)
    gameState.be = Math.max(0, gameState.be - 1);

    // 5. Lógica de ascenso de nivel (CORREGIDA)
    const currentLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    let ascended = false;

    if (currentLevel && gameState.pc >= currentLevel.pc_required_for_ascension && gameState.inf >= currentLevel.inf_required_for_ascension) {
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
      }
    }

    // Verificar si se dispara un escándalo
    let scandalTriggered = false;
    let scandalHeadline = null;
    if (gameState.be >= 85) {
      scandalTriggered = true;
      scandalHeadline = await aiService.generateScandalHeadline(gameLevel.title, user.selected_language || 'es', gameState.be);
      console.log(`¡Jugador ${userId} ha disparado un escándalo! BE: ${gameState.be}, Titular: ${scandalHeadline}`);
    }

    // 6. Guardar el estado del juego actualizado
    await gameState.save();

    // 7. Volver a cargar la información del nivel después de un posible ascenso
    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    // const user = await User.findByPk(userId); // Eliminada la declaración duplicada

    // Obtener la información del *nuevo* siguiente nivel si hubo ascenso
    const newNextLevelNumber = gameState.level + 1;
    const newNextLevel = await GameLevel.findOne({ where: { level_number: newNextLevelNumber } });
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
      inf_ganado_this_turn: infGanado,
      be_aumento_this_turn: aumentoBE,
    });

  } catch (err) {
    console.error('Error evaluating plan:', err.message);
    res.status(500).send('Server error');
  }
};
