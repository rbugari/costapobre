const GameConfig = require('../models/GameConfig');

let globalGameConfig = {};

const loadGameConfig = async () => {
  try {
    const configs = await GameConfig.findAll();
    globalGameConfig = configs.reduce((acc, config) => {
      acc[config.config_key] = parseInt(config.config_value, 10) || config.config_value;
      return acc;
    }, {});
    console.log('Configuración de juego cargada:', globalGameConfig);
  } catch (error) {
    console.error('Error cargando la configuración del juego:', error);
  }
};

// Cargar la configuración al iniciar el servicio
loadGameConfig();

exports.getCorruptionTypes = async (cargo_actual, idioma, country_of_origin, age, political_ideology, personal_profile) => {
  // Mock implementation for FlowiseAI Flujo 1: "Generador de Categorías"
  const num_corruption_types = globalGameConfig.NUM_CORRUPTION_TYPES || 10; // Fallback a 10
  console.log(`Mock AI: Generating ${num_corruption_types} corruption types for ${cargo_actual} in ${idioma} (Country: ${country_of_origin}, Age: ${age}, Ideology: ${political_ideology})`);
  // Generar un array de mock data con la longitud especificada
  const mockTypes = Array.from({ length: num_corruption_types }, (_, i) => `Tipo de Corrupción ${i + 1}`);
  return mockTypes;
};

exports.getCards = async (cargo_actual, tipo_de_corrupcion_elegido, idioma, country_of_origin, age, political_ideology, personal_profile) => {
  // Mock implementation for FlowiseAI Flujo 2: "Generador de Cartas"
  const num_corruption_cards = globalGameConfig.NUM_CORRUPTION_CARDS || 5; // Fallback a 5
  console.log(`Mock AI: Generating ${num_corruption_cards} cards for ${tipo_de_corrupcion_elegido} at ${cargo_actual} in ${idioma} (Country: ${country_of_origin}, Age: ${age}, Ideology: ${political_ideology})`);
  // Generar un array de mock data con la longitud especificada
  const mockCards = Array.from({ length: num_corruption_cards }, (_, i) => ({
    "titulo": `Sub-opción ${i + 1} de ${tipo_de_corrupcion_elegido}`,
    "descripcion": `Descripción de la sub-opción ${i + 1}.`,
    "imagen_base64": `mock_image_base64_${i + 1}`,
    "tags_obligatorios": [`tag${i + 1}a`, `tag${i + 1}b`, `tag${i + 1}c`]
  }));
  return mockCards;
};

exports.evaluatePlan = async (cargo_actual, titulo_accion_elegida, tags_accion_elegida, plan_del_jugador, idioma, country_of_origin, age, political_ideology, personal_profile) => {
  // Mock implementation for FlowiseAI Flujo 3: "Evaluador de Planes"
  console.log(`Mock AI: Evaluating plan for ${titulo_accion_elegida} at ${cargo_actual} in ${idioma} (Country: ${country_of_origin}, Age: ${age}, Ideology: ${political_ideology})`);
  console.log(`Plan: ${plan_del_jugador} with tags: ${tags_accion_elegida}`);

  // Simple mock evaluation logic
  let evaluation = "";
  let advice = "";
  let score_change = 0;

  if (plan_del_jugador.includes("éxito") || plan_del_jugador.includes("ganar")) {
    evaluation = "Tu plan es audaz y promete grandes recompensas. ¡Bien hecho!";
    advice = "Asegúrate de cubrir tus huellas para evitar sorpresas.";
    score_change = 50;
  } else if (plan_del_jugador.includes("fallo") || plan_del_jugador.includes("perder")) {
    evaluation = "Tu plan parece tener algunas debilidades. Necesitas ser más astuto.";
    advice = "Reconsidera tus pasos y busca puntos ciegos.";
    score_change = -20;
  } else {
    evaluation = "Un plan decente, pero podría ser más ambicioso.";
    advice = "Piensa en cómo maximizar tus ganancias y minimizar los riesgos.";
    score_change = 20;
  }

  return {
    llm_evaluation_json: {
      evaluation,
      pc_ganancia: { valor: Math.floor(Math.random() * 10) + 1 }, // Valor entre 1 y 10
      be_aumento: { valor: Math.floor(Math.random() * 10) + 1 }, // Valor entre 1 y 10
      inf_ganancia: { valor: Math.floor(Math.random() * 10) + 1 }, // Valor entre 1 y 10
    },
    llm_advice_json: { advice },
  };
};

exports.generateScandalHeadline = async (cargo_actual, idioma, be_actual) => {
  console.log(`Mock AI: Generating scandal headline for ${cargo_actual} with BE ${be_actual} in ${idioma}`);
  const headlines = [
    `¡${cargo_actual} sorprendido usando helicóptero oficial para ir de pesca!`, 
    `Escándalo: ${cargo_actual} involucrado en trama de corrupción masiva.`, 
    `¡${cargo_actual} pillado en fiesta ilegal con fondos públicos!`, 
    `Crisis en ${cargo_actual}: Acusaciones de malversación de fondos.`, 
    `La reputación de ${cargo_actual} por los suelos tras nuevas revelaciones.`
  ];
  const randomIndex = Math.floor(Math.random() * headlines.length);
  return headlines[randomIndex];
};
