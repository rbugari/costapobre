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
  {
    config_key: 'MONETIZACION_NIVEL_PREMIUM',
    config_value: '2',
    description: 'Nivel mínimo a partir del cual se requiere pago.',
  },
  {
    config_key: 'PRECIO_PREMIUM_PASS',
    config_value: '2',
    description: 'Precio del pase completo para desbloquear niveles.',
  },
  {
    config_key: 'PRECIO_RESCATE_ESCANDALO',
    config_value: '1',
    description: 'Precio del rescate por BE >= 80.',
  },
  {
    config_key: 'PRECIO_TOTAL_DESBLOQUEO',
    config_value: '3',
    description: 'Precio total (combo) que otorga inmunidad a Game Over.',
  },
  {
    config_key: 'UMBRAL_ESCANDALO_MINIMO',
    config_value: '80',
    description: 'Valor BE a partir del cual se muestra opción de rescate.',
  },
  {
    config_key: 'UMBRAL_GAMEOVER',
    config_value: '90',
    description: 'Valor BE a partir del cual se activa el Game Over.',
  },
  {
    config_key: 'VALOR_BE_REINICIO_PAGO',
    config_value: '40',
    description: 'Valor fijo de BE al reiniciar tras degradación.',
  },
  {
    config_key: 'REINICIAR_RECURSOS_CON_CAIDA',
    config_value: 'true',
    description: 'Si se reinician PC/INF al bajar de nivel tras escándalo.',
  },
  {
    config_key: 'INVITADO_MAX_ANUNCIOS',
    config_value: '3',
    description: 'Cantidad máxima de anuncios recompensados que puede ver un invitado.',
  },
  {
    config_key: 'GAME_MODE',
    config_value: 'desarrollo',
    description: 'Modo de ejecución del juego (desarrollo o produccion).',
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
