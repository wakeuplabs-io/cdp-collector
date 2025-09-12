import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, keccak256, parseUnits, toBytes } from "viem";

const BYTES_32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("Distributor", function () {
  async function deployDistributorFixture() {
    const [owner, creator, addr1, addr2, addr3] =
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
    await mockUSDC.write.mint([addr1.account.address, mintAmount]);
    await mockUSDC.write.mint([addr2.account.address, mintAmount]);
    await mockUSDC.write.mint([addr3.account.address, mintAmount]);

    return {
      distributor,
      mockUSDC,
      owner,
      creator,
      addr1,
      addr2,
      addr3,
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

    const singleMemberPoolId = 1n;
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

    const multiMemberPoolId = 2n;
    const invitationCode = "1234567890";
    const invitationCodeHash = keccak256(toBytes(invitationCode));
    await distributor.write.createPool(
      [
        "Test Pool",
        "A test pool for fundraising",
        "https://example.com/image.png",
        [invitationCodeHash],
        [5000n],
      ],
      { account: creator.account }
    );
    await distributor.write.joinPool([multiMemberPoolId, invitationCode], {
      account: addr2.account,
    });

    const deactivatedPoolId = 3n;
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
    await distributor.write.deactivatePool([deactivatedPoolId], {
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
      singleMemberPoolId,
      multiMemberPoolId,
      deactivatedPoolId,
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

    // single member pool
    const singleMemberPoolId = 1n;
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

    // multi member pool
    const multiMemberPoolId = 2n;
    const invitationCode = "1234567890";
    const invitationCodeHash = keccak256(toBytes(invitationCode));
    await distributor.write.createPool(
      [
        "Test Pool",
        "A test pool for fundraising",
        "https://example.com/image.png",
        [invitationCodeHash],
        [5000n],
      ],
      { account: creator.account }
    );
    await distributor.write.joinPool([multiMemberPoolId, invitationCode], {
      account: donor.account,
    });

    // make donation to both pools
    const donationAmount = parseUnits("1000", 6);
    await mockUSDC.write.approve([distributor.address, donationAmount * 2n], {
      account: donor.account,
    });
    await distributor.write.donate([singleMemberPoolId, donationAmount], {
      account: donor.account,
    });
    await distributor.write.donate([multiMemberPoolId, donationAmount], {
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
      singleMemberPoolId,
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
          [],
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
      expect(pool.status).to.equal(1); // PoolStatus.ACTIVE because no invitation codes are provided
    });

    it("Should create a pool with PENDING status if invitation codes are provided", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      await distributor.write.createPool(
        [
          "Test Pool",
          "A test pool for fundraising",
          "https://example.com/image.png",
          [BYTES_32_ZERO],
          [5000n],
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
      expect(pool.status).to.equal(0); // PoolStatus.PENDING because invitation codes are provided
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
      const { distributor, mockUSDC, addr2, singleMemberPoolId, creator } =
        await loadFixture(deployDistributorFixtureWithPool);

      // Approve USDC transfer
      const donationAmount = parseUnits("100", 6); // 100 USDC
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      // Make donation
      await distributor.write.donate([singleMemberPoolId, donationAmount], {
        account: addr2.account,
      });

      // Check creator balance (in this case only member)
      const creatorBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(creatorBalance).to.equal(donationAmount);
    });

    it("Should emit DonationMade event", async function () {
      const { distributor, mockUSDC, addr2, singleMemberPoolId, publicClient } =
        await loadFixture(deployDistributorFixtureWithPool);

      // Approve and donate
      const donationAmount = parseUnits("100", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });

      const hash = await distributor.write.donate(
        [singleMemberPoolId, donationAmount],
        {
          account: addr2.account,
        }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.DonationMade();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.poolId).to.equal(singleMemberPoolId);
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
      const { distributor, addr2, singleMemberPoolId } = await loadFixture(
        deployDistributorFixtureWithPool
      );

      await expect(
        distributor.write.donate([singleMemberPoolId, 0n], {
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
      const { distributor, mockUSDC, creator, singleMemberPoolId } =
        await loadFixture(deployDistributorFixtureWithPool);

      const donationAmount = parseUnits("1000", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: creator.account,
      });

      // Get creator balance before donation
      const balanceBefore = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);

      await distributor.write.donate([singleMemberPoolId, donationAmount], {
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
      const { distributor, mockUSDC, creator, donationAmount } =
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
      const { distributor, creator, donationAmount, publicClient } =
        await loadFixture(deployDistributorFixtureWithDonations);

      // Withdraw
      const hash = await distributor.write.withdraw(
        [donationAmount, creator.account.address],
        { account: creator.account }
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
      const { distributor, creator } = await loadFixture(
        deployDistributorFixtureWithDonations
      );

      const initialBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);

      // Withdraw 100 USDC first
      const firstWithdraw = parseUnits("100", 6);
      await distributor.write.withdraw(
        [firstWithdraw, creator.account.address],
        { account: creator.account }
      );

      // Check available balance (should be 1000 - 100 = 900)
      const availableBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(availableBalance).to.equal(initialBalance - firstWithdraw);

      // Withdraw remaining 900 USDC
      await distributor.write.withdraw(
        [availableBalance, creator.account.address],
        { account: creator.account }
      );

      // Available balance should now be 0
      const finalAvailableBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);
      expect(finalAvailableBalance).to.equal(0n);
    });

    it("Should revert withdrawal exceeding available balance", async function () {
      const { distributor, creator, addr3 } = await loadFixture(
        deployDistributorFixtureWithDonations
      );

      const availableBalance = await distributor.read.getBalanceOf([
        creator.account.address,
      ]);

      // Try to withdraw more than the balance
      await expect(
        distributor.write.withdraw(
          [availableBalance + 1n, addr3.account.address],
          { account: creator.account }
        )
      ).to.be.rejectedWith("InsufficientBalance");
    });

    it("Should allow withdrawal from inactive pool", async function () {
      const { distributor, creator, donationAmount } = await loadFixture(
        deployDistributorFixtureWithDonations
      );

      // Deactivate pool
      await distributor.write.deactivatePool([1n], {
        account: creator.account,
      });

      // Try to withdraw
      await expect(
        distributor.write.withdraw([donationAmount, creator.account.address], {
          account: creator.account,
        })
      ).not.to.be.rejected;
    });
  });

  describe("Pool Management", function () {
    it("Should allow creator to deactivate pool", async function () {
      const { distributor, creator, singleMemberPoolId } = await loadFixture(
        deployDistributorFixtureWithPool
      );
      // Deactivate pool
      await distributor.write.deactivatePool([singleMemberPoolId], {
        account: creator.account,
      });

      // Check pool is inactive
      const pool = await distributor.read.getPool([singleMemberPoolId]);
      expect(pool.status).to.equal(2); // PoolStatus.INACTIVE
    });

    it("Should emit PoolDeactivated event", async function () {
      const { distributor, creator, singleMemberPoolId, publicClient } =
        await loadFixture(deployDistributorFixtureWithPool);

      // Deactivate pool
      const hash = await distributor.write.deactivatePool(
        [singleMemberPoolId],
        {
          account: creator.account,
        }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.PoolDeactivated();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.poolId).to.equal(singleMemberPoolId);
    });

    it("Should revert deactivation by non-creator", async function () {
      const { distributor, creator, singleMemberPoolId, addr2 } =
        await loadFixture(deployDistributorFixtureWithPool);

      // addr2 tries to deactivate (not creator)
      await expect(
        distributor.write.deactivatePool([singleMemberPoolId], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("NotPoolCreator");
    });

    it("Should revert deactivation of non-existent pool", async function () {
      const { distributor } = await loadFixture(
        deployDistributorFixtureWithPool
      );

      await expect(distributor.write.deactivatePool([999n])).to.be.rejectedWith(
        "PoolNotFound"
      );
    });
  });

  describe("Invitation Codes", function () {
    it("Should create pool with invitation code hashes", async function () {
      const { distributor, creator } = await loadFixture(
        deployDistributorFixture
      );

      // Create hash for invitation code "secret123"
      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Invitation Pool",
        "Pool with invitation codes",
        "https://example.com/image.png",
        [invitationCodeHash, BYTES_32_ZERO], // First slot for invitation, second direct
        [3000n, 2000n], // 30% and 20%
      ], { account: creator.account });

      const members = await distributor.read.getPoolMembers([1n, 0n, 100n]);
      expect(members).to.have.lengthOf(3); // Creator + 2 invitation slots

      // Check first invitation slot (with invitationCodeHash)
      const invitationSlot = members.find(
        (m: any) =>
          m.member === "0x0000000000000000000000000000000000000000" &&
          m.invitationCodeHash === invitationCodeHash
      );
      expect(invitationSlot).to.not.be.undefined;
      expect(invitationSlot?.invitationCodeHash).to.equal(invitationCodeHash);
      expect(invitationSlot?.percentage).to.equal(3000n);

      // Check second invitation slot (with BYTES_32_ZERO)
      const directSlot = members.find(
        (m: any) =>
          m.member === "0x0000000000000000000000000000000000000000" &&
          m.invitationCodeHash === BYTES_32_ZERO
      );
      expect(directSlot).to.not.be.undefined;
      expect(directSlot?.invitationCodeHash).to.equal(BYTES_32_ZERO);
      expect(directSlot?.percentage).to.equal(2000n);
    });

    it("Should allow joining with correct invitation code", async function () {
      const { distributor, creator, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      // Create hash for invitation code "secret123"
      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      // Create pool with invitation slot
      await distributor.write.createPool([
        "Invitation Pool",
        "Pool with invitation codes",
        "https://example.com/image.png",
        [invitationCodeHash], // Hash for the slot
        [4000n], // 40%
      ], { account: creator.account });

      // addr2 joins using invitation code
      await distributor.write.joinPool([1n, invitationCode], {
        account: addr2.account,
      });

      // Check that addr2 is now a member
      const members = await distributor.read.getPoolMembers([1n, 0n, 100n]);
      const joinedMember = members.find(
        (m: any) => getAddress(m.member) === getAddress(addr2.account.address)
      );

      expect(joinedMember).to.not.be.undefined;
      expect(joinedMember?.percentage).to.equal(4000n);

      // Verify addr2 is recognized as a member
      expect(
        await distributor.read.getBalanceOf([addr2.account.address])
      ).to.equal(0n); // No donations yet
    });

    it("Should emit MemberJoined event when joining", async function () {
      const { distributor, creator, addr2, publicClient } = await loadFixture(
        deployDistributorFixture
      );

      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Invitation Pool",
        "Description",
        "https://example.com/image.png",
        [invitationCodeHash],
        [5000n],
      ], { account: creator.account });

      const hash = await distributor.write.joinPool([1n, invitationCode], {
        account: addr2.account,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      const events = await distributor.getEvents.MemberJoined();

      expect(events).to.have.lengthOf(1);
      expect(events[0].args.poolId).to.equal(1n);
      expect(events[0].args.member).to.equal(getAddress(addr2.account.address));
      expect(events[0].args.percentage).to.equal(5000n);
    });

    it("Should reject wrong invitation code", async function () {
      const { distributor, creator, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Invitation Pool",
        "Description",
        "https://example.com/image.png",
        [invitationCodeHash],
        [5000n],
      ], { account: creator.account });

      await expect(
        distributor.write.joinPool([1n, "wrongcode"], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("InvalidInvitationCode");
    });

    it("Should reject joining slot without invitation code", async function () {
      const { distributor, creator, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      // Create pool with direct member (no invitation code)
      await distributor.write.createPool([
        "Regular Pool",
        "Description",
        "https://example.com/image.png",
        ["0x0000000000000000000000000000000000000000000000000000000000000000"], // No invitation code
        [5000n],
      ], { account: creator.account });

      await expect(
        distributor.write.joinPool([1n, "anycode"], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("InvalidInvitationCode");
    });

    it("Should prevent duplicate member joining", async function () {
      const { distributor, creator, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Invitation Pool",
        "Description",
        "https://example.com/image.png",
        [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          invitationCodeHash,
        ],
        [3000n, 2000n],
      ], { account: creator.account });

      // First join should work
      await distributor.write.joinPool([1n, invitationCode], {
        account: addr2.account,
      });

      // Second join should fail
      await expect(
        distributor.write.joinPool([1n, "anythingelse"], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("MemberAlreadyInPool");
    });

    it("Should prevent joining when no slots available", async function () {
      const { distributor, creator, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      // Create pool with no invitation slots (all direct members)
      await distributor.write.createPool([
        "Full Pool",
        "Description",
        "https://example.com/image.png",
        ["0x0000000000000000000000000000000000000000000000000000000000000000"],
        [5000n],
      ], { account: creator.account });

      await expect(
        distributor.write.joinPool([1n, "anycode"], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("InvalidInvitationCode");
    });

    it("Should handle multiple invitation slots correctly", async function () {
      const { distributor, creator, addr2, addr3 } = await loadFixture(
        deployDistributorFixture
      );

      const code1 = "secret123";
      const code2 = "secret456";
      const hash1 = keccak256(
        `0x${Buffer.from(code1, "utf8").toString("hex")}`
      );
      const hash2 = keccak256(
        `0x${Buffer.from(code2, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Multi-invitation Pool",
        "Description",
        "https://example.com/image.png",
        [hash1, hash2], // Different codes for each slot
        [4000n, 3000n], // 40% and 30%
      ], { account: creator.account });

      // Join with first code
      await distributor.write.joinPool([1n, code1], {
        account: addr2.account,
      });

      // Join with second code
      await distributor.write.joinPool([1n, code2], {
        account: addr3.account,
      });

      const members = await distributor.read.getPoolMembers([1n, 0n, 100n]);

      // Find the joined members
      const member2 = members.find(
        (m: any) => getAddress(m.member) === getAddress(addr2.account.address)
      );
      const member3 = members.find(
        (m: any) => getAddress(m.member) === getAddress(addr3.account.address)
      );

      expect(member2?.percentage).to.equal(4000n); // First slot
      expect(member3?.percentage).to.equal(3000n); // Second slot
    });

    it("Should work with donations and withdrawals after joining", async function () {
      const { distributor, mockUSDC, creator, addr2, addr3 } =
        await loadFixture(deployDistributorFixture);

      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      // Create pool with invitation slot (creator gets 80%, invitation slot gets 20%)
      await distributor.write.createPool(
        [
          "Functional Pool",
          "Description",
          "https://example.com/image.png",
          [invitationCodeHash],
          [2000n],
        ],
        { account: creator.account }
      );

      // addr3 joins
      await distributor.write.joinPool([1n, invitationCode], {
        account: addr3.account,
      });

      // Someone donates
      const donationAmount = parseUnits("1000", 6);
      await mockUSDC.write.approve([distributor.address, donationAmount], {
        account: addr2.account,
      });
      await distributor.write.donate([1n, donationAmount], {
        account: addr2.account,
      });

      // Check balances - creator gets 80%, joined member gets 20%
      const creatorAvailable = await distributor.read.getBalanceOf([
        creator.account.address, // owner is the creator
      ]);
      const joinedMemberAvailable = await distributor.read.getBalanceOf([
        addr3.account.address,
      ]);

      expect(creatorAvailable).to.equal(parseUnits("800", 6)); // 80% of 1000 (creator percentage)
      expect(joinedMemberAvailable).to.equal(parseUnits("200", 6)); // 20% of 1000

      // Test withdrawal
      const initialBalance = await mockUSDC.read.balanceOf([
        addr2.account.address,
      ]);
      await distributor.write.withdraw(
        [parseUnits("200", 6), addr2.account.address],
        {
          account: addr3.account,
        }
      );
      const finalBalance = await mockUSDC.read.balanceOf([
        addr2.account.address,
      ]);

      expect(finalBalance - initialBalance).to.equal(parseUnits("200", 6));
    });

    it("Should reject joining non-existent pool", async function () {
      const { distributor, addr1 } = await loadFixture(
        deployDistributorFixture
      );

      await expect(
        distributor.write.joinPool([999n, "anycode"], {
          account: addr1.account,
        })
      ).to.be.rejectedWith("PoolNotFound");
    });

    it("Should reject joining inactive pool", async function () {
      const { distributor, addr1, addr2 } = await loadFixture(
        deployDistributorFixture
      );

      const invitationCode = "secret123";
      const invitationCodeHash = keccak256(
        `0x${Buffer.from(invitationCode, "utf8").toString("hex")}`
      );

      await distributor.write.createPool([
        "Invitation Pool",
        "Description",
        "https://example.com/image.png",
        [invitationCodeHash],
        [5000n],
      ]);

      // Deactivate pool
      await distributor.write.deactivatePool([1n]);

      await expect(
        distributor.write.joinPool([1n, invitationCode], {
          account: addr2.account,
        })
      ).to.be.rejectedWith("PoolInactive");
    });
  });
});
