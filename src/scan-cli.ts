import axios from "axios";

const MainnetScanUrl = 'https://api.confluxscan.net';
const TestnetScanUrl = 'https://api-testnet.confluxscan.net';

// Scan contract verify openapi @see https://api-testnet.confluxscan.net/doc

/**
 * Valid codes 1-14 where
    1 - No License (None)
    2 - The Unlicense (Unlicense)
    3 - MIT License (MIT)
    4 - GNU General Public License v2.0 (GNU GPLv2)
    5 - GNU General Public License v3.0 (GNU GPLv3)
    6 - GNU Lesser General Public License v2.1 (GNU LGPLv2.1)
    7 - GNU Lesser General Public License v3.0 (GNU LGPLv3)
    8 - BSD 2-clause 'Simplified' license (BSD-2-Clause)
    9 - BSD 3-clause 'New' Or 'Revised' license* (BSD-3-Clause)
    10 - Mozilla Public License 2.0 (MPL-2.0)
    11 - Open Software License 3.0 (OSL-3.0)
    12 - Apache 2.0 (Apache-2.0)
    13 - GNU Affero General Public License (GNU AGPLv3)
    14 - Business Source License (BSL 1.1)
 */
enum LicenseType {
  No = 1,
  Unlicense,
  MIT,
  GPL_v2,
  GPL_v3,
  LGPL_v2_1,
  LGPL_v3,
  BSD_2_Clause,
  BSD_3_Clause,
  MPL_2_0,
  OSL_3_0,
  Apache_2_0,
  AGPL_v3,
  BSC_1_1
}

interface ContractVerifyOption {
  networkId?: number;
  contractaddress: string;
  sourceCode: string;
  codeformat?: string;  // solidity-single-file
  contractname: string;
  compilerversion: string;
  optimizationUsed?: number;  // default-0 0 = No Optimization, 1 = Optimization used (applicable when codeformat=solidity-single-file)
  runs?: number;  // set to 200 as default unless otherwise (applicable when codeformat=solidity-single-file)
  constructorArguements?: string;
  evmversion?: string;  // leave blank for compiler default, homestead, tangerineWhistle, spuriousDragon, byzantium, constantinople, petersburg, istanbul (applicable when codeformat=solidity-single-file)
  licenseType?: LicenseType;  // default: 1
}

interface ScanAPIResponse {
  code: number;
  message: string;
  data?: any;
}

function getScanApiUrl(networkId?: number): string {
  if (networkId === 1) return TestnetScanUrl;
  return MainnetScanUrl;
}

/**
 Success: 
 {
    code: 0,
    message: 'OK',
    data: '00d290cca9978af20a24994a2e0c4ca415266216ee4e2b3c21'
 }

 Fail:
 { code: 1, message: 'compiler version 0.8.15 not exits' }
 */
export async function verifySourceCode(options: ContractVerifyOption): Promise<ScanAPIResponse> {
  const { networkId, ...verifyMeta } = options;
  const url = getScanApiUrl(networkId);
  let compilerVersions = await getCompilerList();
  const completeVersion = compilerVersions[options.compilerversion];
  if (!completeVersion) {
    throw new Error(`compiler version ${options.compilerversion} not exits`);
  }
  verifyMeta.compilerversion = completeVersion;
  const { data } = await axios.post(`${url}/contract/verifysourcecode`, verifyMeta);
  return data;
}

export async function checkVerifyStatus(guid: string, networkId?: number): Promise<object> {
  const url = getScanApiUrl(networkId);
  return await axios.get(`${url}/contract/checkverifystatus?guid=${guid}`);
}

async function getCompilerList() {
  const url = 'https://confluxscan.net/v1/contract/compiler';
  const { data: versions } = await axios.get(url);
  return versions;
}
