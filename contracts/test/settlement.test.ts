import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const U = 1_000_000n;
const INVOICE = 48_750n * U;
const ADVANCE = 42_900n * U;
const INTEREST = (ADVANCE * 1150n * 75n) / 3_650_000n; // 1013732876
const FEE = (INVOICE * 30n) / 10_000n; // 146250000
const REMAINDER = INVOICE - ADVANCE - INTEREST - FEE;
const SB = ethers.id("SB-1");

async function setup() {
  const [deployer, exporter, financier, other, buyer, keeper, treasury] = await ethers.getSigners();
  const token = await (await ethers.getContractFactory("MockTIP20")).deploy();
  const vault = await (
    await ethers.getContractFactory("SettlementVault")
  ).deploy(await token.getAddress(), treasury.address, keeper.address, 30);
  const v = await vault.getAddress();
  await token.mint(financier.address, ADVANCE);
  await token.mint(other.address, ADVANCE);
  await token.mint(buyer.address, INVOICE);
  await token.connect(financier).approve(v, ethers.MaxUint256);
  await token.connect(other).approve(v, ethers.MaxUint256);
  await vault.connect(exporter).register(SB, INVOICE, 75);
  return { token, vault, v, exporter, financier, other, buyer, keeper, treasury };
}

async function financed() {
  const f = await setup();
  await f.vault.connect(f.financier).finance(SB, ADVANCE, 1150);
  return f;
}

describe("SettlementVault", () => {
  it("vector arithmetic sums to invoice", () => {
    expect(INTEREST).to.equal(1_013_732_876n);
    expect(FEE).to.equal(146_250_000n);
    expect(REMAINDER).to.equal(4_690_017_124n); // 4,690.02
    expect(ADVANCE + INTEREST + FEE + REMAINDER).to.equal(INVOICE);
  });

  it("a) finance pays exporter the advance and locks", async () => {
    const { vault, token, exporter, financier } = await loadFixture(financed);
    expect(await token.balanceOf(exporter.address)).to.equal(ADVANCE);
    expect(await token.balanceOf(financier.address)).to.equal(0n);
    const b = await vault.bills(SB);
    expect(b.state).to.equal(2);
    expect(b.financier).to.equal(financier.address);
  });

  it("b) second finance reverts ALREADY_LOCKED", async () => {
    const { vault, other } = await loadFixture(financed);
    await expect(vault.connect(other).finance(SB, ADVANCE, 1150)).to.be.revertedWithCustomError(
      vault,
      "ALREADY_LOCKED",
    );
  });

  it("c) keeper realise settles exact waterfall; second realise reverts", async () => {
    const { vault, token, v, buyer, keeper, treasury, exporter, financier } = await loadFixture(financed);
    await token.connect(buyer).transferWithMemo(v, INVOICE, SB);
    await vault.connect(keeper).realise(SB, INVOICE, ethers.id("tx"));
    expect(await token.balanceOf(financier.address)).to.equal(ADVANCE + INTEREST);
    expect(await token.balanceOf(treasury.address)).to.equal(FEE);
    expect(await token.balanceOf(exporter.address)).to.equal(ADVANCE + REMAINDER);
    expect(await token.balanceOf(v)).to.equal(0n);
    expect((await vault.bills(SB)).state).to.equal(3);
    await expect(vault.connect(keeper).realise(SB, INVOICE, ethers.ZeroHash)).to.be.revertedWithCustomError(
      vault,
      "ALREADY_REALISED",
    );
  });

  it("d) short payment is PARTIAL with no overpay", async () => {
    const { vault, token, v, buyer, keeper, treasury, exporter, financier } = await loadFixture(financed);
    const paid = 30_000n * U;
    await token.connect(buyer).transferWithMemo(v, paid, SB);
    await vault.connect(keeper).realise(SB, paid, ethers.ZeroHash);
    expect(await token.balanceOf(financier.address)).to.equal(paid);
    expect(await token.balanceOf(treasury.address)).to.equal(0n);
    expect(await token.balanceOf(exporter.address)).to.equal(ADVANCE);
    expect(await token.balanceOf(v)).to.equal(0n);
    expect((await vault.bills(SB)).state).to.equal(4);
  });

  it("e) pay() trustless path end to end", async () => {
    const { vault, token, v, buyer, treasury, exporter, financier } = await loadFixture(financed);
    await token.connect(buyer).approve(v, INVOICE);
    await vault.connect(buyer).pay(SB, INVOICE);
    expect(await token.balanceOf(financier.address)).to.equal(ADVANCE + INTEREST);
    expect(await token.balanceOf(treasury.address)).to.equal(FEE);
    expect(await token.balanceOf(exporter.address)).to.equal(ADVANCE + REMAINDER);
    expect(await token.balanceOf(v)).to.equal(0n);
    await token.mint(buyer.address, 1n);
    await token.connect(buyer).approve(v, 1n);
    await expect(vault.connect(buyer).pay(SB, 1n)).to.be.revertedWithCustomError(vault, "ALREADY_REALISED");
  });

  it("f) non-keeper realise reverts", async () => {
    const { vault, other } = await loadFixture(financed);
    await expect(vault.connect(other).realise(SB, INVOICE, ethers.ZeroHash)).to.be.revertedWithCustomError(
      vault,
      "NOT_KEEPER",
    );
  });
});
