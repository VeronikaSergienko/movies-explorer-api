const Movie = require('../models/movie');
const NotFound = require('../errors/NotFound');
const ForbiddenError = require('../errors/ForbiddenError');
const ValidationError = require('../errors/ValidationError');

// GET /movies — возвращает все фильмы
const getMovies = (req, res, next) => {
  Movie.find({})
    .then((movies) => {
      res.send(movies);
    })
    .catch(next);
};

// POST # создаёт фильм с переданными
// # country, director, duration, year, description,
// image, trailer, nameRU, nameEN и thumbnail, movieId
const createMovie = (req, res, next) => {
  const {
    country, director, duration, year, description, image, trailerLink, nameRU, nameEN, thumbnail,
  } = req.body;
  const ownerId = req.user._id;
  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    owner: ownerId,
  })
    .then((movie) => {
      if (!movie) {
        throw new NotFound('Фильм с указанным _id не найден.');
      }
      res.send(movie);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

// DELETE — удаляет фильм по идентификатору
const deleteMovie = (req, res, next) => {
  const ownerId = req.user._id;
  Movie.findById(req.params.movieId)
    .orFail(new NotFound('Фильм не найден'))
    .then((movie) => {
      if (ownerId === movie.owner.toString()) {
        movie.delete()
          .then(() => res.status(200).json({ message: 'Запись успешно удалена' }));
      } else { throw new ForbiddenError('Запись может удалять только владелец записи.'); }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new NotFound('не корректный id'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getMovies, createMovie, deleteMovie,
};
