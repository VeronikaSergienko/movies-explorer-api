const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFound = require('../errors/NotFound');
const AuthorizedError = require('../errors/AuthorizedError');
const ValidationError = require('../errors/ValidationError');

const { NODE_ENV, JWT_SECRET } = process.env;

// POST /signin — логинит пользователя
const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        throw new AuthorizedError({ message: 'Передан неверный логин или пароль' });
      }
      bcrypt.compare(password, user.password, (err, isValidPassword) => {
        if (!isValidPassword) {
          throw new AuthorizedError('Передан неверный логин или пароль');
        }
        const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
        return res.status(200).send({ token });
      });
    })
    .catch(next);
};

// GET /users — возвращает всех пользователей
const getUser = (req, res, next) => {
  User.find({})
    .then((user) => res.send(user))
    .catch(next);
};

// POST /signup — создаёт пользователя
const createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then((hash) => User.create({
      name: req.body.name,
      email: req.body.email,
      password: hash,
    }))
    .then(({
      name, email, createdAt, _id,
    }) => {
      res.send({
        name, email, createdAt, _id,
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res.status(409).json({ message: 'Пользователь с таким email уже существует' });
      } else if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

// GET /users/me - возвращает информацию о текущем пользователе
const getProfile = (req, res, next) => {
  const ownerId = req.user._id;
  User.findById(ownerId)
    .orFail(new NotFound('Пользователь не найден'))
    .then((user) => {
      if (!user) {
        throw new NotFound('Нет пользователя с таким id');
      }
      res.send(user);
    })
    .catch(next);
};

// PATCH /users/me — обновляет профиль
const patchUserId = (req, res, next) => {
  const { name, email } = req.body;
  const ownerId = req.user._id;
  User.findByIdAndUpdate(ownerId, { name, email }, { new: true, runValidators: true })
    .orFail(new NotFound('Пользователь не найден'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getUser, createUser, patchUserId, login, getProfile,
};
