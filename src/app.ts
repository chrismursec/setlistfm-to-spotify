import { config } from 'dotenv';
import express, { Express, json, urlencoded } from 'express';
import path from 'path';
import APIRoutes from './routes/APIRoutes';
import DocumentRoutes from './routes/DocumentRoutes';
config();

const app: Express = express();

app.use(json());
app.use(
	urlencoded({
		extended: true
	})
);

app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/', DocumentRoutes);
app.use('/api', APIRoutes);

export default app;
