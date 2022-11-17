const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFound = require('../errors/NotFound');
const AuthorizedError = require('../errors/AuthorizedError');
const ValidationError = require('../errors/ValidationError');
const ConflictError = require('../errors/ConflictError');

const { NODE_ENV, JWT_SECRET } = process.env;

// POST /signin — логинит пользователя
const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findOne({ email }).select('+password')
    .orFail(new AuthorizedError('Передан неверный логин или пароль'))
    .then((user) => {
      bcrypt.compare(password, user.password, (err, isValidPassword) => {
        if (!isValidPassword) {
          return next(new AuthorizedError('Передан неверный логин или пароль'));
        }
        const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
        return res.status(200).send({ token });
      });
    })
    .catch((err) => next(err));
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
      name, email, _id,
    }) => {
      res.send({
        name, email, _id,
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError('Пользователь с таким email уже существует'));
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
      if (err.code === 11000) {
        next(new ConflictError('Пользователь с таким email уже существует'));
      } else if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  createUser, patchUserId, login, getProfile,
};
