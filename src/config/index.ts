import contractInterface from './contract-interface.json';

export const config = {
    contractAddr: process.env.CONTRACT_ADDR,
    contractInterface,
    adminSeed: process.env.ADMIN_SEED,
    endpoint: 'wss://rpc.shibuya.astar.network',
};

export * from './rateLimiter';
