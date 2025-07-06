const { sequelize } = require('../config/db');
const GameConfig = require('../models/GameConfig');

const gameConfigData = [
  {
    config_key: 'NUM_CORRUPTION_TYPES',
    config_value: '10',
    description: 'Número de tipos de corrupción para la ruleta.',
  },
  {
    config_key: 'NUM_CORRUPTION_CARDS',
    config_value: '5',
    description: 'Número de sub-opciones (cartas) por tipo de corrupción.',
  },
  {
    config_key: 'MAX_RECORDING_SECONDS',
    config_value: '30',
    description: 'Tiempo máximo de grabación de voz en segundos.',
  },
  {
    config_key: 'MAX_PLAN_WORDS',
    config_value: '150',
    description: 'Número máximo de palabras para el plan del jugador.',
  },
];

const seedGameConfig = async () => {
  try {
    await sequelize.sync({ alter: true }); // Sincroniza los modelos, alterando la tabla si es necesario

    for (const configItem of gameConfigData) {
      const [config, created] = await GameConfig.findOrCreate({
        where: { config_key: configItem.config_key },
        defaults: configItem
      });

      if (created) {
        console.log(`Configuración '${config.config_key}' creada.`);
      } else {
        await GameConfig.update(configItem, { where: { config_key: configItem.config_key } });
        console.log(`Configuración '${config.config_key}' actualizada.`);
      }
    }

    console.log('Seeding de configuración de juego completado.');
  } catch (error) {
    console.error('Error durante el seeding de configuración de juego:', error);
  } finally {
    await sequelize.close();
  }
};

seedGameConfig();
