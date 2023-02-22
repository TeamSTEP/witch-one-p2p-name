import { Router } from 'express';

const routes = Router();

routes.get('/', (req, res) => {
    return res.json({ message: 'Hello World' });
});

routes.get('/admin-address', async (req, res) => {
    // fetch contract admin address
    const { result } = await req.networkInst.contractApi.query.getAdmin(req.networkInst.accountPair.address, {
        gasLimit: req.networkInst.gasLimit,
    });
    // convert the result to a readable format
    const adminAccount = result.asOk.data.toString();

    return res
        .status(200)
        .json({ message: `The admin account is ${adminAccount}` });
})

routes.post('/register', async (req, res) => {
    // expect an account and name
    const session = req.session.id;

    return res
        .status(200)
        .json({ message: `Registering account session ${session}.` });
});

routes.post('/validate', (req, res) => {
    // expect an account and name
    const session = req.session.id;
    
    return res.status(200).json({ message: `Validate session for ID ${session}.` });
});

export default routes;
