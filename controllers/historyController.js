const LLMInteractionHistory = require('../models/LLMInteractionHistory');

exports.getAllInteractions = async (req, res) => {
  try {
    const { page = 1, limit = 5, level } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };
    if (req.query.level) {
      whereClause.level = req.query.level;
    }

    const { count, rows: interactions } = await LLMInteractionHistory.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']],
    });

    const parsedInteractions = interactions.map(interaction => {
      const data = interaction.toJSON();
      if (typeof data.llm_evaluation_json === 'string') {
        data.llm_evaluation_json = JSON.parse(data.llm_evaluation_json);
      }
      if (typeof data.llm_advice_json === 'string') {
        data.llm_advice_json = JSON.parse(data.llm_advice_json);
      }
      return data;
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      history: parsedInteractions,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addInteraction = async (req, res) => {
  const { level, action_title, narrated_plan_text, llm_evaluation_json, llm_advice_json } = req.body;

  try {
    const newInteraction = await LLMInteractionHistory.create({
      user_id: req.user.id,
      level,
      action_title,
      narrated_plan_text,
      llm_evaluation_json,
      llm_advice_json,
    });

    res.json(newInteraction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
