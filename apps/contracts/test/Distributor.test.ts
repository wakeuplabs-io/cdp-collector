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
      "src/mocks/USDC.sol:USDC",
      []
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
      "src/mocks/USDC.sol:USDC",
      []
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
      "src/mocks/USDC.sol:USDC",
      []
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

  describe("View Methods", function () {
    describe("getPool", function () {
      it("Should return correct pool data for existing pool", async function () {
        const { distributor, creator, singleMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const pool = await distributor.read.getPool([singleMemberPoolId]);
        
        expect(pool.id).to.equal(singleMemberPoolId);
        expect(pool.creator).to.equal(getAddress(creator.account.address));
        expect(pool.title).to.equal("Test Pool");
        expect(pool.description).to.equal("A test pool for fundraising");
        expect(pool.imageUri).to.equal("https://example.com/image.png");
        expect(pool.status).to.equal(1); // PoolStatus.ACTIVE
        expect(Number(pool.createdAt)).to.be.greaterThan(0);
      });

      it("Should return empty pool data for non-existent pool", async function () {
        const { distributor } = await loadFixture(deployDistributorFixture);

        const pool = await distributor.read.getPool([999n]);
        
        expect(pool.id).to.equal(0n);
        expect(pool.creator).to.equal("0x0000000000000000000000000000000000000000");
        expect(pool.title).to.equal("");
        expect(pool.description).to.equal("");
        expect(pool.imageUri).to.equal("");
        expect(pool.status).to.equal(0);
        expect(pool.createdAt).to.equal(0n);
      });

      it("Should return correct status for pending pool", async function () {
        const { distributor, creator } = await loadFixture(deployDistributorFixture);

        const invitationCodeHash = keccak256(toBytes("secret123"));
        await distributor.write.createPool([
          "Pending Pool",
          "Pool description",
          "https://example.com/image.png",
          [invitationCodeHash],
          [5000n],
        ], { account: creator.account });

        const pool = await distributor.read.getPool([1n]);
        expect(pool.status).to.equal(0); // PoolStatus.PENDING
      });

      it("Should return correct status for deactivated pool", async function () {
        const { distributor, creator, deactivatedPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const pool = await distributor.read.getPool([deactivatedPoolId]);
        expect(pool.status).to.equal(2); // PoolStatus.INACTIVE
      });
    });

    describe("getPoolSummary", function () {
      it("Should return empty summary for new pool", async function () {
        const { distributor, singleMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const summary = await distributor.read.getPoolSummary([singleMemberPoolId]);
        
        expect(summary.totalDonationsAmount).to.equal(0n);
        expect(summary.totalDonationsCount).to.equal(0n);
        expect(summary.uniqueDonatorsCount).to.equal(0n);
      });

      it("Should track donations correctly", async function () {
        const { distributor, mockUSDC, creator, addr2, addr3, singleMemberPoolId } =
          await loadFixture(deployDistributorFixtureWithPool);

        const donationAmount1 = parseUnits("100", 6);
        const donationAmount2 = parseUnits("200", 6);

        // First donation from addr2
        await mockUSDC.write.approve([distributor.address, donationAmount1], {
          account: addr2.account,
        });
        await distributor.write.donate([singleMemberPoolId, donationAmount1], {
          account: addr2.account,
        });

        // Second donation from addr3
        await mockUSDC.write.approve([distributor.address, donationAmount2], {
          account: addr3.account,
        });
        await distributor.write.donate([singleMemberPoolId, donationAmount2], {
          account: addr3.account,
        });

        // Third donation from addr2 (same donor)
        await mockUSDC.write.approve([distributor.address, donationAmount1], {
          account: addr2.account,
        });
        await distributor.write.donate([singleMemberPoolId, donationAmount1], {
          account: addr2.account,
        });

        const summary = await distributor.read.getPoolSummary([singleMemberPoolId]);
        
        expect(summary.totalDonationsAmount).to.equal(donationAmount1 + donationAmount2 + donationAmount1);
        expect(summary.totalDonationsCount).to.equal(3n);
        expect(summary.uniqueDonatorsCount).to.equal(2n); // addr2 and addr3
      });

      it("Should return empty summary for non-existent pool", async function () {
        const { distributor } = await loadFixture(deployDistributorFixture);

        const summary = await distributor.read.getPoolSummary([999n]);
        
        expect(summary.totalDonationsAmount).to.equal(0n);
        expect(summary.totalDonationsCount).to.equal(0n);
        expect(summary.uniqueDonatorsCount).to.equal(0n);
      });
    });

    describe("getPoolMembersCount", function () {
      it("Should return 1 for single member pool", async function () {
        const { distributor, singleMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const count = await distributor.read.getPoolMembersCount([singleMemberPoolId]);
        expect(count).to.equal(1n);
      });

      it("Should return correct count for multi-member pool", async function () {
        const { distributor, multiMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const count = await distributor.read.getPoolMembersCount([multiMemberPoolId]);
        expect(count).to.equal(2n); // Creator + 1 joined member
      });

      it("Should return correct count for pool with invitation slots", async function () {
        const { distributor, creator } = await loadFixture(deployDistributorFixture);

        const invitationCodeHash1 = keccak256(toBytes("secret1"));
        const invitationCodeHash2 = keccak256(toBytes("secret2"));
        
        await distributor.write.createPool([
          "Multi-slot Pool",
          "Pool with multiple invitation slots",
          "https://example.com/image.png",
          [invitationCodeHash1, invitationCodeHash2],
          [3000n, 2000n],
        ], { account: creator.account });

        const count = await distributor.read.getPoolMembersCount([1n]);
        expect(count).to.equal(3n); // Creator + 2 invitation slots
      });

      it("Should return 0 for non-existent pool", async function () {
        const { distributor } = await loadFixture(deployDistributorFixture);

        const count = await distributor.read.getPoolMembersCount([999n]);
        expect(count).to.equal(0n);
      });
    });

    describe("getPoolMembers", function () {
      it("Should return all members with default pagination", async function () {
        const { distributor, creator, singleMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const members = await distributor.read.getPoolMembers([singleMemberPoolId, 0n, 100n]);
        
        expect(members).to.have.lengthOf(1);
        expect(members[0].member).to.equal(getAddress(creator.account.address));
        expect(members[0].percentage).to.equal(10000n); // 100%
        expect(members[0].invitationCodeHash).to.equal(BYTES_32_ZERO);
      });

      it("Should handle pagination correctly", async function () {
        const { distributor, creator } = await loadFixture(deployDistributorFixture);

        const invitationCodeHash1 = keccak256(toBytes("secret1"));
        const invitationCodeHash2 = keccak256(toBytes("secret2"));
        const invitationCodeHash3 = keccak256(toBytes("secret3"));
        
        await distributor.write.createPool([
          "Large Pool",
          "Pool with multiple members",
          "https://example.com/image.png",
          [invitationCodeHash1, invitationCodeHash2, invitationCodeHash3],
          [2000n, 2000n, 2000n],
        ], { account: creator.account });

        // Test first page (offset=0, limit=2)
        const firstPage = await distributor.read.getPoolMembers([1n, 0n, 2n]);
        expect(firstPage).to.have.lengthOf(2);
        expect(firstPage[0].member).to.equal(getAddress(creator.account.address));
        expect(firstPage[1].member).to.equal("0x0000000000000000000000000000000000000000");

        // Test second page (offset=2, limit=2)
        const secondPage = await distributor.read.getPoolMembers([1n, 2n, 2n]);
        expect(secondPage).to.have.lengthOf(2);
        expect(secondPage[0].member).to.equal("0x0000000000000000000000000000000000000000");
        expect(secondPage[1].member).to.equal("0x0000000000000000000000000000000000000000");

        // Test beyond bounds
        const beyondBounds = await distributor.read.getPoolMembers([1n, 10n, 5n]);
        expect(beyondBounds).to.have.lengthOf(0);
      });

      it("Should show invitation code hashes for empty slots", async function () {
        const { distributor, creator } = await loadFixture(deployDistributorFixture);

        const invitationCodeHash = keccak256(toBytes("secret123"));
        
        await distributor.write.createPool([
          "Invitation Pool",
          "Pool with invitation slot",
          "https://example.com/image.png",
          [invitationCodeHash],
          [4000n],
        ], { account: creator.account });

        const members = await distributor.read.getPoolMembers([1n, 0n, 100n]);
        
        expect(members).to.have.lengthOf(2);
        // Creator
        expect(members[0].member).to.equal(getAddress(creator.account.address));
        expect(members[0].percentage).to.equal(6000n);
        expect(members[0].invitationCodeHash).to.equal(BYTES_32_ZERO);
        // Invitation slot
        expect(members[1].member).to.equal("0x0000000000000000000000000000000000000000");
        expect(members[1].percentage).to.equal(4000n);
        expect(members[1].invitationCodeHash).to.equal(invitationCodeHash);
      });

      it("Should revert for non-existent pool", async function () {
        const { distributor } = await loadFixture(deployDistributorFixture);

        await expect(
          distributor.read.getPoolMembers([999n, 0n, 100n])
        ).to.be.rejectedWith("PoolNotFound");
      });

      it("Should adjust limit when exceeding available members", async function () {
        const { distributor, singleMemberPoolId } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        // Request more members than exist
        const members = await distributor.read.getPoolMembers([singleMemberPoolId, 0n, 10n]);
        expect(members).to.have.lengthOf(1); // Only 1 member exists
      });
    });

    describe("getBalanceOf", function () {
      it("Should return 0 for member with no donations received", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const balance = await distributor.read.getBalanceOf([creator.account.address]);
        expect(balance).to.equal(0n);
      });

      it("Should return correct balance after donations", async function () {
        const { distributor, creator, singleMemberPoolId, donationAmount } =
          await loadFixture(deployDistributorFixtureWithDonations);

        const balance = await distributor.read.getBalanceOf([creator.account.address]);
        // Creator gets 100% from single member pool (1000) + 50% from multi member pool (500) = 1500
        expect(balance).to.equal(donationAmount + donationAmount / 2n);
      });

      it("Should return updated balance after withdrawal", async function () {
        const { distributor, creator, donationAmount } = await loadFixture(
          deployDistributorFixtureWithDonations
        );

        const withdrawAmount = parseUnits("500", 6);
        await distributor.write.withdraw([withdrawAmount, creator.account.address], {
          account: creator.account,
        });

        const balance = await distributor.read.getBalanceOf([creator.account.address]);
        // Initial balance: 1000 + 500 = 1500, after withdrawing 500 = 1000
        const expectedBalance = donationAmount + donationAmount / 2n - withdrawAmount;
        expect(balance).to.equal(expectedBalance);
      });

      it("Should track split donations correctly in multi-member pool", async function () {
        const { distributor, mockUSDC, creator, addr2 } = await loadFixture(
          deployDistributorFixture
        );

        const invitationCode = "secret123";
        const invitationCodeHash = keccak256(toBytes(invitationCode));
        
        // Create pool: creator 70%, invitation slot 30%
        await distributor.write.createPool([
          "Split Pool",
          "Pool for testing splits",
          "https://example.com/image.png",
          [invitationCodeHash],
          [3000n],
        ], { account: creator.account });

        // addr2 joins
        await distributor.write.joinPool([1n, invitationCode], {
          account: addr2.account,
        });

        // Donate 1000 USDC
        const donationAmount = parseUnits("1000", 6);
        await mockUSDC.write.approve([distributor.address, donationAmount], {
          account: creator.account,
        });
        await distributor.write.donate([1n, donationAmount], {
          account: creator.account,
        });

        // Check balances
        const creatorBalance = await distributor.read.getBalanceOf([creator.account.address]);
        const addr2Balance = await distributor.read.getBalanceOf([addr2.account.address]);
        
        expect(creatorBalance).to.equal(parseUnits("700", 6)); // 70%
        expect(addr2Balance).to.equal(parseUnits("300", 6)); // 30%
      });

      it("Should return 0 for non-member address", async function () {
        const { distributor, addr3 } = await loadFixture(
          deployDistributorFixtureWithDonations
        );

        const balance = await distributor.read.getBalanceOf([addr3.account.address]);
        expect(balance).to.equal(0n);
      });
    });

    describe("getUserSummary", function () {
      it("Should return empty summary for user with no pools", async function () {
        const { distributor, addr3 } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const summary = await distributor.read.getUserSummary([addr3.account.address]);
        
        expect(summary.totalDonationsAmount).to.equal(0n);
        expect(summary.totalDonationsCount).to.equal(0n);
        expect(summary.poolCount).to.equal(0n);
      });

      it("Should aggregate data from multiple pools", async function () {
        const { distributor, mockUSDC, creator } = await loadFixture(
          deployDistributorFixture
        );

        // Create first pool
        await distributor.write.createPool([
          "Pool 1",
          "First pool",
          "https://example.com/image1.png",
          [],
          [],
        ], { account: creator.account });

        // Create second pool
        await distributor.write.createPool([
          "Pool 2",
          "Second pool",
          "https://example.com/image2.png",
          [],
          [],
        ], { account: creator.account });

        // Donate to first pool
        const donation1 = parseUnits("500", 6);
        await mockUSDC.write.approve([distributor.address, donation1], {
          account: creator.account,
        });
        await distributor.write.donate([1n, donation1], {
          account: creator.account,
        });

        // Donate to second pool twice
        const donation2 = parseUnits("300", 6);
        const donation3 = parseUnits("200", 6);
        await mockUSDC.write.approve([distributor.address, donation2 + donation3], {
          account: creator.account,
        });
        await distributor.write.donate([2n, donation2], {
          account: creator.account,
        });
        await distributor.write.donate([2n, donation3], {
          account: creator.account,
        });

        const summary = await distributor.read.getUserSummary([creator.account.address]);
        
        expect(summary.totalDonationsAmount).to.equal(donation1 + donation2 + donation3);
        expect(summary.totalDonationsCount).to.equal(3n);
        expect(summary.poolCount).to.equal(2n);
      });

      it("Should include pools where user joined via invitation", async function () {
        const { distributor, mockUSDC, creator, addr2 } = await loadFixture(
          deployDistributorFixture
        );

        const invitationCode = "secret123";
        const invitationCodeHash = keccak256(toBytes(invitationCode));
        
        // Creator creates pool
        await distributor.write.createPool([
          "Invitation Pool",
          "Pool with invitation",
          "https://example.com/image.png",
          [invitationCodeHash],
          [5000n],
        ], { account: creator.account });

        // addr2 joins
        await distributor.write.joinPool([1n, invitationCode], {
          account: addr2.account,
        });

        // Someone donates
        const donationAmount = parseUnits("1000", 6);
        await mockUSDC.write.approve([distributor.address, donationAmount], {
          account: creator.account,
        });
        await distributor.write.donate([1n, donationAmount], {
          account: creator.account,
        });

        // Check addr2's summary (joined member)
        const addr2Summary = await distributor.read.getUserSummary([addr2.account.address]);
        expect(addr2Summary.totalDonationsAmount).to.equal(donationAmount);
        expect(addr2Summary.totalDonationsCount).to.equal(1n);
        expect(addr2Summary.poolCount).to.equal(1n);

        // Check creator's summary
        const creatorSummary = await distributor.read.getUserSummary([creator.account.address]);
        expect(creatorSummary.totalDonationsAmount).to.equal(donationAmount);
        expect(creatorSummary.totalDonationsCount).to.equal(1n);
        expect(creatorSummary.poolCount).to.equal(1n);
      });
    });

    describe("getUserPoolsCount", function () {
      it("Should return 0 for user with no pools", async function () {
        const { distributor, addr3 } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const count = await distributor.read.getUserPoolsCount([addr3.account.address]);
        expect(count).to.equal(0n);
      });

      it("Should return correct count for pool creator", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const count = await distributor.read.getUserPoolsCount([creator.account.address]);
        expect(count).to.equal(3n); // Created 3 pools in fixture
      });

      it("Should return correct count for joined member", async function () {
        const { distributor, addr2 } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const count = await distributor.read.getUserPoolsCount([addr2.account.address]);
        expect(count).to.equal(1n); // Joined 1 pool in fixture
      });

      it("Should increase count when user creates new pools", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const initialCount = await distributor.read.getUserPoolsCount([creator.account.address]);
        
        // Create another pool
        await distributor.write.createPool([
          "New Pool",
          "Another pool",
          "https://example.com/image.png",
          [],
          [],
        ], { account: creator.account });

        const newCount = await distributor.read.getUserPoolsCount([creator.account.address]);
        expect(newCount).to.equal(initialCount + 1n);
      });
    });

    describe("getUserPools", function () {
      it("Should return empty array for user with no pools", async function () {
        const { distributor, addr3 } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const pools = await distributor.read.getUserPools([addr3.account.address, 0n, 100n]);
        expect(pools).to.have.lengthOf(0);
      });

      it("Should return all pools for creator", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const pools = await distributor.read.getUserPools([creator.account.address, 0n, 100n]);
        expect(pools).to.have.lengthOf(3);
        
        // Verify pool data
        expect(pools[0].id).to.equal(1n);
        expect(pools[0].creator).to.equal(getAddress(creator.account.address));
        expect(pools[0].title).to.equal("Test Pool");
        
        expect(pools[1].id).to.equal(2n);
        expect(pools[2].id).to.equal(3n);
      });

      it("Should handle pagination correctly", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        // Test first page (limit 2)
        const firstPage = await distributor.read.getUserPools([creator.account.address, 0n, 2n]);
        expect(firstPage).to.have.lengthOf(2);
        expect(firstPage[0].id).to.equal(1n);
        expect(firstPage[1].id).to.equal(2n);

        // Test second page (offset 2, limit 2)
        const secondPage = await distributor.read.getUserPools([creator.account.address, 2n, 2n]);
        expect(secondPage).to.have.lengthOf(1);
        expect(secondPage[0].id).to.equal(3n);

        // Test beyond bounds
        const beyondBounds = await distributor.read.getUserPools([creator.account.address, 10n, 5n]);
        expect(beyondBounds).to.have.lengthOf(0);
      });

      it("Should return pools for joined member", async function () {
        const { distributor, addr2 } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        const pools = await distributor.read.getUserPools([addr2.account.address, 0n, 100n]);
        expect(pools).to.have.lengthOf(1);
        expect(pools[0].id).to.equal(2n); // The multiMemberPoolId
        expect(pools[0].title).to.equal("Test Pool");
      });

      it("Should adjust limit when exceeding available pools", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixtureWithPool
        );

        // Request more pools than exist
        const pools = await distributor.read.getUserPools([creator.account.address, 0n, 10n]);
        expect(pools).to.have.lengthOf(3); // Only 3 pools exist
      });

      it("Should return pools in creation order", async function () {
        const { distributor, creator } = await loadFixture(
          deployDistributorFixture
        );

        // Create pools in specific order
        await distributor.write.createPool([
          "First Pool",
          "Description 1",
          "https://example.com/image1.png",
          [],
          [],
        ], { account: creator.account });

        await distributor.write.createPool([
          "Second Pool",
          "Description 2",
          "https://example.com/image2.png",
          [],
          [],
        ], { account: creator.account });

        const pools = await distributor.read.getUserPools([creator.account.address, 0n, 100n]);
        expect(pools).to.have.lengthOf(2);
        expect(pools[0].title).to.equal("First Pool");
        expect(pools[1].title).to.equal("Second Pool");
      });
    });
  });
});
