import { Router } from 'express';

const routes = Router();

routes.get('/', (req, res) => {
    return res.json({ message: 'Hello World' });
});

routes.get('/app', (req, res) => {
    return res.json({ message: '<h1>Oh you found me!</h1>' });
});

export default routes;
