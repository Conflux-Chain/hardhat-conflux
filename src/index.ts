import { extendEnvironment, task, types } from "hardhat/config";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
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
  getSigners,
} from './helpers';
import {
  verifySourceCode
} from './scan-cli'
import "./type-extensions";

const TASK_FLATTEN_GET_FLATTENED_SOURCE = "flatten:get-flattened-sources";

task("verifyCfxContract", "Verify a Conflux contract")
  .addPositionalParam(
    "contractName",
    "Contract name to verify",
    undefined,
    types.string
  )
  .addPositionalParam(
    "address",
    "Base32 address of the smart contract to verify",
    undefined,
    types.string
  )
  .addOptionalParam(
    "compilerVersion",
    "Compiler version",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "constructorArgs",
    "File path to a javascript module that exports the list of arguments.",
    undefined,
    types.inputFile
  )
  .setAction(verifyConflux);

// @ts-ignore
async function verifyConflux(args, hre) {
  const {
    contractName,
    address: contractaddress,
    compilerVersion,
  } = args;
  // TODO: support constructor parameters
  
  // check address
  if (!address.isValidCfxAddress(contractaddress)) {
    throw new NomicLabsHardhatPluginError('hardhat-conflux', 'Invalid Conflux base32 contract address.');
  }
  const addressInfo = address.decodeCfxAddress(contractaddress);
  if (addressInfo.type !== 'contract') {
    throw new NomicLabsHardhatPluginError('hardhat-conflux', 'This is not a contract address.');
  }

  try {
    const compilerversion = compilerVersion ? compilerVersion : hre.userConfig.solidity;
    const artifact = await hre.artifacts.readArtifact(contractName);
    const sourceCode = await hre.run(TASK_FLATTEN_GET_FLATTENED_SOURCE, {files: [artifact.sourceName]});
    const result = await verifySourceCode({
      networkId: addressInfo.netId,  //hre.network.config.chainId,
      contractaddress,
      sourceCode,
      contractname: contractName,
      compilerversion,
    });
    if (result.code == 0) {
      console.log(`Verify success: ${contractName}`);
    } else {
      console.log(`Verify failed: ${result.message}`);
    }
  } catch(e: any) {
    console.log(`Verify failed: ${e.message}`);
  }
}

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
    // @ts-ignore
    const url = hre.network.config.url;
    const conflux = new Conflux({
      networkId: chainId,
      url,
    });
    // @ts-ignore
    // Setup accounts
    let accounts = hre.network.config.accounts;
    if (Array.isArray(accounts)) {
      for(let account of accounts) {
        // @ts-ignore
        conflux.wallet.addPrivateKey(account);
      }
    } else {
      // TODO: HD wallet
      // throw new NomicLabsHardhatPluginError('hardhat-conflux', 'HD wallet is not supported yet.');
    }
    // @ts-ignore
    conflux.getContractAt = getContractAt.bind(null, hre);
    // @ts-ignore
    conflux.getContractFactory = getContractFactory.bind(null, hre);
    // @ts-ignore
    conflux.getSigners = getSigners.bind(null, hre);
    return conflux;
  });

});
