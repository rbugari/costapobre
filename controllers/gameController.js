const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const GameConfig = require('../models/GameConfig');

exports.loadProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });

    if (!gameState) {
      gameState = await UserGameState.create({ user_id: userId });
    }

    const user = await User.findByPk(userId); // Obtener los datos del usuario

    const gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });

    const nextLevelNumber = gameState.level + 1;
    const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

    const maxLevel = await GameLevel.max('level_number');

    res.json({
      ...gameState.toJSON(),
      levelInfo: gameLevel ? gameLevel.toJSON() : null,
      userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null, // Enviar info del usuario
      nextLevelInfo: nextLevel ? nextLevel.toJSON() : null, // Enviar info del siguiente nivel
      maxLevel: maxLevel,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.saveProgress = async (req, res) => {
  const { pc, inf, be } = req.body; // Ya no recibimos 'level' del frontend
  const userId = req.user.id;

  try {
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });

    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found' });
    }

    gameState.pc = pc;
    gameState.inf = inf;
    gameState.be = be;

    // Lógica de ascenso de nivel
    const nextLevelNumber = gameState.level + 1;
    const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

    let ascended = false;
    if (nextLevel && gameState.pc >= nextLevel.pc_required_for_ascension && gameState.inf >= nextLevel.inf_required_for_ascension) {
      gameState.level = nextLevelNumber;
      ascended = true;
      console.log(`¡Jugador ${userId} ha ascendido al nivel ${nextLevelNumber}!`);
    }

    await gameState.save();

    // Volver a cargar la información del nivel después de un posible ascenso
    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const user = await User.findByPk(userId); // Obtener los datos del usuario actualizados

    // Obtener la información del *nuevo* siguiente nivel si hubo ascenso
    const newNextLevelNumber = gameState.level + 1;
    const newNextLevel = await GameLevel.findOne({ where: { level_number: newNextLevelNumber } });

    res.json({
      ...gameState.toJSON(),
      levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
      userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null,
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

    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found' });
    }

    if (gameState.inf < inf_to_spend) {
      return res.status(400).json({ msg: 'Not enough Influence to spend' });
    }

    const beReduction = inf_to_spend;
    gameState.inf -= inf_to_spend;
    gameState.be = Math.max(0, gameState.be - beReduction);

    await gameState.save();

    const user = await User.findByPk(userId);
    const gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const nextLevelNumber = gameState.level + 1;
    const nextLevel = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

    res.json({
      ...gameState.toJSON(),
      levelInfo: gameLevel ? gameLevel.toJSON() : null,
      userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null,
      nextLevelInfo: nextLevel ? nextLevel.toJSON() : null,
      be_reduced_this_turn: beReduction,
    });

  } catch (err) {
    console.error(err.message);
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