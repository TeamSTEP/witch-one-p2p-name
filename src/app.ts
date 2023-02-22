import express, { Express } from 'express';
import routes from './routes';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { appRateLimiter } from './config';

class App {
    public server: Express;
    public blockchainApi: ApiPromise;

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
        const wsProvider = new WsProvider('wss://rpc.shibuya.astar.network');
        this.blockchainApi = await ApiPromise.create({ provider: wsProvider });
        this.blockchainApi = await this.blockchainApi.isReady;
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(appRateLimiter);
    }

    routes() {
        this.server.use(routes);
    }
}

export default new App().server;
