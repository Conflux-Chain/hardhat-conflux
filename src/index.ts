import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { 
  Conflux, 
  format,
  Drip, 
  sign,
  PrivateKeyAccount,
  address,
  PersonalMessage,
  Message,
  Transaction
} from "js-conflux-sdk";
import {
  getContractAt,
  getContractFactory,
} from './helpers';

import "./type-extensions";

extendEnvironment((hre) => {

  hre.ConfluxSDK = lazyObject(() => {
    return {
      Conflux: Conflux,
      format: format,
      Drip: Drip,
      sign: sign,
      PrivateKeyAccount: PrivateKeyAccount,
      address: address,
      PersonalMessage: PersonalMessage,
      Message: Message,
      Transaction: Transaction
    };
  });

  hre.conflux = lazyObject(() => {
    // Create contract instance
    const chainId = hre.network.config.chainId || 0;
    const conflux = new Conflux({
      networkId: chainId,
    });
    // @ts-ignore
    conflux.provider = hre.network.provider;
    // Setup accounts
    let accounts = hre.network.config.accounts;
    if (Array.isArray(accounts)) {
      for(let account of accounts) {
        // @ts-ignore
        conflux.wallet.addPrivateKey(account.privateKey);
      }
    } else {
      // TODO:
      // HD wallet
    }
    // @ts-ignore
    conflux.getContractAt = getContractAt.bind(null, hre);
    // @ts-ignore
    conflux.getContractFactory = getContractFactory.bind(null, hre);
    return conflux;
  });

});
