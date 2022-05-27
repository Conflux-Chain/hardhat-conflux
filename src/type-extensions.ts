import "hardhat/types/runtime";
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

interface JSConfluxSDK {
  Conflux: typeof Conflux;
  format: typeof format;
  Drip: typeof Drip;
  sign: typeof sign;
  PrivateKeyAccount: typeof PrivateKeyAccount;
  address: typeof address;
  PersonalMessage: typeof PersonalMessage;
  Message: typeof Message;
  Transaction: typeof Transaction;
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    ConfluxSDK: JSConfluxSDK;
    conflux: Conflux;
  }
}
