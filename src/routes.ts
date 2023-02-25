import { Router } from 'express';
import { sendTransaction } from '@astar-network/astar-sdk-core';
import { config } from './config';
import * as helpers from './helpers';

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
    const hexName = result.asOk.data.toString();

    const accountName = helpers.hexToUtf8String(hexName);

    console.log(`Loaded hash: ${hexName}. Converting to: ${accountName}`);

    return res.status(200).json({ message: { name: accountName } });
});

routes.post('/register', async (req, res) => {
    const account = req.body.account as string;
    const name = req.body.name as string;

    if (!req.session.isValidated) {
        return res.status(403).json({ error: 'The request is not valid.' });
    }

    if (!account || !name) {
        return res.status(400).json({ error: 'Account or name was not provided in the body.' });
    }

    const contractApi = req.networkInst.contractApi;
    const chainApi = req.networkInst.chainApi;
    const adminAccount = req.networkInst.accountPair;

    // convert the name into a hex string
    const encodedName = helpers.utf8StringToHex(name);
    console.log(`Provided name: ${name}. Converting to: ${encodedName}`);

    try {
        const result = await sendTransaction(
            chainApi,
            contractApi,
            'forceRegister',
            adminAccount.address,
            0,
            encodedName,
            account,
        );

        const unsub = await result.signAndSend(adminAccount, (txRes) => {
            if (txRes.status.isFinalized) {
                unsub();
            }
            if (txRes.isError) {
                throw new Error(txRes.dispatchError.toHuman().toString());
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    return res.status(200).json({ message: `Transaction successfully submitted!` });
});

routes.post('/validate', (req, res) => {
    // expect an account and name
    const session = req.session.id;

    if (req.session.isValidated) {
        return res.status(400).json({ message: `User session is already valid.` });
    }

    // note: this is not a great way to validate sessions as it's easy to spoof the origin host.
    if (config.isProduction && req.hostname === config.clientDomain) {
        return res.status(400).json({ message: 'Invalid request origin' });
    }

    // todo: implement this
    req.session.isValidated = true;
    return res.status(200).json({ message: `Validate session for ID ${session}.` });
});

export default routes;
