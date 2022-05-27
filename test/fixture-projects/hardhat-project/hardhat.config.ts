// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

// 0x1374ac42c5db7e9b3fe9befd7f46cbd01c673a45
const HARDHAT_TEST_KEY = '0xacb3b0c0ad10bc64f8ed3663b7ce45f118576d422839483c690bf33af75c5ae6';

const config: HardhatUserConfig = {
  solidity: "0.7.3",
  defaultNetwork: "confluxTestnet",
  networks: {
    confluxTestnet: {
      url: "https://test.confluxrpc.com",
      accounts: [HARDHAT_TEST_KEY],
      chainId: 1,
      gasMultiplier: 1.3
    }
  }
};

export default config;
