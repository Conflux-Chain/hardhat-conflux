//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.3;

import "hardhat/console.sol";

contract Greeter {
    string private greeting;

    constructor(string memory _greeting) {
        console.log("Deploying a Greeter with greeting:", _greeting);
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function revertGreet() public view returns (string memory) {
        revert("Not enough Ether provided.");
        return greeting;
    }

    function assertGreet() public view returns (string memory) {
        require(false, "Even value required.");
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
        greeting = _greeting;
    }
}
