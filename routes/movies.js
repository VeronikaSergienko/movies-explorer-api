const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getMovies, createMovie, deleteMovie,
} = require('../controllers/movies');

router.get('/', getMovies);

router.post('/', celebrate({
  body: Joi.object().keys({
    country: Joi.string().required(true),
    director: Joi.string().required(true),
    duration: Joi.number().required(true),
    year: Joi.number().required(true),
    description: Joi.string().required(true),
    image: Joi.string().required(true),
    trailerLink: Joi.string().required(true),
    thumbnail: Joi.string().required(true),
    nameRU: Joi.string().required(true),
    nameEN: Joi.string().required(true),
    movieId: Joi.number().required(true),
  }),
}), createMovie);

router.delete('/:movieId', celebrate({
  params: Joi.object().keys({
    movieId: Joi.string().alphanum().length(24).hex(),
  }),
}), deleteMovie);

module.exports = router;
