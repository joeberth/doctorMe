import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import './database';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(process.env.PORT, () => {
  console.log(`Back-end started on ${process.env.PORT}!`);
});
