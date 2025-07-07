const { sequelize } = require('../config/db');
const GameLevel = require('../models/GameLevel');

const gameLevelsData = [
  {
    level_number: 1,
    title: 'Concejal Municipal',
    pc_required_for_ascension: 8000,
    inf_required_for_ascension: 20,
    pc_gain_factor: 1500,
    inf_gain_factor: 1.00,
    character_image_url: '/images/avatar_level_1.png',
    description_visual: 'Andrajoso, hambriento, con una mirada astuta.'
  },
  {
    level_number: 2,
    title: 'Alcalde/Intendente',
    pc_required_for_ascension: 40000,
    inf_required_for_ascension: 40,
    pc_gain_factor: 6000,
    inf_gain_factor: 1.25,
    character_image_url: '/images/avatar_level_2.png',
    description_visual: 'Traje barato pero nuevo, un poco más de peso, sonrisa forzada.'
  },
  {
    level_number: 3,
    title: 'Diputado Provincial',
    pc_required_for_ascension: 200000,
    inf_required_for_ascension: 60,
    pc_gain_factor: 25000,
    inf_gain_factor: 1.50,
    character_image_url: '/images/avatar_level_3.png',
    description_visual: 'Traje a medida, reloj visible, expresión de suficiencia.'
  },
  {
    level_number: 4,
    title: 'Gobernador',
    pc_required_for_ascension: 1200000,
    inf_required_for_ascension: 75,
    pc_gain_factor: 120000,
    inf_gain_factor: 2.00,
    character_image_url: '/images/avatar_level_4.png',
    description_visual: 'Traje de marca de lujo, gesticula con arrogancia, peinado impecable.'
  },
  {
    level_number: 5,
    title: 'Senador Nacional',
    pc_required_for_ascension: 8000000,
    inf_required_for_ascension: 90,
    pc_gain_factor: 750000,
    inf_gain_factor: 2.50,
    character_image_url: '/images/avatar_level_5.png',
    description_visual: 'Opulencia discreta pero evidente, mirada condescendiente.'
  },
  {
    level_number: 6,
    title: 'Ministro',
    pc_required_for_ascension: 45000000,
    inf_required_for_ascension: 95,
    pc_gain_factor: 3500000,
    inf_gain_factor: 3.00,
    character_image_url: '/images/avatar_level_6.png',
    description_visual: 'Opulencia descarada, rodeado de asesores y guardaespaldas temerosos.'
  },
  {
    level_number: 7,
    title: 'Presidente de la Nación',
    pc_required_for_ascension: 999999999, // Nivel final
    inf_required_for_ascension: 999999999,
    pc_gain_factor: 10000000,
    inf_gain_factor: 4.00,
    character_image_url: '/images/avatar_level_7.png',
    description_visual: 'Apariencia de estadista, con banda presidencial, sonrisa falsa.'
  }
];

const seedGameLevels = async () => {
  try {
    await sequelize.sync({ alter: true }); // Sincroniza los modelos, alterando la tabla si es necesario

    for (const levelData of gameLevelsData) {
      const [level, created] = await GameLevel.findOrCreate({
        where: { level_number: levelData.level_number },
        defaults: levelData
      });

      if (created) {
        console.log(`Nivel ${level.level_number} (${level.title}) creado.`);
      } else {
        // Si el nivel ya existe, actualiza sus datos
        await GameLevel.update(levelData, { where: { level_number: levelData.level_number } });
        console.log(`Nivel ${level.level_number} (${level.title}) actualizado.`);
      }
    }

    console.log('Seeding de niveles de juego completado.');
  } catch (error) {
    console.error('Error durante el seeding de niveles de juego:', error);
  } finally {
    await sequelize.close();
  }
};

seedGameLevels();
