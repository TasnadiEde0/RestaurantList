import express from 'express';
import { join } from 'path';
import morgan from 'morgan';
import session from 'express-session';
import router from './routes/router.js';

const app = express();
app.set('view engine', 'ejs');
app.use(morgan('tiny'));
app.use(express.static(join(process.cwd(), 'static')));

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(router);

app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080/ ...');
});
