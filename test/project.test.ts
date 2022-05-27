// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import { Conflux } from 'js-conflux-sdk';
import { useEnvironment } from "./helpers";

const TestAddress = 'cfxtest:aak1kncc21r17g397g9t494g3tjb2334jyznhha47y';

describe("Integration tests", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the conflux field", function () {
      assert.instanceOf(
        this.hre.conflux,
        Conflux
      );
    });

    it("The conflux.cfx.getStatus should return correct chainId", async function () {
      // @ts-ignore
      const status = await this.hre.conflux.cfx.getStatus();
      assert.equal(status.chainId, 1);
    });

    it("Should include the right account", async function() {
      // @ts-ignore
      const account = this.hre.conflux.wallet.get(TestAddress);
      assert.equal(account.address, TestAddress);
    });

    it("getSinger should return privateKey accounts", async function() {
      // @ts-ignore
      const signers = await this.hre.conflux.getSigners();
      assert.equal(signers.length, 1);
      assert.equal(signers[0].address, TestAddress);
    });

    it("Should return Contract instance from getContractFactory", async function () {
      // @ts-ignore
      const Greeter = await this.hre.conflux.getContractFactory('Greeter');
      const receipt = await Greeter.constructor('Hello').sendTransaction({
        from: TestAddress,
      }).executed();
      assert.equal(receipt.outcomeStatus, 0);
    });
  });
});

/* describe("Unit tests examples", function () {
  describe("ExampleHardhatRuntimeEnvironmentField", function () {
    describe("sayHello", function () {
      it("Should say hello", function () {
        const field = new ExampleHardhatRuntimeEnvironmentField();
        assert.equal(field.sayHello(), "hello");
      });
    });
  });
}); */
