import contractInterface from './contract-interface.json';

export const config = {
    contractAddr: process.env.CONTRACT_ADDR,
    contractInterface,
    adminSeed: process.env.ADMIN_SEED,
    endpoint: 'wss://rpc.shibuya.astar.network',
    isProduction: process.env.NODE_ENV !== 'development' && process.env.NODE_ENV === 'production',
    clientDomain: 'play.witchone.io',
    sessionSecret: process.env.SESSION_SECRET,
};

export * from './rateLimiter';
