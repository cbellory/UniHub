import { expect } from "chai";
import { ethers } from "hardhat";
import { UniversityCoin } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UniversityCoin", function () {
    let coin: UniversityCoin;
    let owner: SignerWithAddress;
    let student: SignerWithAddress;
    let backend: SignerWithAddress;
    let unauthorized: SignerWithAddress;

    beforeEach(async function () {
        [owner, student, backend, unauthorized] = await ethers.getSigners();

        const UniversityCoin = await ethers.getContractFactory("UniversityCoin");
        coin = await UniversityCoin.deploy();
        await coin.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await coin.name()).to.equal("University Coin");
            expect(await coin.symbol()).to.equal("UCN");
        });

        it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
            const DEFAULT_ADMIN_ROLE = await coin.DEFAULT_ADMIN_ROLE();
            expect(await coin.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        });

        it("Should grant MINTER_ROLE to deployer", async function () {
            const MINTER_ROLE = await coin.MINTER_ROLE();
            expect(await coin.hasRole(MINTER_ROLE, owner.address)).to.be.true;
        });

        it("Should grant PAUSER_ROLE to deployer", async function () {
            const PAUSER_ROLE = await coin.PAUSER_ROLE();
            expect(await coin.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("Should allow MINTER_ROLE to mint tokens", async function () {
            const amount = ethers.parseEther("100");
            await coin.mint(student.address, amount);
            expect(await coin.balanceOf(student.address)).to.equal(amount);
        });

        it("Should emit TokensMinted event", async function () {
            const amount = ethers.parseEther("100");
            await expect(coin.mint(student.address, amount))
                .to.emit(coin, "TokensMinted")
                .withArgs(student.address, amount, "Academic Reward");
        });

        it("Should revert if non-minter tries to mint", async function () {
            const amount = ethers.parseEther("100");
            await expect(
                coin.connect(unauthorized).mint(student.address, amount)
            ).to.be.reverted;
        });

        it("Should allow granting MINTER_ROLE to backend", async function () {
            const MINTER_ROLE = await coin.MINTER_ROLE();
            await coin.grantRole(MINTER_ROLE, backend.address);

            const amount = ethers.parseEther("50");
            await coin.connect(backend).mint(student.address, amount);
            expect(await coin.balanceOf(student.address)).to.equal(amount);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("100");
            await coin.mint(student.address, amount);
        });

        it("Should allow users to burn their own tokens", async function () {
            const burnAmount = ethers.parseEther("30");
            await coin.connect(student).burn(burnAmount);
            expect(await coin.balanceOf(student.address)).to.equal(
                ethers.parseEther("70")
            );
        });

        it("Should decrease total supply when burning", async function () {
            const initialSupply = await coin.totalSupply();
            const burnAmount = ethers.parseEther("30");
            await coin.connect(student).burn(burnAmount);
            expect(await coin.totalSupply()).to.equal(initialSupply - burnAmount);
        });
    });

    describe("Pausable", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("100");
            await coin.mint(student.address, amount);
            await coin.mint(owner.address, amount);
        });

        it("Should allow PAUSER_ROLE to pause", async function () {
            await coin.pause();
            expect(await coin.paused()).to.be.true;
        });

        it("Should prevent transfers when paused", async function () {
            await coin.pause();
            await expect(
                coin.connect(student).transfer(owner.address, ethers.parseEther("10"))
            ).to.be.reverted;
        });

        it("Should allow PAUSER_ROLE to unpause", async function () {
            await coin.pause();
            await coin.unpause();
            expect(await coin.paused()).to.be.false;
        });

        it("Should allow transfers after unpause", async function () {
            await coin.pause();
            await coin.unpause();

            const transferAmount = ethers.parseEther("10");
            await coin.connect(student).transfer(owner.address, transferAmount);
            expect(await coin.balanceOf(owner.address)).to.equal(
                ethers.parseEther("110")
            );
        });

        it("Should revert if non-pauser tries to pause", async function () {
            await expect(coin.connect(unauthorized).pause()).to.be.reverted;
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to grant roles", async function () {
            const MINTER_ROLE = await coin.MINTER_ROLE();
            await coin.grantRole(MINTER_ROLE, backend.address);
            expect(await coin.hasRole(MINTER_ROLE, backend.address)).to.be.true;
        });

        it("Should allow admin to revoke roles", async function () {
            const MINTER_ROLE = await coin.MINTER_ROLE();
            await coin.grantRole(MINTER_ROLE, backend.address);
            await coin.revokeRole(MINTER_ROLE, backend.address);
            expect(await coin.hasRole(MINTER_ROLE, backend.address)).to.be.false;
        });
    });
});
