import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseUnits } from "viem";

const BYTES_32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("Distributor", function () {
  async function deployDistributorFixture() {
    const [owner, addr1, addr2, addr3, addr4] =
      await hre.viem.getWalletClients();

    // Deploy MockERC20 (USDC)
    const mockUSDC = await hre.viem.deployContract(
      "src/mocks/MockERC20.sol:MockERC20",
      ["USD Coin", "USDC", 6]
    );

    // Deploy Distributor
    const distributor = await hre.viem.deployContract("Distributor", [
      mockUSDC.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    // Mint USDC to test accounts
    const mintAmount = parseUnits("10000", 6); // 10,000 USDC
    await mockUSDC.write.mint([owner.account.address, mintAmount]);
    await mockUSDC.write.mint([addr1.account.address, mintAmount]);
    await mockUSDC.write.mint([addr2.account.address, mintAmount]);
    await mockUSDC.write.mint([addr3.account.address, mintAmount]);

    return {
      distributor,
      mockUSDC,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      publicClient,
    };
  }

  async function deployDistributorFixtureWithPool() {
    const [owner, creator, addr2, addr3, addr4] =
      await hre.viem.getWalletClients();

    // Deploy MockERC20 (USDC)
    const mockUSDC = await hre.viem.deployContract(
      "src/mocks/MockERC20.sol:MockERC20",
      ["USD Coin", "USDC", 6]
    );

    // Deploy Distributor
    const distributor = await hre.viem.deployContract("Distributor", [
      mockUSDC.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    // Mint USDC to test accounts
    const mintAmount = parseUnits("10000", 6); // 10,000 USDC
    await mockUSDC.write.mint([owner.account.address, mintAmount]);
    await mockUSDC.write.mint([creator.account.address, mintAmount]);
    await mockUSDC.write.mint([addr2.account.address, mintAmount]);
    await mockUSDC.write.mint([addr3.account.address, mintAmount]);

    await distributor.write.createPool(
      [
        "Test Pool",
        "A test pool for fundraising",
        "https://example.com/image.png",
        [],
        [],
      ],
      { account: creator.account }
    );

    await distributor.write.createPool(
      [
        "Test Pool",
        "A test pool for fundraising",
        "https://example.com/image.png",
        [],
        [],
      ],
      { account: creator.account }
    );

    await distributor.write.deactivatePool([2n], {
      account: creator.account,
    });

    return {
      distributor,
      creator,
      addr2,
      addr3,
      addr4,
      publicClient,
      mockUSDC,
      activePoolId: 1n,
      deactivatedPoolId: 2n,
    };
  }

  async function deployDistributorFixtureWithDonations() {
    const [owner, creator, donor, addr3, addr4] =
      await hre.viem.getWalletClients();

    // Deploy MockERC20 (USDC)
    const mockUSDC = await hre.viem.deployContract(
      "src/mocks/MockERC20.sol:MockERC20",
      ["USD Coin", "USDC", 6]
    );

    // Deploy Distributor
    const distributor = await hre.viem.deployContract("Distributor", [
      mockUSDC.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    // Mint USDC to test accounts
    const mintAmount = parseUnits("10000", 6); // 10,000 USDC
    await mockUSDC.write.mint([owner.account.address, mintAmount]);
    await mockUSDC.write.mint([creator.account.address, mintAmount]);
    await mockUSDC.write.mint([donor.account.address, mintAmount]);
    await mockUSDC.write.mint([addr3.account.address, mintAmount]);

    await distributor.write.createPool(
      [
        "Test Pool",
        "A test pool for fundraising",
        "https://example.com/image.png",
        [],
        [],
      ],
      { account: creator.account }
    );
    const activePoolId = 1n;

    const donationAmount = parseUnits("1000", 6);
    await mockUSDC.write.approve([distributor.address, donationAmount], {
      account: donor.account,
    });
    await distributor.write.donate([activePoolId, donationAmount], {
      account: donor.account,
    });

    return {
      distributor,
      creator,
      donor,
      addr3,
      addr4,
      publicClient,
      mockUSDC,
      activePoolId,
      donationAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      const { distributor, mockUSDC } = await loadFixture(
        deployDistributorFixture
      );

      expect(await distributor.read.usdc()).to.equal(
        getAddress(mockUSDC.address)
      );
    });

    it("Should initialize with next pool ID as 1", async function () {
      const { distributor } = await loadFixture(deployDistributorFixture);

      expect(await distributor.read.nextPoolId()).to.equal(1n);
    });
  });

  describe("Pool Creation", function () {
    it("Should create a pool with valid parameters", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      await distributor.write.createPool(
        [
          "Test Pool",
          "A test pool for fundraising",
          "https://example.com/image.png",
          [],
          [], // All for creator
        ],
        { account: addr1.account }
      );

      // Check that pool was created
      const pool = await distributor.read.getPool([1n]);
      expect(pool.id).to.equal(1n);
      expect(pool.creator).to.equal(getAddress(addr1.account.address));
      expect(pool.title).to.equal("Test Pool");
      expect(pool.description).to.equal("A test pool for fundraising");
      expect(pool.imageUri).to.equal("https://example.com/image.png");
      expect(pool.totalDonationsAmount).to.equal(0n);
      expect(pool.totalDonationsCount).to.equal(0n);
      expect(pool.uniqueDonatorsCount).to.equal(0n);
      expect(pool.status).to.equal(1); // PoolStatus.ACTIVE
    });

    it("Should emit PoolCreated event", async function () {
      const { distributor, addr1, publicClient } = await loadFixture(
        deployDistributorFixture
      );

      const hash = await distributor.write.createPool(
        [
          "Test Pool",
          "A test pool for fundraising",
          "https://example.com/image.png",
          [],
          [],
        ],
        { account: addr1.account }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.PoolCreated();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.poolId).to.equal(1n);
      expect(events[0].args.title).to.equal("Test Pool");
    });

    it("Should correctly assign member percentages", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      await distributor.write.createPool(
        [
          "Test Pool",
          "A test pool for fundraising",
          "https://example.com/image.png",
          [],
          [], // All for creator
        ],
        { account: addr1.account }
      );

      const poolMembers = await distributor.read.getPoolMembers([1n, 0n, 100n]);

      // Should have 1 member, the creator
      expect(poolMembers).to.have.lengthOf(1);

      // Creator should have 100%
      const creator = poolMembers.find(
        (m) => getAddress(m.member) === getAddress(addr1.account.address)
      );
      expect(creator?.percentage).to.equal(10000n);
    });

    it("Should revert with empty title", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      await expect(
        distributor.write.createPool(
          [
            "",
            "A test pool for fundraising",
            "https://example.com/image.png",
            [],
            [],
          ],
          { account: addr1.account }
        )
      ).to.be.rejectedWith("EmptyTitle");
    });

    it("Should revert with mismatched array lengths", async function () {
      const { distributor, addr1, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      await expect(
        distributor.write.createPool(
          [
            "Test Pool",
            "Description",
            "https://example.com/image.png",
            [],
            [5000n], // Creator is calculated based on remaining percentage
          ],
          { account: addr1.account }
        )
      ).to.be.rejectedWith("ArrayLengthMismatch");
    });

    it("Should revert when total member percentage is 100% or more", async function () {
      const { distributor } = await loadFixture(deployDistributorFixture);

      await expect(
        distributor.write.createPool([
          "Test Pool",
          "Description",
          "https://example.com/image.png",
          [BYTES_32_ZERO],
          [100000n],
        ])
      ).to.be.rejectedWith("InvalidMemberPercentage");
    });

    it("Should revert with invalid member percentage", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      // Test 0% percentage
      await expect(
        distributor.write.createPool(
          [
            "Test Pool",
            "Description",
            "https://example.com/image.png",
            [BYTES_32_ZERO],
            [0n],
          ],
          { account: addr1.account }
        )
      ).to.be.rejectedWith("InvalidMemberPercentage");

      // Test > 100% percentage
      await expect(
        distributor.write.createPool([
          "Test Pool",
          "Description",
          "https://example.com/image.png",
          [BYTES_32_ZERO],
          [10001n],
        ])
      ).to.be.rejectedWith("InvalidMemberPercentage");
    });
  });

  describe("Donations", function () {
    it("Should allow donations to active pools", async function () {
      const { distributor, mockUSDC, addr2, activePoolId, creator } = await loadFixture(
        deployDistributorFixtureWithPool
      );

      // Approve USDC transfer
      const donationAmount = parseUnits("100", 6); // 100 USDC
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      // Make donation
      await distributor.write.donate([activePoolId, donationAmount], {
        account: addr2.account,
      });

      // Check creator balance (in this case only member)
      const creatorBalance = await distributor.read.getBalanceOf([creator.account.address]);
      expect(creatorBalance).to.equal(donationAmount);
    });

    it("Should emit DonationMade event", async function () {
      const { distributor, mockUSDC, addr2, activePoolId, publicClient } =
        await loadFixture(deployDistributorFixtureWithPool);

      // Approve and donate
      const donationAmount = parseUnits("100", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      const hash = await distributor.write.donate(
        [activePoolId, donationAmount],
        {
          account: addr2.account,
        }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.DonationMade();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.poolId).to.equal(activePoolId);
      expect(events[0].args.donor).to.equal(getAddress(addr2.account.address));
      expect(events[0].args.amount).to.equal(donationAmount);
    });

    it("Should revert donation to non-existent pool", async function () {
      const { distributor, mockUSDC, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      const donationAmount = parseUnits("100", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr1.account,
      });

      await expect(
        distributor.write.donate([999n, donationAmount], {
          account: addr1.account,
        })
      ).to.be.rejectedWith("PoolNotFound");
    });

    it("Should revert donation with zero amount", async function () {
      const { distributor, addr2, activePoolId } = await loadFixture(
        deployDistributorFixtureWithPool
      );

      await expect(
        distributor.write.donate([activePoolId, 0n], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("InvalidDonationAmount");
    });

    it("Should revert donation to inactive pool", async function () {
      const { distributor, mockUSDC, addr2, deactivatedPoolId } =
        await loadFixture(deployDistributorFixtureWithPool);

      // Try to donate
      const donationAmount = parseUnits("100", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      await expect(
        distributor.write.donate([deactivatedPoolId, donationAmount], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("PoolInactive");
    });

    it("Should revert donation to pending pool (with invitation slots)", async function () {
      const { distributor, mockUSDC, addr1, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      // Create pool with invitation slots - should be PENDING
      await distributor.write.createPool(
        [
          "Pending Pool",
          "Pool with invitation slots",
          "https://example.com/image.png",
          [BYTES_32_ZERO], // invitation code hash
          [5000n], // 50% for invitation slot
        ],
        { account: addr1.account }
      );

      const donationAmount = parseUnits("100", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      await expect(
        distributor.write.donate([1n, donationAmount], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("PoolPending");
    });

    it("Should split donations immediately to member balances", async function () {
      const { distributor, mockUSDC, creator, activePoolId } =
        await loadFixture(deployDistributorFixtureWithPool);

      const donationAmount = parseUnits("1000", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: creator.account,
      });

      // Get creator balance before donation
      const balanceBefore = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);

      await distributor.write.donate([activePoolId, donationAmount], {
        account: creator.account,
      });

      // Check that creator now has the full donation in their balance (100% share)
      const balanceAfter = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);

      expect(balanceAfter - balanceBefore).to.equal(donationAmount);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow members to withdraw their share", async function () {
      const { distributor, mockUSDC, creator, activePoolId, donationAmount } =
        await loadFixture(deployDistributorFixtureWithDonations);

      const initialBalance = await mockUSDC.read.balanceOf([
        creator.account.address,
      ]);
      await distributor.write.withdraw(
        [donationAmount, creator.account.address],
        { account: creator.account }
      );

      const finalBalance = await mockUSDC.read.balanceOf([
        creator.account.address,
      ]);
      expect(finalBalance).to.equal(initialBalance + donationAmount);
    });

    it("Should emit FundsWithdrawn event", async function () {
      const {
        distributor,
        mockUSDC,
        creator,
        donationAmount,
        activePoolId,
        publicClient,
      } = await loadFixture(deployDistributorFixtureWithDonations);

      // Withdraw
      const hash = await distributor.write.withdraw(
        [donationAmount, creator.account.address],
        {
          account: creator.account,
        }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.FundsWithdrawn();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.member).to.equal(
        getAddress(creator.account.address)
      );
      expect(events[0].args.amount).to.equal(donationAmount);
      expect(events[0].args.recipient).to.equal(
        getAddress(creator.account.address)
      );
    });

    it("Should track withdrawn amounts correctly", async function () {
      const { distributor, mockUSDC, creator, donationAmount, activePoolId } =
        await loadFixture(deployDistributorFixtureWithDonations);

      // Withdraw 100 USDC first
      const firstWithdraw = parseUnits("100", 6);
      await distributor.write.withdraw(
        [firstWithdraw, creator.account.address],
        {
          account: creator.account,
        }
      );

      // Check available balance (should be 1000 - 100 = 900)
      const availableBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(availableBalance).to.equal(donationAmount - firstWithdraw);

      // Withdraw remaining 900 USDC
      const secondWithdraw = parseUnits("900", 6);
      await distributor.write.withdraw(
        [secondWithdraw, creator.account.address],
        {
          account: creator.account,
        }
      );

      // Available balance should now be 0
      const finalAvailableBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(finalAvailableBalance).to.equal(0n);
    });

    it("Should revert withdrawal exceeding available balance", async function () {
      const { distributor, donationAmount, creator, addr3 } =
        await loadFixture(deployDistributorFixtureWithDonations);

      // Try to withdraw 400 USDC (more than 300 USDC share)
      await expect(
        distributor.write.withdraw(
          [donationAmount + 1n, addr3.account.address],
          { account: creator.account }
        )
      ).to.be.rejectedWith("InsufficientBalance");
    });

    it("Should allow withdrawal from inactive pool", async function () {
      const { distributor, creator, donationAmount } =
        await loadFixture(deployDistributorFixtureWithDonations);

      // Deactivate pool
      await distributor.write.deactivatePool([1n], {
        account: creator.account,
      });

      // Try to withdraw
      await expect(
        distributor.write.withdraw(
          [donationAmount, creator.account.address],
          {
            account: creator.account,
          }
        )
      ).not.to.be.rejected;
    });

    it("Should use global balances for withdrawals", async function () {
      const { distributor, mockUSDC, creator, donationAmount } =
        await loadFixture(deployDistributorFixtureWithDonations);

      // Creator should have global balance equal to donation amount
      const globalBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(globalBalance).to.equal(donationAmount);

      // Withdraw half
      const withdrawAmount = donationAmount / 2n;
      await distributor.write.withdraw(
        [withdrawAmount, creator.account.address],
        { account: creator.account }
      );

      // Global balance should be reduced
      const newGlobalBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(newGlobalBalance).to.equal(donationAmount - withdrawAmount);
    });
  });

  // describe("Pool Management", function () {
  //   it("Should allow creator to deactivate pool", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // Deactivate pool
  //     await distributor.write.deactivatePool([1n]);

  //     // Check pool is inactive
  //     const pool = await distributor.read.getPool([1n]);
  //     expect(pool.active).to.be.false;
  //   });

  //   it("Should emit PoolDeactivated event", async function () {
  //     const { distributor, addr1, publicClient } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // Deactivate pool
  //     const hash = await distributor.write.deactivatePool([1n]);

  //     await publicClient.waitForTransactionReceipt({ hash });
  //     const events = await distributor.getEvents.PoolDeactivated();

  //     expect(events).to.have.lengthOf(1);
  //     expect(events[0].args.poolId).to.equal(1n);
  //   });

  //   it("Should revert deactivation by non-creator", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // addr2 tries to deactivate (not creator)
  //     await expect(
  //       distributor.write.deactivatePool([1n], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("NotPoolCreator");
  //   });

  //   it("Should revert deactivation of non-existent pool", async function () {
  //     const { distributor } = await loadFixture(deployDistributorFixture);

  //     await expect(distributor.write.deactivatePool([999n])).to.be.rejectedWith(
  //       "PoolNotFound"
  //     );
  //   });
  // });

  // describe("View Functions", function () {
  //   it("Should return correct pool information", async function () {
  //     const { distributor, owner, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "A test description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     const pool = await distributor.read.getPool([1n]);
  //     expect(pool.id).to.equal(1n);
  //     expect(pool.creator).to.equal(getAddress(owner.account.address));
  //     expect(pool.title).to.equal("Test Pool");
  //     expect(pool.description).to.equal("A test description");
  //     expect(pool.imageUri).to.equal("https://example.com/image.png");
  //     expect(pool.totalBalance).to.equal(0n);
  //     expect(pool.totalWithdrawn).to.equal(0n);
  //     expect(pool.active).to.be.true;
  //   });

  //   it("Should return correct member information", async function () {
  //     const { distributor, owner, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address, addr2.account.address],
  //       [3000n, 2000n],
  //       [
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //       ], // No invitation codes
  //     ]);

  //     const [members] = await distributor.read.getPoolMembers([1n, 0n, 100n]);
  //     expect(members).to.have.lengthOf(3);

  //     // All members should have zero withdrawn initially
  //     members.forEach((member) => {
  //       expect(member.totalWithdrawn).to.equal(0n);
  //       expect(Number(member.percentage)).to.be.greaterThan(0);
  //     });
  //   });

  //   it("Should calculate available balance correctly", async function () {
  //     const { distributor, mockUSDC, owner, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool where creator has 70% and addr1 has 30%
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // Donate 1000 USDC
  //     const donationAmount = parseUnits("1000", 6);
  //     await mockUSDC.write.approve([distributor.address, donationAmount]);
  //     await distributor.write.donate([1n, donationAmount]);

  //     // Check available balances
  //     const creatorAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       owner.account.address,
  //     ]);
  //     const memberAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr1.account.address,
  //     ]);

  //     expect(creatorAvailable).to.equal(parseUnits("700", 6)); // 70% of 1000
  //     expect(memberAvailable).to.equal(parseUnits("300", 6)); // 30% of 1000
  //   });

  //   it("Should return 0 available balance for non-members", async function () {
  //     const { distributor, mockUSDC, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with only addr1 as member
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // Donate funds
  //     const donationAmount = parseUnits("1000", 6);
  //     await mockUSDC.write.approve([distributor.address, donationAmount]);
  //     await distributor.write.donate([1n, donationAmount]);

  //     // Check that non-member has 0 available balance
  //     const nonMemberAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr2.account.address,
  //     ]);
  //     expect(nonMemberAvailable).to.equal(0n);
  //   });

  //   it("Should increment pool ID correctly", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     expect(await distributor.read.getNextPoolId()).to.equal(1n);

  //     await distributor.write.createPool([
  //       "Pool 1",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     expect(await distributor.read.getNextPoolId()).to.equal(2n);

  //     await distributor.write.createPool([
  //       "Pool 2",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [4000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     expect(await distributor.read.getNextPoolId()).to.equal(3n);
  //   });
  // });

  // describe("Edge Cases", function () {
  //   it("Should handle multiple donations and withdrawals correctly", async function () {
  //     const { distributor, mockUSDC, owner, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n], // 30% for addr1, 70% for creator
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     // Multiple donations
  //     const donation1 = parseUnits("500", 6);
  //     const donation2 = parseUnits("300", 6);
  //     const donation3 = parseUnits("200", 6);

  //     await mockUSDC.write.approve([distributor.address, donation1]);
  //     await distributor.write.donate([1n, donation1]);

  //     await mockUSDC.write.approve([distributor.address, donation2], {
  //       account: addr2.account,
  //     });
  //     await distributor.write.donate([1n, donation2], {
  //       account: addr2.account,
  //     });

  //     await mockUSDC.write.approve([distributor.address, donation3], {
  //       account: addr1.account,
  //     });
  //     await distributor.write.donate([1n, donation3], {
  //       account: addr1.account,
  //     });

  //     // Total pool should be 1000 USDC
  //     const totalBalance = await distributor.read.getPoolBalance([1n]);
  //     expect(totalBalance).to.equal(parseUnits("1000", 6));

  //     // Creator should have 700 USDC available (70%)
  //     const creatorAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       owner.account.address,
  //     ]);
  //     expect(creatorAvailable).to.equal(parseUnits("700", 6));

  //     // Member should have 300 USDC available (30%)
  //     const memberAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr1.account.address,
  //     ]);
  //     expect(memberAvailable).to.equal(parseUnits("300", 6));

  //     // Partial withdrawals
  //     await distributor.write.withdraw([
  //       1n,
  //       parseUnits("100", 6),
  //       owner.account.address,
  //     ]);
  //     await distributor.write.withdraw(
  //       [1n, parseUnits("50", 6), addr2.account.address],
  //       {
  //         account: addr1.account,
  //       }
  //     );

  //     // Check remaining available balances
  //     const creatorRemainingAvailable =
  //       await distributor.read.getAvailableBalance([1n, owner.account.address]);
  //     const memberRemainingAvailable =
  //       await distributor.read.getAvailableBalance([1n, addr1.account.address]);

  //     expect(creatorRemainingAvailable).to.equal(parseUnits("600", 6)); // 700 - 100
  //     expect(memberRemainingAvailable).to.equal(parseUnits("250", 6)); // 300 - 50
  //   });

  //   it("Should handle pools with single member (creator only)", async function () {
  //     const { distributor, mockUSDC, owner } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with no additional members
  //     await distributor.write.createPool([
  //       "Solo Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [], // No additional members
  //       [], // No additional percentages
  //       [], // No invitation codes (empty array for empty members array)
  //     ]);

  //     const [members] = await distributor.read.getPoolMembers([1n, 0n, 100n]);
  //     expect(members).to.have.lengthOf(1);
  //     expect(members[0].memberAddress).to.equal(
  //       getAddress(owner.account.address)
  //     );
  //     expect(members[0].percentage).to.equal(10000n); // 100%

  //     // Donate and check creator gets 100%
  //     const donationAmount = parseUnits("1000", 6);
  //     await mockUSDC.write.approve([distributor.address, donationAmount]);
  //     await distributor.write.donate([1n, donationAmount]);

  //     const available = await distributor.read.getAvailableBalance([
  //       1n,
  //       owner.account.address,
  //     ]);
  //     expect(available).to.equal(donationAmount);
  //   });

  //   it("Should handle very small percentages correctly", async function () {
  //     const { distributor, mockUSDC, owner, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with 1% for member (0.01%)
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [1n], // 0.01% in basis points
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     const donationAmount = parseUnits("10000", 6); // 10,000 USDC
  //     await mockUSDC.write.approve([distributor.address, donationAmount]);
  //     await distributor.write.donate([1n, donationAmount]);

  //     // Member should get 1 USDC (0.01% of 10,000)
  //     const memberAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr1.account.address,
  //     ]);
  //     expect(memberAvailable).to.equal(parseUnits("1", 6));

  //     // Creator should get the rest
  //     const creatorAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       owner.account.address,
  //     ]);
  //     expect(creatorAvailable).to.equal(parseUnits("9999", 6));
  //   });
  // });

  // describe("Invitation Codes", function () {
  //   it("Should create pool with invitation code hashes", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create hash for invitation code "secret123"
  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Pool with invitation codes",
  //       "https://example.com/image.png",
  //       ["0x0000000000000000000000000000000000000000", addr1.account.address], // First slot for invitation, second direct
  //       [3000n, 2000n], // 30% and 20%
  //       [
  //         invitationCodeHash,
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //       ], // Hash for first slot, no code for direct member
  //     ]);

  //     const [members] = await distributor.read.getPoolMembers([1n, 0n, 100n]);
  //     expect(members).to.have.lengthOf(3); // Creator + 2 members

  //     // Check invitation slot
  //     const invitationSlot = members.find(
  //       (m) => m.memberAddress === "0x0000000000000000000000000000000000000000"
  //     );
  //     expect(invitationSlot).to.not.be.undefined;
  //     expect(invitationSlot?.invitationCodeHash).to.equal(invitationCodeHash);
  //     expect(invitationSlot?.percentage).to.equal(3000n);

  //     // Check direct member
  //     const directMember = members.find(
  //       (m) => getAddress(m.memberAddress) === getAddress(addr1.account.address)
  //     );
  //     expect(directMember).to.not.be.undefined;
  //     expect(directMember?.invitationCodeHash).to.equal(
  //       "0x0000000000000000000000000000000000000000000000000000000000000000"
  //     );
  //     expect(directMember?.percentage).to.equal(2000n);
  //   });

  //   it("Should allow joining with correct invitation code", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create hash for invitation code "secret123"
  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     // Create pool with invitation slot
  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Pool with invitation codes",
  //       "https://example.com/image.png",
  //       ["0x0000000000000000000000000000000000000000"], // One invitation slot
  //       [4000n], // 40%
  //       [invitationCodeHash], // Hash for the slot
  //     ]);

  //     // addr2 joins using invitation code
  //     await distributor.write.joinPool([1n, invitationCode], {
  //       account: addr2.account,
  //     });

  //     // Check that addr2 is now a member
  //     const [members] = await distributor.read.getPoolMembers([1n, 0n, 100n]);
  //     const joinedMember = members.find(
  //       (m) => getAddress(m.memberAddress) === getAddress(addr2.account.address)
  //     );

  //     expect(joinedMember).to.not.be.undefined;
  //     expect(joinedMember?.percentage).to.equal(4000n);

  //     // Verify addr2 is recognized as a member
  //     expect(
  //       await distributor.read.getAvailableBalance([1n, addr2.account.address])
  //     ).to.equal(0n); // No donations yet
  //   });

  //   it("Should emit MemberJoined event when joining", async function () {
  //     const { distributor, addr2, publicClient } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       ["0x0000000000000000000000000000000000000000"],
  //       [5000n],
  //       [invitationCodeHash],
  //     ]);

  //     const hash = await distributor.write.joinPool([1n, invitationCode], {
  //       account: addr2.account,
  //     });

  //     const receipt = await publicClient.waitForTransactionReceipt({ hash });
  //     const events = await distributor.getEvents.MemberJoined();

  //     expect(events).to.have.lengthOf(1);
  //     expect(events[0].args.poolId).to.equal(1n);
  //     expect(events[0].args.member).to.equal(getAddress(addr2.account.address));
  //     expect(events[0].args.percentage).to.equal(5000n);
  //   });

  //   it("Should reject wrong invitation code", async function () {
  //     const { distributor, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       ["0x0000000000000000000000000000000000000000"],
  //       [5000n],
  //       [invitationCodeHash],
  //     ]);

  //     await expect(
  //       distributor.write.joinPool([1n, "wrongcode"], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("InvalidInvitationCode");
  //   });

  //   it("Should reject joining slot without invitation code", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with direct member (no invitation code)
  //     await distributor.write.createPool([
  //       "Regular Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [5000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
  //     ]);

  //     await expect(
  //       distributor.write.joinPool([1n, "anycode"], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("InvalidInvitationCode");
  //   });

  //   it("Should prevent duplicate member joining", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address, "0x0000000000000000000000000000000000000000"],
  //       [3000n, 2000n],
  //       [
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //         invitationCodeHash,
  //       ],
  //     ]);

  //     // First join should work
  //     await distributor.write.joinPool([1n, invitationCode], {
  //       account: addr2.account,
  //     });

  //     // Second join should fail
  //     await expect(
  //       distributor.write.joinPool([1n, "anythingelse"], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("MemberAlreadyInPool");
  //   });

  //   it("Should prevent joining when no slots available", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with no invitation slots (all direct members)
  //     await distributor.write.createPool([
  //       "Full Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [5000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     await expect(
  //       distributor.write.joinPool([1n, "anycode"], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("InvalidInvitationCode");
  //   });

  //   it("Should handle multiple invitation slots correctly", async function () {
  //     const { distributor, addr1, addr2, addr3 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const code1 = "secret123";
  //     const code2 = "secret456";
  //     const hash1 = keccak256(
  //       `0x${Buffer.from(code1, "utf8").toString("hex")}`
  //     );
  //     const hash2 = keccak256(
  //       `0x${Buffer.from(code2, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Multi-invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [
  //         "0x0000000000000000000000000000000000000000", // First invitation slot
  //         "0x0000000000000000000000000000000000000000", // Second invitation slot
  //       ],
  //       [4000n, 3000n], // 40% and 30%
  //       [hash1, hash2], // Different codes for each slot
  //     ]);

  //     // Join with first code
  //     await distributor.write.joinPool([1n, code1], {
  //       account: addr2.account,
  //     });

  //     // Join with second code
  //     await distributor.write.joinPool([1n, code2], {
  //       account: addr3.account,
  //     });

  //     const [members] = await distributor.read.getPoolMembers([1n, 0n, 100n]);

  //     // Find the joined members
  //     const member2 = members.find(
  //       (m) => getAddress(m.memberAddress) === getAddress(addr2.account.address)
  //     );
  //     const member3 = members.find(
  //       (m) => getAddress(m.memberAddress) === getAddress(addr3.account.address)
  //     );

  //     expect(member2?.percentage).to.equal(4000n); // First slot
  //     expect(member3?.percentage).to.equal(3000n); // Second slot
  //   });

  //   it("Should work with donations and withdrawals after joining", async function () {
  //     const { distributor, mockUSDC, addr1, addr2, addr3 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     // Create pool with invitation slot (creator 50%, addr1 30%, invitation slot 20%)
  //     await distributor.write.createPool([
  //       "Functional Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address, "0x0000000000000000000000000000000000000000"],
  //       [3000n, 2000n],
  //       [
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //         invitationCodeHash,
  //       ],
  //     ]);

  //     // addr3 joins
  //     await distributor.write.joinPool([1n, invitationCode], {
  //       account: addr3.account,
  //     });

  //     // Someone donates
  //     const donationAmount = parseUnits("1000", 6);
  //     await mockUSDC.write.approve([distributor.address, donationAmount], {
  //       account: addr2.account,
  //     });
  //     await distributor.write.donate([1n, donationAmount], {
  //       account: addr2.account,
  //     });

  //     // Check balances
  //     const addr1Available = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr1.account.address,
  //     ]);
  //     const joinedMemberAvailable = await distributor.read.getAvailableBalance([
  //       1n,
  //       addr3.account.address,
  //     ]);

  //     expect(addr1Available).to.equal(parseUnits("300", 6)); // 30% of 1000
  //     expect(joinedMemberAvailable).to.equal(parseUnits("200", 6)); // 20% of 1000

  //     // Test withdrawal
  //     const initialBalance = await mockUSDC.read.balanceOf([
  //       addr2.account.address,
  //     ]);
  //     await distributor.write.withdraw(
  //       [1n, parseUnits("200", 6), addr2.account.address],
  //       {
  //         account: addr3.account,
  //       }
  //     );
  //     const finalBalance = await mockUSDC.read.balanceOf([
  //       addr2.account.address,
  //     ]);

  //     expect(finalBalance - initialBalance).to.equal(parseUnits("200", 6));
  //   });

  //   it("Should reject joining non-existent pool", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     await expect(
  //       distributor.write.joinPool([999n, "anycode"], {
  //         account: addr1.account,
  //       })
  //     ).to.be.rejectedWith("PoolNotFound");
  //   });

  //   it("Should reject joining inactive pool", async function () {
  //     const { distributor, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       ["0x0000000000000000000000000000000000000000"],
  //       [5000n],
  //       [invitationCodeHash],
  //     ]);

  //     // Deactivate pool
  //     await distributor.write.deactivatePool([1n]);

  //     await expect(
  //       distributor.write.joinPool([1n, invitationCode], {
  //         account: addr2.account,
  //       })
  //     ).to.be.rejectedWith("PoolInactive");
  //   });
  // });

  // describe("User Pool Membership", function () {
  //   it("Should return empty array for user with no pool memberships", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const [userPools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(userPools).to.have.lengthOf(0);
  //   });

  //   it("Should return correct pools for pool creator", async function () {
  //     const { distributor, owner, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Creator creates a pool
  //     await distributor.write.createPool([
  //       "Creator Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     const [creatorPools] = await distributor.read.getUserPools([
  //       owner.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(creatorPools).to.have.lengthOf(1);
  //     expect(creatorPools[0]).to.equal(1n);

  //     const [memberPools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(memberPools).to.have.lengthOf(1);
  //     expect(memberPools[0]).to.equal(1n);
  //   });

  //   it("Should return multiple pools for user in multiple pools", async function () {
  //     const { distributor, owner, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create first pool where addr1 is a member
  //     await distributor.write.createPool([
  //       "Pool 1",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [5000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     // Create second pool where addr1 is also a member
  //     await distributor.write.createPool([
  //       "Pool 2",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr2.account.address, addr1.account.address],
  //       [3000n, 4000n],
  //       [
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //       ],
  //     ]);

  //     // Create third pool where addr1 is NOT a member
  //     await distributor.write.createPool([
  //       "Pool 3",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr2.account.address],
  //       [6000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     // Check addr1's pools (should be in pools 1 and 2)
  //     const [addr1Pools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr1Pools).to.have.lengthOf(2);
  //     expect(addr1Pools).to.include(1n);
  //     expect(addr1Pools).to.include(2n);
  //     expect(addr1Pools).to.not.include(3n);

  //     // Check addr2's pools (should be in pools 2 and 3)
  //     const [addr2Pools] = await distributor.read.getUserPools([
  //       addr2.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr2Pools).to.have.lengthOf(2);
  //     expect(addr2Pools).to.include(2n);
  //     expect(addr2Pools).to.include(3n);
  //     expect(addr2Pools).to.not.include(1n);

  //     // Check creator's pools (should be in all 3 pools as creator)
  //     const [creatorPools] = await distributor.read.getUserPools([
  //       owner.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(creatorPools).to.have.lengthOf(3);
  //     expect(creatorPools).to.include(1n);
  //     expect(creatorPools).to.include(2n);
  //     expect(creatorPools).to.include(3n);
  //   });

  //   it("Should include pools joined via invitation code", async function () {
  //     const { distributor, owner, addr1, addr2 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     const invitationCode = "secret123";
  //     const invitationCodeHash = keccak256(
  //       `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
  //     );

  //     // Create pool with invitation slot
  //     await distributor.write.createPool([
  //       "Invitation Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address, "0x0000000000000000000000000000000000000000"], // Direct member + invitation slot
  //       [3000n, 4000n],
  //       [
  //         "0x0000000000000000000000000000000000000000000000000000000000000000",
  //         invitationCodeHash,
  //       ],
  //     ]);

  //     // addr2 joins via invitation
  //     await distributor.write.joinPool([1n, invitationCode], {
  //       account: addr2.account,
  //     });

  //     // Check that addr2 is now included in getUserPools
  //     const [addr2Pools] = await distributor.read.getUserPools([
  //       addr2.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr2Pools).to.have.lengthOf(1);
  //     expect(addr2Pools[0]).to.equal(1n);

  //     // Check other members too
  //     const [creatorPools] = await distributor.read.getUserPools([
  //       owner.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(creatorPools).to.have.lengthOf(1);

  //     const [addr1Pools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr1Pools).to.have.lengthOf(1);
  //   });

  //   it("Should not include deactivated pools if user is only a member", async function () {
  //     const { distributor, owner, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool
  //     await distributor.write.createPool([
  //       "Test Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [5000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     // Verify membership before deactivation
  //     let [addr1Pools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr1Pools).to.have.lengthOf(1);

  //     // Deactivate pool
  //     await distributor.write.deactivatePool([1n]);

  //     // getUserPools should still return the pool (membership doesn't change)
  //     [addr1Pools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr1Pools).to.have.lengthOf(1);
  //     expect(addr1Pools[0]).to.equal(1n);

  //     // Creator should also still be listed
  //     const [creatorPools] = await distributor.read.getUserPools([
  //       owner.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(creatorPools).to.have.lengthOf(1);
  //   });

  //   it("Should handle creator-only pools correctly", async function () {
  //     const { distributor, owner } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create pool with only creator as member
  //     await distributor.write.createPool([
  //       "Creator Only Pool",
  //       "Description",
  //       "https://example.com/image.png",
  //       [], // No additional members
  //       [], // No additional percentages
  //       [], // No invitation codes
  //     ]);

  //     const [creatorPools] = await distributor.read.getUserPools([
  //       owner.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(creatorPools).to.have.lengthOf(1);
  //     expect(creatorPools[0]).to.equal(1n);
  //   });

  //   it("Should return pools in ascending order by pool ID", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // Create multiple pools with addr1 as member
  //     await distributor.write.createPool([
  //       "Pool 1",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [2000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     await distributor.write.createPool([
  //       "Pool 2",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [3000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     await distributor.write.createPool([
  //       "Pool 3",
  //       "Description",
  //       "https://example.com/image.png",
  //       [addr1.account.address],
  //       [4000n],
  //       ["0x0000000000000000000000000000000000000000000000000000000000000000"],
  //     ]);

  //     const [addr1Pools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(addr1Pools).to.have.lengthOf(3);
  //     expect(addr1Pools[0]).to.equal(1n);
  //     expect(addr1Pools[1]).to.equal(2n);
  //     expect(addr1Pools[2]).to.equal(3n);
  //   });

  //   it("Should handle zero case when no pools exist", async function () {
  //     const { distributor, addr1 } = await loadFixture(
  //       deployDistributorFixture
  //     );

  //     // No pools created yet
  //     const [userPools] = await distributor.read.getUserPools([
  //       addr1.account.address,
  //       0n,
  //       100n,
  //     ]);
  //     expect(userPools).to.have.lengthOf(0);
  //   });
  // });
});
