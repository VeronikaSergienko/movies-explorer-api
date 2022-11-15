const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  patchUserId, getProfile,
} = require('../controllers/users');

// # возвращает информацию о пользователе (email и имя)
// GET /users/me
router.get('/me', getProfile);

// # обновляет информацию о пользователе (email и имя)
// PATCH /users/me
router.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    email: Joi.string().required().email(),
  }),
}), patchUserId);

module.exports = router;
