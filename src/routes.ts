import { Router } from 'express';
import { sendTransaction } from '@astar-network/astar-sdk-core';

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

    return res.status(200).json({ message: `The admin account is ${adminAccount}` });
});

routes.get('/name/:account', async (req, res) => {
    const account = req.params.account;
    // fetch the name of the given address if any
    const { result } = await req.networkInst.contractApi.query.nameOf(
        req.networkInst.accountPair.address,
        {
            gasLimit: req.networkInst.gasLimit,
        },
        account,
    );
    // convert the result to a readable format
    const accountName = result.asOk.data.toString();

    return res.status(200).json({ message: { name: accountName } });
});

routes.post('/register', async (req, res) => {
    const account = req.body.account as string;
    const name = req.body.name as string;
    console.log(`Incoming register request from ${req.get('origin')}`);

    if (!req.session.isValidated) {
        return res.status(403).json({ error: 'The request is not valid.' });
    }

    if (!account || !name) {
        return res.status(400).json({ error: 'Account or name was not provided in the body.' });
    }

    const contractApi = req.networkInst.contractApi;
    const chainApi = req.networkInst.chainApi;
    const adminAccount = req.networkInst.accountPair;

    let responseMsg = '';

    try {
        const result = await sendTransaction(
            chainApi,
            contractApi,
            'forceRegister',
            adminAccount.address,
            1,
            name,
            account,
        );

        const unsub = await result.signAndSend(adminAccount.address, (txRes) => {
            if (txRes.status.isFinalized) {
                responseMsg = 'transaction finalized';
                unsub();
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    return res.status(200).json({ message: `Transaction message ${responseMsg}.` });
});

routes.post('/validate', (req, res) => {
    // expect an account and name
    const session = req.session.id;

    if (req.session.isValidated) {
        return res.status(400).json({ message: `User session is already valid.` });
    }

    // todo: implement this
    req.session.isValidated = true;
    return res.status(200).json({ message: `Validate session for ID ${session}.` });
});

export default routes;
