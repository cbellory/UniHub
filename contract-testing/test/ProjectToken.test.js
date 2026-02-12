import { expect } from "chai";
import hre from "hardhat"; // Імпортуємо 'hre'

describe("ProjectToken Contract", function () {
  
  let token;
  let owner; 
  let addr1;
  
  const tokenName = "Diploma Motivation Token";
  const tokenSymbol = "DMT";

  beforeEach(async function () {
    const { ethers } = hre; // Дістаємо 'ethers' з 'hre'
    [owner, addr1] = await ethers.getSigners();
    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    token = await ProjectToken.deploy(tokenName, tokenSymbol);
  });

  it("Should deploy with the correct name and symbol", async function () {
    expect(await token.name()).to.equal(tokenName);
    expect(await token.symbol()).to.equal(tokenSymbol);
  });

  it("Should set the deployer as the owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should allow the owner to mint tokens", async function () {
    const { ethers } = hre;
    const mintAmount = ethers.parseUnits("1000", 18);
    await token.connect(owner).mint(addr1.address, mintAmount);
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(mintAmount);
  });

  it("Should FAIL if another account tries to mint tokens", async function () {
    const { ethers } = hre;
    const mintAmount = ethers.parseUnits("100", 18);
    await expect(
      token.connect(addr1).mint(addr1.address, mintAmount)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});