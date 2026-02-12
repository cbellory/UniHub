import { expect } from "chai";
import { ethers } from "hardhat";
import { SoulboundDiploma } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SoulboundDiploma", function () {
    let diploma: SoulboundDiploma;
    let owner: SignerWithAddress;
    let student1: SignerWithAddress;
    let student2: SignerWithAddress;
    let unauthorized: SignerWithAddress;

    const SAMPLE_URI = "ipfs://QmSampleHash123/diploma.json";

    beforeEach(async function () {
        [owner, student1, student2, unauthorized] = await ethers.getSigners();

        const SoulboundDiploma = await ethers.getContractFactory("SoulboundDiploma");
        diploma = await SoulboundDiploma.deploy();
        await diploma.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await diploma.name()).to.equal("University Diploma");
            expect(await diploma.symbol()).to.equal("UDIP");
        });

        it("Should set the deployer as owner", async function () {
            expect(await diploma.owner()).to.equal(owner.address);
        });
    });

    describe("Minting Diplomas", function () {
        it("Should allow owner to mint diploma", async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
            expect(await diploma.balanceOf(student1.address)).to.equal(1);
        });

        it("Should set correct tokenURI", async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
            expect(await diploma.tokenURI(0)).to.equal(SAMPLE_URI);
        });

        it("Should increment token IDs correctly", async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
            await diploma.safeMint(student2.address, "ipfs://QmAnotherHash/diploma2.json");

            expect(await diploma.balanceOf(student1.address)).to.equal(1);
            expect(await diploma.balanceOf(student2.address)).to.equal(1);
            expect(await diploma.ownerOf(0)).to.equal(student1.address);
            expect(await diploma.ownerOf(1)).to.equal(student2.address);
        });

        it("Should revert if non-owner tries to mint", async function () {
            await expect(
                diploma.connect(unauthorized).safeMint(student1.address, SAMPLE_URI)
            ).to.be.reverted;
        });

        it("Should allow minting multiple diplomas to same student", async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
            await diploma.safeMint(student1.address, "ipfs://QmAnotherHash/diploma2.json");
            expect(await diploma.balanceOf(student1.address)).to.equal(2);
        });
    });

    describe("Soulbound (Non-Transferable)", function () {
        beforeEach(async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
        });

        it("Should prevent transfer from student to another address", async function () {
            await expect(
                diploma.connect(student1).transferFrom(student1.address, student2.address, 0)
            ).to.be.revertedWith("SBT: Token transfer is not allowed");
        });

        it("Should prevent safeTransferFrom", async function () {
            await expect(
                diploma.connect(student1)["safeTransferFrom(address,address,uint256)"](
                    student1.address,
                    student2.address,
                    0
                )
            ).to.be.revertedWith("SBT: Token transfer is not allowed");
        });

        it("Should prevent approve and transferFrom by approved address", async function () {
            // Даже если approve пройдет, transfer должен быть заблокирован
            await diploma.connect(student1).approve(student2.address, 0);

            await expect(
                diploma.connect(student2).transferFrom(student1.address, student2.address, 0)
            ).to.be.revertedWith("SBT: Token transfer is not allowed");
        });

        it("Should keep diploma with original owner", async function () {
            // Попытка передачи
            try {
                await diploma.connect(student1).transferFrom(student1.address, student2.address, 0);
            } catch (error) {
                // Ожидаем ошибку
            }

            // Диплом остается у student1
            expect(await diploma.ownerOf(0)).to.equal(student1.address);
            expect(await diploma.balanceOf(student1.address)).to.equal(1);
            expect(await diploma.balanceOf(student2.address)).to.equal(0);
        });
    });

    describe("Token URI and Metadata", function () {
        it("Should return correct tokenURI for minted token", async function () {
            const uri1 = "ipfs://QmHash1/diploma1.json";
            const uri2 = "ipfs://QmHash2/diploma2.json";

            await diploma.safeMint(student1.address, uri1);
            await diploma.safeMint(student2.address, uri2);

            expect(await diploma.tokenURI(0)).to.equal(uri1);
            expect(await diploma.tokenURI(1)).to.equal(uri2);
        });

        it("Should revert when querying URI for non-existent token", async function () {
            await expect(diploma.tokenURI(999)).to.be.reverted;
        });
    });

    describe("ERC721 Standard Compliance", function () {
        beforeEach(async function () {
            await diploma.safeMint(student1.address, SAMPLE_URI);
        });

        it("Should support ERC721 interface", async function () {
            // ERC721 interface ID: 0x80ac58cd
            expect(await diploma.supportsInterface("0x80ac58cd")).to.be.true;
        });

        it("Should return correct owner of token", async function () {
            expect(await diploma.ownerOf(0)).to.equal(student1.address);
        });

        it("Should return correct balance", async function () {
            expect(await diploma.balanceOf(student1.address)).to.equal(1);
        });
    });

    describe("Ownership Management", function () {
        it("Should allow owner to transfer ownership", async function () {
            await diploma.transferOwnership(student1.address);
            expect(await diploma.owner()).to.equal(student1.address);
        });

        it("Should allow new owner to mint after ownership transfer", async function () {
            await diploma.transferOwnership(student1.address);
            await diploma.connect(student1).safeMint(student2.address, SAMPLE_URI);
            expect(await diploma.balanceOf(student2.address)).to.equal(1);
        });

        it("Should prevent old owner from minting after ownership transfer", async function () {
            await diploma.transferOwnership(student1.address);
            await expect(
                diploma.connect(owner).safeMint(student2.address, SAMPLE_URI)
            ).to.be.reverted;
        });
    });
});
