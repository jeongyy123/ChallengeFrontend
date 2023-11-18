import express from 'express';
import Categoriesrouter from './routes/categories.router.js';
import MenusRouter from './routes/menus.router.js';
import UsersRouter from './routes/users.router.js';
import cookieParser from 'cookie-parser';
import logMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 3333;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api', [Categoriesrouter, MenusRouter, UsersRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
