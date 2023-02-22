import { Router } from 'express';

const routes = Router();

routes.get('/', (req, res) => {
    return res.json({ message: 'Hello World' });
});

routes.post('/register', (req, res) => {
    // expect an account and
    return res.json({ message: 'registering account' });
});

routes.post('/validate', (req, res) => {
    return res.status(200).json({ message: 'validated' });
});

export default routes;
