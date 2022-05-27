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

This object has the same API as `js-conflux-sdk`, with some extra Hardhat-specific functionality.

### Conflux object

A `conflux` field is added to Hardhat Runtime Environment, which is an `Conflux` instance automatically connected to the selected network.

### Helpers

These helpers are added to the `conflux` object:

```js
function getContractFactory(name: string): Promise<conflux.Contract>;

function getContractFactory(abi: any[], bytecode: string): Promise<conflux.Contract>;

function getContractAt(name: string, address: string): Promise<conflux.Contract>;

function getContractAt(abi: any[], address: string): Promise<conflux.Contract>;
```

## Usage

There are no additional steps you need to take for this plugin to work.

Install it and access ethers through the Hardhat Runtime Environment anywhere you need it (tasks, scripts, tests, etc). For example, in your hardhat.config.js:

```js
require("hardhat-conflux");

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
