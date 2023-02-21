import express, { Express } from 'express';
import routes from './routes';
import { ApiPromise } from '@polkadot/api';

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

    async initBlockchainInst() {}

    middlewares() {
        this.server.use(express.json());
    }

    routes() {
        this.server.use(routes);
    }
}

export default new App().server;
