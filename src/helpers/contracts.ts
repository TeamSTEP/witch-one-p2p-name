import { Abi, ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';
import { config } from '../config';

export const createContract = (api: ApiPromise) => {
    const abi = new Abi(config.contractInterface, api.registry.getChainProperties());

    const contract = new ContractPromise(api, abi, config.contractAddr);

    return contract;
};
