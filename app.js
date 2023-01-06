require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {
  celebrate, Joi, errors,
} = require('celebrate');
const mongoose = require('mongoose');
const path = require('path');
const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const {
  login, createUser,
} = require('./controllers/users');

const { errorsHandler } = require('./middlewares/errorsHandler');
const cors = require('./middlewares/cors');

const { PORT = 4000, DATABASE_URL, NODE_ENV } = process.env;
const app = express();
app.use(cors);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
const NotFound = require('./errors/NotFound');

app.use(express.static(path.join(__dirname, 'public')));

// подключаемся к серверу mongo
mongoose.connect(NODE_ENV === 'production' ? DATABASE_URL : 'mongodb://localhost:27017/moviesdb');

app.use(requestLogger); // подключаем логгер запросов

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), createUser);

// авторизация
app.use(auth);

app.use('/users', require('./routes/users'));
app.use('/movies', require('./routes/movies'));

app.use('/*', (req, res, next) => {
  next(new NotFound('Запрашиваемый ресурс не найден'));
});

// обработчики ошибок
app.use(errorLogger); // подключаем логгер ошибок
app.use(errors()); // обработчик ошибок celebrate

app.use(errorsHandler);

app.listen(PORT);
