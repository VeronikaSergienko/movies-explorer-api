const errorsHandler = (err, req, res, next) => {
  // если у ошибки нет статуса, выставляем 500
  const { statusCode = 500, message } = err;
  res.status(statusCode).json({ message: statusCode === 500 ? 'На сервере произошла ошибка' : message });
  next();
};

module.exports = { errorsHandler };
