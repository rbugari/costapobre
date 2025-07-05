const { sequelize } = require('../config/db');
const GameLevel = require('../models/GameLevel');

const gameLevelsData = [
  {
    level_number: 1,
    title: 'Concejal Municipal',
    pc_required_for_ascension: 100,
    inf_required_for_ascension: 10,
    pc_gain_factor: 1,
    character_image_url: '/images/avatar_level_1.png',
    description_visual: 'Un político novato con más ambición que escrúpulos.'
  },
  {
    level_number: 2,
    title: 'Alcalde',
    pc_required_for_ascension: 500,
    inf_required_for_ascension: 50,
    pc_gain_factor: 2,
    character_image_url: '/images/avatar_level_2.png',
    description_visual: 'El poder local es el primer paso hacia la verdadera riqueza.'
  },
  {
    level_number: 3,
    title: 'Gobernador Provincial',
    pc_required_for_ascension: 2000,
    inf_required_for_ascension: 200,
    pc_gain_factor: 4,
    character_image_url: '/images/avatar_level_3.png',
    description_visual: 'Controlando una provincia entera, las oportunidades de corrupción se multiplican.'
  },
  {
    level_number: 4,
    title: 'Congresista / Diputado',
    pc_required_for_ascension: 8000,
    inf_required_for_ascension: 500,
    pc_gain_factor: 8,
    character_image_url: '/images/avatar_level_4.png',
    description_visual: 'Ahora en la legislatura nacional, las leyes se pueden torcer a tu favor.'
  },
  {
    level_number: 5,
    title: 'Senador',
    pc_required_for_ascension: 25000,
    inf_required_for_ascension: 1500,
    pc_gain_factor: 16,
    character_image_url: '/images/avatar_level_5.png',
    description_visual: 'En la cámara alta, los secretos de estado y los grandes contratos están a tu alcance.'
  },
  {
    level_number: 6,
    title: 'Ministro del Interior',
    pc_required_for_ascension: 100000,
    inf_required_for_ascension: 5000,
    pc_gain_factor: 32,
    character_image_url: '/images/avatar_level_6.png',
    description_visual: 'Con el control de la seguridad nacional, nadie puede detenerte.'
  },
  {
    level_number: 7,
    title: 'Presidente de la Nación',
    pc_required_for_ascension: 999999999, // Nivel final
    inf_required_for_ascension: 999999999,
    pc_gain_factor: 64,
    character_image_url: '/images/avatar_level_7.png',
    description_visual: 'La cima del poder. Costa Pobre es tuya.'
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
