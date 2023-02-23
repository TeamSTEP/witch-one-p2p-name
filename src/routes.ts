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

    if (!req.session.isValidated) {
        return res.status(403).json({ error: 'The request is not valid.' });
    }

    console.log(req.body);

    if (!account || !name) {
        return res.status(400).json({ error: 'Account or name was not provided in the body.' });
    }

    const contractApi = req.networkInst.contractApi;
    const adminAccount = req.networkInst.accountPair;

    let responseMsg = '';

    try {
        // error happens here with the type gen
        await contractApi.tx
            .forceRegister({ gasLimit: req.networkInst.gasLimit }, name, account)
            .signAndSend(adminAccount, (result) => {
                if (result.status.isFinalized) {
                    responseMsg = 'transaction finalized';
                }

                if (result.isError) {
                    responseMsg = result.dispatchError.toHuman().toString();
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
