import {
  Artifact,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Contract } from "js-conflux-sdk";

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
  bytecode?: string,
) {
  if (typeof nameOrAbi === "string") {
    const artifact = await hre.artifacts.readArtifact(nameOrAbi);

    return getContractFactoryFromArtifact(
      hre,
      artifact
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    nameOrAbi,
    bytecode as string,
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
  return hre.conflux.Contract({abi, bytecode});
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

  return hre.conflux.Contract({abi: nameOrAbi, address});
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

  return hre.conflux.Contract({abi: artifact.abi, address});
}

