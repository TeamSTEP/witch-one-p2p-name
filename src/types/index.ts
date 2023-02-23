import { Query, Send } from 'express-serve-static-core';
import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { WeightV2 } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';

export interface User {
    address?: string;
    name?: string;
}

export interface NetworkInst {
    chainApi: ApiPromise;
    contractApi: ContractPromise;
    gasLimit: WeightV2;
    accountPair: KeyringPair;
}

/**
 * Helper type to add intellisense for request payload objects.
 * Usage:
 * ```
 * app.post(
 *  "/login",
 *  function (
 *    req: TypedRequestBody<{ username: string, password: string }>,
 *    res: Express.Response
 *  ) {
 *    const success = req.body.username === "foo" && req.body.password === "bar";
 *    res.status(200).json({ Success: success });
 *  }
 * );
 * ```
 */
export interface TypedRequestBody<T> extends Express.Request {
    body: T;
}

/**
 * Helper type to add intellisense for query objects.
 * Usage:
 * ```
 * app.get(
 * "/article/:id",
 * function (req: TypedRequestQuery<{ id: string }>, res: Express.Response) {
 *   const id = req.query.id;
 *   res.status(200).json({ ID: id });
 *  }
 * );
 * ```
 */
export interface TypedRequestQuery<T extends Query> extends Express.Request {
    query: T;
}

/**
 * Helper type to add intellisense for response objects.
 * Usage:
 * ```
 * app.get(
 *  "/ping",
 *  function (_req: Express.Request, res: TypedResponse<{ Pong: string }>) {
 *    res.status(200).json({ Pong: new Date().toISOString() });
 *   }
 * );
 * ```
 */
export interface TypedResponse<ResBody> extends Express.Response {
    json: Send<ResBody, this>;
}
