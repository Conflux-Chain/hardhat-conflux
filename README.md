# hardhat-conflux

Hardhat plugin for integration with `js-conflux-sdk`

## What

This plugin brings to Hardhat the `js-conflux-sdk`, which allows you to interact with the `Conflux` blockchain in a simple way.

## Installation

```bash
npm install hardhat-conflux 'js-conflux-sdk@next'
```

Import the plugin in your `hardhat.config.js`:

```js
require("hardhat-conflux");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "hardhat-conflux";
```

## Tasks

This plugin creates no additional tasks.

## Environment extensions

This plugins adds an `ConfluxSDK` object to the Hardhat Runtime Environment.

This object has the same API as `js-conflux-sdk`

### Conflux object

A `conflux` field is added to Hardhat Runtime Environment, which is an `Conflux` instance automatically connected to the selected network, with some extra Hardhat-specific functionality.

### Helpers

These helpers are added to the `conflux` object:

```js
function getContractFactory(name: string): Promise<ConfluxSDK.Contract>;

function getContractFactory(abi: any[], bytecode: string): Promise<ConfluxSDK.Contract>;

function getContractAt(name: string, address: string): Promise<ConfluxSDK.Contract>;

function getContractAt(abi: any[], address: string): Promise<ConfluxSDK.Contract>;

function getSigners(): Promise<ConfluxSDK.PrivateKeyAccount[]>;
```

## Usage

There are no additional steps you need to take for this plugin to work.

Install it and access `conflux` through the Hardhat Runtime Environment anywhere you need it (tasks, scripts, tests, etc). For example, in your hardhat.config.js:

```js
require("hardhat-conflux");

/*
// Add conflux network (mainnet or testnet) to hardhat networks

confluxTestnet: {
  url: "https://test.confluxrpc.com",
  accounts: [HARDHAT_TEST_KEY],
  chainId: 1,
}
*/

// task action function receives the Hardhat Runtime Environment as second argument
task(
  "epochNumber",
  "Prints the current Conflux epoch number",
  async (_, { conflux }) => {
    conflux.cfx.epochNumber().then((epochNumber) => {
      console.log("Current epoch number: " + epochNumber);
    });
  }
);

module.exports = {};
```

And deploy or interact with contract in tasks or scripts:

```js
const signers = await hre.conflux.getSingers();
const defaultAccount = signers[0];
// deploy contract
const Greeter = await hre.conflux.getContractFactory('Greeter');
const receipt = await Greeter.constructor('Hello').sendTransaction({
  from: defaultAccount.address,
}).executed();
console.log(`Contract deploy ${receipt.outcomeStatus === 0 ? 'Success' : 'Failed'}`);
const contractAddress = receipt.contractCreated;
console.log(`New deployed contract address: ${contractAddress}`);

// interact with contract
const greeter = await hre.conflux.getContractAt('Greeter', contractAddress);
// read contract state
const greet = await greeter.greet();
// update contract state through sending transaction
const hash = await greeter.setGreeting('new greet').sendTransaction({
  from: defaultAccount.address,
});
```
