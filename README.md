# Dark Emblem Eth Contracts

This repo contains Ethereum contracts for Dark Emblem that were deployed to Ropsten testnet. You can few the contract [here](https://ropsten.etherscan.io/token/0x8584764ccfb688fd8bce49ddd9a6210b4bd696a9).

## Getting Started

You need to have Python installed and a C++ compilier like Visual Studio. Windows users will need to disable Microsoft python by searching "manage app execution aliases" and disable anything that says Python.

All apps are run and deployed on Node version 14.18.0 (see the `.nvmrc` file). Install NVM to manage Node versions: [use this to help on Windows](https://dev.to/skaytech/how-to-install-node-version-manager-nvm-for-windows-10-4nbi).

Currently, things are stable on node 14 so run:

```console
nvm install 14
nvm use 14
```

Navigate to the root of the project and run:

```console
npm install
```

## Run the blockchain

```console
npm run start
```

## Running Tests

Test all the contract functionality using mocha test runner with chai assertions:

```console
npm run test
```
