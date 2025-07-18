const GameConfig = require('../models/GameConfig');
const LLMConfig = require('../models/LLMConfig');
const LLMCategoryGenerationHistory = require('../models/LLMCategoryGenerationHistory');
const LLMCardGenerationHistory = require('../models/LLMCardGenerationHistory');
const LLMInteractionHistory = require('../models/LLMInteractionHistory');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

let groq = null;
let globalGameConfig = {};
let llmConfigs = {};
let configsLoaded = false;
let cardImageFilenames = [];

const CARD_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const loadGameConfig = async () => {
  if (Object.keys(globalGameConfig).length === 0) { // Only load if not already loaded
    try {
      const configs = await GameConfig.findAll();
      globalGameConfig = configs.reduce((acc, config) => {
        acc[config.config_key] = parseInt(config.config_value, 10) || config.config_value;
        return acc;
      }, {});
      console.log('GameConfig loaded.');
    } catch (error) {
      console.error('Error loading GameConfig:', error);
      throw error;
    }
  }
};

const loadLLMConfigs = async () => {
  if (Object.keys(llmConfigs).length === 0) { // Only load if not already loaded
    try {
      const configs = await LLMConfig.findAll();
      // Clear existing properties to ensure a fresh load
      for (const key in llmConfigs) {
        delete llmConfigs[key];
      }
      configs.forEach(config => {
        llmConfigs[config.config_name] = config;
      });
      console.log('LLMConfig loaded.');
    } catch (error) {
      console.error('Error loading LLMConfig:', error);
      throw error;
    }
  }
};

const loadCardImages = async () => {
  try {
    const files = await fs.promises.readdir(CARD_IMAGES_DIR);
    cardImageFilenames = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    console.log(`Loaded ${cardImageFilenames.length} card images.`);
  } catch (error) {
    console.error('Error loading card images:', error);
    // It's okay to proceed without images if the directory is empty or doesn't exist
  }
};

// Combined function to ensure configs are loaded
const ensureConfigsLoaded = async () => {
  if (!configsLoaded) {
    await loadGameConfig();
    await loadLLMConfigs();
    await loadCardImages(); // Load card images
    // Initialize Groq after LLM configs are loaded
    if (!groq && llmConfigs.card_generator && llmConfigs.card_generator.llm_api_key) {
      groq = new Groq({
        apiKey: llmConfigs.card_generator.llm_api_key,
      });
      console.log('Groq SDK initialized with API key from DB.');
    } else if (!groq) {
      console.warn('Groq SDK not initialized: LLM API key not found in DB for card_generator.');
    }
    
    configsLoaded = true;
  }
};

// Export the initialize function and getters
exports.initialize = async () => {
  await ensureConfigsLoaded();
};

exports.getGlobalGameConfig = () => globalGameConfig;
exports.getLlmConfigs = () => llmConfigs;

exports.getCorruptionTypes = async (userId, cargo_actual, user_edad, user_ideologia, user_profile, idioma, num_tipos, playerLevel) => {
  await ensureConfigsLoaded(); // Ensure configs are loaded
  const config = llmConfigs.category_generator;
  if (!config) {
    throw new Error('LLM configuration for category_generator not found.');
  }

  // 1. Recuperación y Actualización del Historial
  const historyEntries = await LLMCategoryGenerationHistory.findAll({
    where: { user_id: userId },
    order: [['timestamp', 'DESC']],
  });

  let previousCategories = [];
  if (historyEntries.length > 0) {
    historyEntries.forEach(entry => {
      try {
        const parsedCategories = JSON.parse(entry.categories_generated);
        if (Array.isArray(parsedCategories)) {
          previousCategories = previousCategories.concat(parsedCategories);
        }
      } catch (parseError) {
        console.error('Error parsing categories_generated from history:', parseError);
      }
    });
    previousCategories = [...new Set(previousCategories)];
  }

  // 2. Construcción del Prompt para Groq
  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_edad}}/g, user_edad || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_ideologia}}/g, user_ideologia || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_profile}}/g, user_profile || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{num_tipos}}/g, num_tipos);
  humanPromptContent = humanPromptContent.replace(/{{categorias_previas}}/g, JSON.stringify(previousCategories));

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  // 3. Llamada al Modelo LLM de Groq con reintentos
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      
      const parsedResponse = JSON.parse(llmResponseContent);
      const categories = parsedResponse.categorias || [];

      // 4. Guardar en el Historial
      await LLMCategoryGenerationHistory.create({
        user_id: userId,
        timestamp: new Date(),
        prompt_sent: JSON.stringify(messages),
        llm_response: llmResponseContent,
        categories_generated: JSON.stringify(categories),
      });

      return categories;
    } catch (error) {
      console.error(`Error calling Groq API for corruption types (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

exports.getCards = async (userId, cargo_actual, tipo_de_corrupcion_elegido, idioma, playerLevel) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.card_generator;
  if (!config) {
    throw new Error('LLM configuration for card_generator not found.');
  }

  // 1. Recuperación y Actualización del Historial de Cartas
  const historyEntries = await LLMCardGenerationHistory.findAll({
    where: { user_id: userId },
    order: [['timestamp', 'DESC']],
  });

  let previousCards = [];
  if (historyEntries.length > 0) {
    historyEntries.forEach(entry => {
      try {
        const parsedCards = JSON.parse(entry.cards_generated);
        if (Array.isArray(parsedCards)) {
          previousCards = previousCards.concat(parsedCards);
        }
      } catch (parseError) {
        console.error('Error parsing cards_generated from history:', parseError);
      }
    });
    // Consider a more sophisticated way to handle previous cards if needed,
    // e.g., filtering by type or ensuring uniqueness based on title.
  }

  // 2. Construcción del Prompt para Groq
  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tipo_de_corrupcion_elegido}}/g, tipo_de_corrupcion_elegido || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{num_cartas}}/g, globalGameConfig.NUM_CORRUPTION_CARDS || 5);
  humanPromptContent = humanPromptContent.replace(/{{cartas_previas}}/g, JSON.stringify(previousCards));

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  // 3. Llamada al Modelo LLM de Groq con reintentos
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      
      const parsedResponse = JSON.parse(llmResponseContent);
      // Groq might return 'subopciones' or 'options'
      const cards = parsedResponse.subopciones || parsedResponse.options || [];

      // Add a random image URL to each card
      const cardsWithImages = cards.map(card => {
        const randomImage = cardImageFilenames[Math.floor(Math.random() * cardImageFilenames.length)];
        const imageUrl = randomImage ? `/images/cards/${randomImage}` : null;
        return { ...card, image_url: imageUrl };
      });

      // 4. Guardar en el Historial
      await LLMCardGenerationHistory.create({
        user_id: userId,
        timestamp: new Date(),
        prompt_sent: JSON.stringify(messages),
        llm_response: llmResponseContent,
        cards_generated: JSON.stringify(cardsWithImages),
      });

      return cardsWithImages;
    } catch (error) {
      console.error(`Error calling Groq API for cards (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

exports.evaluatePlan = async (userId, cargo_actual, titulo_accion_elegida, tags_accion_elegida, plan_del_jugador, idioma, currentLevel) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.plan_evaluator;
  if (!config) {
    throw new Error('LLM configuration for plan_evaluator not found.');
  }

  // 1. Construcción del Prompt para Groq
  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{titulo_accion_elegida}}/g, titulo_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tags_accion_elegida}}/g, Array.isArray(tags_accion_elegida) ? tags_accion_elegida.join(', ') : tags_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{plan_del_jugador}}/g, plan_del_jugador || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  // 2. Llamada al Modelo LLM de Groq con reintentos
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      console.log('Raw LLM response for plan evaluation:', llmResponseContent);
      const parsedResponse = JSON.parse(llmResponseContent);

      // 3. Guardar en el Historial de Interacciones
      console.log(`Saving LLMInteractionHistory with level: ${currentLevel}`);
      await LLMInteractionHistory.create({
        user_id: userId,
        timestamp: new Date(),
        level: currentLevel, // Use currentLevel
        action_title: titulo_accion_elegida, // Add action_title to history
        narrated_plan_text: plan_del_jugador,
        human_prompt_sent: JSON.stringify(messages), // Store the full prompt sent
        llm_response: llmResponseContent,
        llm_evaluation_json: parsedResponse.llm_evaluation_json || {},
        llm_advice_json: parsedResponse.llm_advice_json || {},
      });

      return {
        llm_evaluation_json: parsedResponse.llm_evaluation_json || {},
        llm_advice_json: parsedResponse.llm_advice_json || {},
      };
    } catch (error) {
      console.error(`Error calling Groq API for plan evaluation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

exports.generateScandalHeadline = async (userId, cargo_actual, idioma, be_actual) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.scandal_headline_generator;
  if (!config) {
    throw new Error('LLM configuration for scandal_headline_generator not found.');
  }

  console.log('Scandal Headline Generator Config:', config);

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{be_actual}}/g, be_actual);

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      let llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(llmResponseContent);
      } catch (parseError) {
        console.warn('JSON parse failed, attempting to fix unescaped/over-escaped quotes in scandal headline:', parseError.message);

        // Attempt to fix over-escaped backslashes before quotes (e.g., \" to \")
        let correctedContent = llmResponseContent.replace(/\\"/g, '"');

        try {
          parsedResponse = JSON.parse(correctedContent);
        } catch (retryParseError1) {
          // If still fails, try the original logic for unescaped quotes (e.g., " to \")
          const headlineRegex = /"titular_escandalo":\s*"([^"]*)"/;
          const match = correctedContent.match(headlineRegex);

          if (match && match[1]) {
            const originalHeadline = match[1];
            // Escape only unescaped double quotes within the headline content
            const escapedHeadline = originalHeadline.replace(/(?<!\\)"/g, '\"');
            correctedContent = correctedContent.replace(originalHeadline, escapedHeadline);
            try {
              parsedResponse = JSON.parse(correctedContent);
            } catch (retryParseError2) {
              console.error('Failed to parse JSON even after multiple attempts to fix quotes:', retryParseError2);
              throw retryParseError2; // Re-throw if still unable to parse
            }
          } else {
            throw parseError; // Re-throw original error if headline not found or other parse issue
          }
        }
      }

      const headline = parsedResponse.titular_escandalo || "Un nuevo escándalo sacude la política.";

      return headline;
    } catch (error) {
      console.error(`Error calling Groq API for scandal headline (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

exports.generateDevPlan = async (titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, quality_level, idioma) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.plan_generator_dev;
  if (!config) {
    throw new Error('LLM configuration for plan_generator_dev not found.');
  }

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{titulo_accion_elegida}}/g, titulo_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{descripcion_accion_elegida}}/g, descripcion_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tags_accion_elegida}}/g, Array.isArray(tags_accion_elegida) ? tags_accion_elegida.join(', ') : tags_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{quality_level}}/g, quality_level || 'bueno');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '';
      
      return llmResponseContent;
    } catch (error) {
      console.error(`Error calling Groq API for dev plan generation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};