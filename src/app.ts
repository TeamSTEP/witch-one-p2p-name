import express, { Express } from 'express';
import routes from './routes';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { waitReady } from '@polkadot/wasm-crypto';
import { appRateLimiter, config } from './config';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import session from 'express-session';
import { NetworkInst } from './types';

class ServerApp {
    public server: Express;
    public networkInst: NetworkInst;

    constructor() {
        console.log('Starting the server');
        this.server = express();

        this.initBlockchainInst().then(() => {
            console.log('Connected to the network');
        });

        this.middlewares();
        this.routes();
    }

    public async getAdminAddress() {
        // the below is only for testing
        const { result } = await this.networkInst.contractApi.query.getAdmin(this.networkInst.accountPair.address, {
            gasLimit: this.networkInst.gasLimit,
        });

        return result.asOk.data.toString();
    }

    public async registerName(ownerAddress: string, name: string) {
        await this.networkInst.contractApi.tx
            .forceRegister({ gasLimit: this.networkInst.gasLimit }, name, ownerAddress)
            .signAndSend(this.networkInst.accountPair, (result) => {
                if (result.status.isInBlock) {
                    console.log('in a block');
                } else if (result.status.isFinalized) {
                    console.log('finalized');
                }
            });
    }

    async initBlockchainInst() {
        await waitReady();
        const keyring = new Keyring({ type: 'sr25519' });
        const accountPair = keyring.addFromMnemonic(config.adminSeed, { name: 'admin' });

        const wsProvider = new WsProvider('wss://rpc.shibuya.astar.network');
        const api = await (await ApiPromise.create({ provider: wsProvider })).isReady;

        const abi = new Abi(config.contractInterface, api.registry.getChainProperties());

        const contractApi = new ContractPromise(api, abi, config.contractAddr);

        const gasLimit = api.registry.createType('WeightV2', api.consts.system.blockWeights['maxBlock']);

        this.networkInst = {
            chainApi: api,
            contractApi,
            gasLimit,
            accountPair,
        };
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
                // move this to .env
                secret: 'this is a test secret',
                resave: false,
                saveUninitialized: true,
            }),
        );

        // pass the chain API instance to all routes
        this.server.use((req, res, next) => {
            req.networkInst = this.networkInst;
            next();
        });
    }

    routes() {
        this.server.use(routes);
    }
}

export default new ServerApp();
