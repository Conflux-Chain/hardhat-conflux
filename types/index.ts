import { PrivateKeyAccount as Signer } from "js-conflux-sdk";

export interface Libraries {
    [libraryName: string]: string;
}

export interface FactoryOptions {
    // TODO: support signer
    signer?: Signer;
    libraries?: Libraries;
}