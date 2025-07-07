const LLMInteractionHistory = require('../models/LLMInteractionHistory');

exports.getAllInteractions = async (req, res) => {
  try {
    const interactions = await LLMInteractionHistory.findAll({ where: { user_id: req.user.id } });
    console.log('Backend: Interacciones recuperadas para el usuario:', req.user.id, interactions);

    // Parsear los campos JSON que vienen como strings
    const parsedInteractions = interactions.map(interaction => {
      const data = interaction.toJSON(); // Obtener una representación plana del objeto Sequelize
      if (typeof data.llm_evaluation_json === 'string') {
        data.llm_evaluation_json = JSON.parse(data.llm_evaluation_json);
      }
      if (typeof data.llm_advice_json === 'string') {
        data.llm_advice_json = JSON.parse(data.llm_advice_json);
      }
      return data;
    });

    res.json(parsedInteractions);
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
