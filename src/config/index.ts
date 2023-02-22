import contractInterface from './contract-interface.json';

export const config = {
    contractAddr: 'arHTMYtRiBk5JzzfURUfoxVQPZri9mj5LD3vm2wUb8H9z3H',
    contractInterface,
    adminSeed: process.env.ADMIN_SEED,
    endpoint: 'wss://rpc.shibuya.astar.network',
};

export * from './rateLimiter';
