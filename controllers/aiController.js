const aiService = require('../services/aiService');
const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User

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

    // 3. Aplicar fórmulas de ganancia de recursos
    const pcGanado = (llmEvaluation.pc_ganancia.valor / 10) * gameLevel.pc_gain_factor;
    const aumentoBE = llmEvaluation.be_aumento.valor;
    const infGanado = llmEvaluation.inf_ganancia.valor;

    gameState.pc += pcGanado;
    gameState.inf += infGanado;
    gameState.be += aumentoBE;

    // Asegurarse de que BE no exceda 100
    gameState.be = Math.min(100, gameState.be);

    // 4. Reducción pasiva de BE (al final de cada turno exitoso)
    gameState.be = Math.max(0, gameState.be - 1);

    // 5. Lógica de ascenso de nivel
    const nextLevelNumber = gameState.level + 1;
    const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

    let ascended = false;
    if (nextLevel && gameState.pc >= nextLevel.pc_required_for_ascension && gameState.inf >= nextLevel.inf_required_for_ascension) {
      gameState.level = nextLevelNumber;
      ascended = true;
      console.log(`¡Jugador ${userId} ha ascendido al nivel ${nextLevelNumber}!`);
    }

    // Verificar si se dispara un escándalo
    let scandalTriggered = false;
    if (gameState.be >= 85) {
      scandalTriggered = true;
      console.log(`¡Jugador ${userId} ha disparado un escándalo! BE: ${gameState.be}`);
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
      pc_ganado_this_turn: pcGanado,
      inf_ganado_this_turn: infGanado,
      be_aumento_this_turn: aumentoBE,
    });

  } catch (err) {
    console.error('Error evaluating plan:', err.message);
    res.status(500).send('Server error');
  }
};
