const User = require('../models/User');
const UserGameState = require('../models/UserGameState');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nickname, email, password, avatar_url, selected_language, country_of_origin, age, political_ideology, personal_profile } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    user = await User.create({
      nickname,
      email,
      password_hash,
      avatar_url,
      selected_language,
      country_of_origin,
      age,
      political_ideology,
      personal_profile,
    });

    await UserGameState.create({ user_id: user.id });

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { nickname, password } = req.body;

  try {
    let user = await User.findOne({ where: { nickname } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    await user.update({ last_login_timestamp: new Date() });

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }, // Excluir el hash de la contraseña
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  const { country_of_origin, age, political_ideology, personal_profile, avatar_url, selected_language } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.country_of_origin = country_of_origin;
    user.age = age;
    user.political_ideology = political_ideology;
    user.personal_profile = personal_profile;
    user.avatar_url = avatar_url;
    user.selected_language = selected_language;

    await user.save();

    res.json({ msg: 'Profile updated successfully', user: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
