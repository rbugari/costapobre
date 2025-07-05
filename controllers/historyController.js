const LLMInteractionHistory = require('../models/LLMInteractionHistory');

exports.getAllInteractions = async (req, res) => {
  try {
    const interactions = await LLMInteractionHistory.findAll({ where: { user_id: req.user.id } });
    res.json(interactions);
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
