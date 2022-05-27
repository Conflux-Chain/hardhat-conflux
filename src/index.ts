import { extendConfig, extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";
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

// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // We apply our default config here. Any other kind of config resolution
    // or normalization should be placed here.
    //
    // `config` is the resolved config, which will be used during runtime and
    // you should modify.
    // `userConfig` is the config as provided by the user. You should not modify
    // it.
    //
    // If you extended the `HardhatConfig` type, you need to make sure that
    // executing this function ensures that the `config` object is in a valid
    // state for its type, including its extensions. For example, you may
    // need to apply a default value, like in this example.
    const userPath = userConfig.paths?.newPath;

    let newPath: string;
    if (userPath === undefined) {
      newPath = path.join(config.paths.root, "newPath");
    } else {
      if (path.isAbsolute(userPath)) {
        newPath = userPath;
      } else {
        // We resolve relative paths starting from the project's root.
        // Please keep this convention to avoid confusion.
        newPath = path.normalize(path.join(config.paths.root, userPath));
      }
    }

    config.paths.newPath = newPath;
  }
);

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
