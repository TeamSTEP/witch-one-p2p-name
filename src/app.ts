import express, { Express } from 'express';
import routes from './routes';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { WeightV2 } from '@polkadot/types/interfaces';
import { waitReady } from '@polkadot/wasm-crypto';
import { appRateLimiter, config } from './config';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import session from 'express-session';

// Fix for breaking change introduced in polkadot js v7.x
// https://polkadot.js.org/docs/api/FAQ/#since-upgrading-to-the-7x-series-typescript-augmentation-is-missing
import '@polkadot/api-augment';

class App {
    public server: Express;
    public blockchainApi: ApiPromise;
    public contractApi: ContractPromise;
    public gasLimit: WeightV2;
    public keyring: Keyring;

    constructor() {
        console.log('Starting the server');
        this.server = express();

        this.initBlockchainInst().then(() => {
            console.log('Connected to the network');
        });

        this.middlewares();
        this.routes();
    }

    async initBlockchainInst() {
        await waitReady();
        const keyring = new Keyring({ type: 'sr25519' });
        const newPair = keyring.addFromMnemonic(config.adminSeed, { name: 'admin' });
        this.keyring = keyring;

        const wsProvider = new WsProvider('wss://rpc.shibuya.astar.network');
        const api = await (await ApiPromise.create({ provider: wsProvider })).isReady;
        this.blockchainApi = api;

        const abi = new Abi(config.contractInterface, api.registry.getChainProperties());

        this.contractApi = new ContractPromise(api, abi, config.contractAddr);

        const gasLimit = api.registry.createType('WeightV2', api.consts.system.blockWeights['maxBlock']);

        this.gasLimit = gasLimit;
        
        // the below is only for testing
        const { gasRequired, result, output } = await this.contractApi.query.getAdmin(newPair.address, {
            gasLimit,
        });

        console.log({ gasRequired, result: result.toHuman(), output: output.toHuman() });
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(appRateLimiter);
        this.server.use(helmet());
        this.server.use(cors());
        this.server.use(bodyParser.json());
        this.server.use(morgan('combined'));
        this.server.use(
            session({
                secret: '',
                resave: false,
                saveUninitialized: true,
            }),
        );
    }

    routes() {
        this.server.use(routes);
    }
}

export default new App().server;
