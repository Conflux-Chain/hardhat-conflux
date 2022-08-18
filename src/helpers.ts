import {
  Artifact,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Contract, format, PrivateKeyAccount, PrivateKeyAccount as Signer } from "js-conflux-sdk";
import { Libraries, FactoryOptions } from "../types"

interface Link {
  sourceName: string;
  libraryName: string;
  address: string;
}

const pluginName = "hardhat-conflux";

function isArtifact(artifact: any): artifact is Artifact {
  const {
    contractName,
    sourceName,
    abi,
    bytecode,
    deployedBytecode,
    linkReferences,
    deployedLinkReferences,
  } = artifact;

  return (
    typeof contractName === "string" &&
    typeof sourceName === "string" &&
    Array.isArray(abi) &&
    typeof bytecode === "string" &&
    typeof deployedBytecode === "string" &&
    linkReferences !== undefined &&
    deployedLinkReferences !== undefined
  );
}


export async function getSigners(
  hre: HardhatRuntimeEnvironment
): Promise<PrivateKeyAccount[]> {
  const accounts = hre.network.config.accounts;
  if (!Array.isArray(accounts)) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `Only private key accounts are supported.`
    );
  }

  const chainId = hre.network.config.chainId;
  // @ts-ignore
  return accounts.map((privateKey) => new PrivateKeyAccount(privateKey, chainId as number));
}

export async function getSigner(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<PrivateKeyAccount | undefined> {
  const signers = await getSigners(hre);
  return signers.find((signer) => signer.address === address);
}

export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  name: string,
): Promise<Contract>;

export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: string,
): Promise<Contract>;

export async function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  bytecodeOrFactoryOptions?:
    | FactoryOptions
    | string,
) {
  if (typeof nameOrAbi === "string") {

    return getContractFactoryByName(
      hre,
      nameOrAbi,
      bytecodeOrFactoryOptions as FactoryOptions | undefined
    );
    // const artifact = await hre.artifacts.readArtifact(nameOrAbi);

    // return getContractFactoryFromArtifact(
    //   hre,
    //   artifact
    // );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    nameOrAbi,
    bytecodeOrFactoryOptions as string,
  );
}

export async function getContractFactoryFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: Artifact,
) {
  if (!isArtifact(artifact)) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`
    );
  }

  if (artifact.bytecode === "0x") {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    artifact.abi,
    artifact.bytecode,
  );
}

async function getContractFactoryByAbiAndBytecode(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: string,
) {
  return hre.conflux.Contract({ abi, bytecode });
}

async function getContractFactoryByName(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  options?: FactoryOptions
) {
  const artifact = await hre.artifacts.readArtifact(contractName);

  let libraries: Libraries = {};
  let signer: Signer | undefined;
  if (isFactoryOptions(options)) {
    signer = options.signer;
    libraries = options.libraries ?? {};
  } else {
    signer = options;
  }

  if (artifact.bytecode === "0x") {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `You are trying to create a contract factory for the contract ${contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${contractName} as its interface use the "getContractAt" function instead.`
    );
  }

  const linkedBytecode = await collectLibrariesAndLink(artifact, libraries);

  return getContractFactoryByAbiAndBytecode(
    hre,
    artifact.abi,
    linkedBytecode,
    // signer
  );
}

async function collectLibrariesAndLink(
  artifact: Artifact,
  libraries: Libraries
) {
  // const { utils } = require("ethers") as typeof ethers;

  const neededLibraries: Array<{
    sourceName: string;
    libName: string;
  }> = [];
  for (const [sourceName, sourceLibraries] of Object.entries(
    artifact.linkReferences
  )) {
    for (const libName of Object.keys(sourceLibraries)) {
      neededLibraries.push({ sourceName, libName });
    }
  }

  const linksToApply: Map<string, Link> = new Map();
  for (let [linkedLibraryName, linkedLibraryAddress] of Object.entries(
    libraries
  )) {
    linkedLibraryAddress = format.hexAddress(linkedLibraryAddress)

    const matchingNeededLibraries = neededLibraries.filter((lib) => {
      return (
        lib.libName === linkedLibraryName ||
        `${lib.sourceName}:${lib.libName}` === linkedLibraryName
      );
    });

    if (matchingNeededLibraries.length === 0) {
      let detailedMessage: string;
      if (neededLibraries.length > 0) {
        const libraryFQNames = neededLibraries
          .map((lib) => `${lib.sourceName}:${lib.libName}`)
          .map((x) => `* ${x}`)
          .join("\n");
        detailedMessage = `The libraries needed are:
${libraryFQNames}`;
      } else {
        detailedMessage = "This contract doesn't need linking any libraries.";
      }
      throw new NomicLabsHardhatPluginError(
        pluginName,
        `You tried to link the contract ${artifact.contractName} with ${linkedLibraryName}, which is not one of its libraries.
${detailedMessage}`
      );
    }

    if (matchingNeededLibraries.length > 1) {
      const matchingNeededLibrariesFQNs = matchingNeededLibraries
        .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
        .map((x) => `* ${x}`)
        .join("\n");
      throw new NomicLabsHardhatPluginError(
        pluginName,
        `The library name ${linkedLibraryName} is ambiguous for the contract ${artifact.contractName}.
It may resolve to one of the following libraries:
${matchingNeededLibrariesFQNs}

To fix this, choose one of these fully qualified library names and replace where appropriate.`
      );
    }

    const [neededLibrary] = matchingNeededLibraries;

    const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

    // The only way for this library to be already mapped is
    // for it to be given twice in the libraries user input:
    // once as a library name and another as a fully qualified library name.
    if (linksToApply.has(neededLibraryFQN)) {
      throw new NomicLabsHardhatPluginError(
        pluginName,
        `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.
Remove one of them and review your library links before proceeding.`
      );
    }

    linksToApply.set(neededLibraryFQN, {
      sourceName: neededLibrary.sourceName,
      libraryName: neededLibrary.libName,
      address: linkedLibraryAddress,
    });
  }

  if (linksToApply.size < neededLibraries.length) {
    const missingLibraries = neededLibraries
      .map((lib) => `${lib.sourceName}:${lib.libName}`)
      .filter((libFQName) => !linksToApply.has(libFQName))
      .map((x) => `* ${x}`)
      .join("\n");

    throw new NomicLabsHardhatPluginError(
      pluginName,
      `The contract ${artifact.contractName} is missing links for the following libraries:
${missingLibraries}

Learn more about linking contracts at https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking
`
    );
  }

  return linkBytecode(artifact, [...linksToApply.values()]);
}

export async function getContractAt(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  address: string,
) {
  if (typeof nameOrAbi === "string") {
    const artifact = await hre.artifacts.readArtifact(nameOrAbi);

    return getContractAtFromArtifact(hre, artifact, address);
  }

  return hre.conflux.Contract({ abi: nameOrAbi, address });
}

export async function getContractAtFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: Artifact,
  address: string,
) {
  if (!isArtifact(artifact)) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `You are trying to create a contract by artifact, but you have not passed a valid artifact parameter.`
    );
  }

  return hre.conflux.Contract({ abi: artifact.abi, address });
}


function linkBytecode(artifact: Artifact, libraries: Link[]): string {
  let bytecode = artifact.bytecode;

  // TODO: measure performance impact
  for (const { sourceName, libraryName, address } of libraries) {
    const linkReferences = artifact.linkReferences[sourceName][libraryName];
    for (const { start, length } of linkReferences) {
      bytecode =
        bytecode.substr(0, 2 + start * 2) +
        address.substr(2) +
        bytecode.substr(2 + (start + length) * 2);
    }
  }

  return bytecode;
}

function isFactoryOptions(
  signerOrOptions?: Signer | FactoryOptions
): signerOrOptions is FactoryOptions {
  if (signerOrOptions === undefined || signerOrOptions instanceof Signer) {
    return false;
  }

  return true;
}