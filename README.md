# CDP Collector (Fairshare)

A decentralized fundraising platform built on Base that enables creators to set up fundraisers with automatic fund distribution to multiple beneficiaries. Built with the Coinbase Developer Platform (CDP) for seamless Web3 integration.

## 🌟 Features

- **Smart Distribution**: Automatically distribute funds to beneficiaries based on preset rules
- **Universal Donations**: Accept donations in any token or fiat, automatically settled in USDC
- **Transparent**: All donations are tracked on-chain for complete transparency
- **Invitation System**: Secure invitation codes for controlled access to fundraising pools
- **Real-time Tracking**: Live donation tracking and analytics
- **Multi-token Support**: Support for ETH, USDC, and other ERC-20 tokens
- **Fiat Onramp**: Integrated Coinbase onramp for easy fiat-to-crypto conversion

## 🏗️ Architecture

### Smart Contracts
- **Distributor.sol**: Core contract managing fundraising pools and automatic fund distribution
- **USDC Integration**: All donations are settled in USDC for consistency
- **Invitation System**: Secure hash-based invitation codes for pool access control

### Frontend (Next.js)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Coinbase Developer Platform** integration for wallet management
- **Real-time data** via subgraph indexing

### Data Layer
- **The Graph Protocol**: Subgraph indexing for efficient blockchain data querying
- **IPFS**: Decentralized storage for fundraiser metadata and images
- **Pinata**: IPFS pinning service for reliable content availability

## 📁 Project Structure

```
cdp-collector/
├── apps/
│   ├── contracts/          # Smart contracts (Hardhat)
│   │   ├── src/
│   │   │   ├── Distributor.sol
│   │   │   └── interfaces/
│   │   ├── test/
│   │   └── ignition/       # Deployment scripts
│   └── www/               # Next.js frontend
│       ├── src/
│       │   ├── app/       # App router pages
│       │   ├── components/
│       │   ├── hooks/     # Custom React hooks
│       │   ├── lib/       # Utilities and services
│       │   └── types/     # TypeScript definitions
├── subgraphs/
│   ├── distributor-base/      # Base mainnet subgraph
│   └── distributor-base-sepolia/  # Base Sepolia testnet subgraph
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wakeuplabs-io/cdp-escrow.git
   cd cdp-collector
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` files in both `apps/www/` and `apps/contracts/`:

   **apps/www/.env.local:**
   ```env
   # Network Configuration
   NEXT_PUBLIC_NETWORK=base-sepolia
   NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
   NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.basescan.org
   
   # Contract Addresses
   NEXT_PUBLIC_DISTRIBUTOR_ADDRESS=0x...
   NEXT_PUBLIC_USDC_ADDRESS=0x295E9B95C563F1ed0F10eD8dB24f2f58f043d959
   
   # Coinbase Developer Platform
   NEXT_PUBLIC_CDP_PROJECT_ID=your_project_id
   NEXT_PUBLIC_CDP_CREATE_ACCOUNT_TYPE=evm-smart
   NEXT_PUBLIC_CDP_ONRAMP_BASE_URL=https://api.developer.coinbase.com
   NEXT_PUBLIC_CDP_BUNDLER_URL=your_bundler_url
   
   # IPFS (Pinata)
   NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
   NEXT_PUBLIC_PINATA_GATEWAY=your_pinata_gateway
   
   # Subgraph
   NEXT_PUBLIC_SUBGRAPH_URL=your_subgraph_url
   NEXT_PUBLIC_SUBGRAPH_API_KEY=your_api_key
   ```

   **apps/contracts/.env:**
   ```env
   # Network Configuration
   RPC_URL=https://sepolia.base.org
   PRIVATE_KEY=your_private_key
   
   # Etherscan API (for contract verification)
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

   This will start the Next.js frontend at `http://localhost:3000`

## 🔧 Development

### Smart Contracts

**Compile contracts:**
```bash
cd apps/contracts
pnpm compile
```

**Run tests:**
```bash
pnpm test
```

**Deploy to Base Sepolia:**
```bash
pnpm deploy:base-sepolia
```

**Deploy to Base Mainnet:**
```bash
pnpm deploy:base
```

### Frontend Development

**Start development server:**
```bash
cd apps/www
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Run linting:**
```bash
pnpm lint
```

### Subgraph Development

**Build subgraph:**
```bash
cd subgraphs/distributor-base-sepolia
pnpm build
```

**Deploy subgraph:**
```bash
pnpm deploy
```

## 🎯 How It Works

### 1. Creating a Fundraiser
- Users connect their wallet using Coinbase Developer Platform
- Create a new fundraiser with title, description, and image
- Set up invitation codes and percentage allocations for beneficiaries
- Fundraiser starts in "PENDING" status until all invited members join

### 2. Joining a Fundraiser
- Invited users receive invitation codes
- Users join the fundraiser by providing their invitation code
- Once all members join, the fundraiser becomes "ACTIVE"

### 3. Making Donations
- Donors can contribute using ETH, USDC, or other supported tokens
- All donations are automatically converted to USDC
- Funds are immediately distributed to all members based on their percentages
- All transactions are recorded on-chain for transparency

### 4. Fund Distribution
- The smart contract automatically splits donations according to preset percentages
- Funds are transferred directly to member wallets
- No manual intervention required - fully automated distribution

## 🔐 Security Features

- **Invitation System**: Secure hash-based invitation codes prevent unauthorized access
- **Percentage Validation**: Ensures total allocations don't exceed 100%
- **Access Control**: Only pool creators can deactivate their fundraisers
- **Immediate Distribution**: Funds are distributed immediately to prevent centralization
- **Transparent**: All operations are recorded on-chain

## 🌐 Supported Networks

- **Base Mainnet**: Production environment
- **Base Sepolia**: Testnet for development and testing

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Coinbase Developer Platform** - Wallet integration
- **SWR** - Data fetching and caching
- **React Hook Form** - Form management

### Smart Contracts
- **Solidity ^0.8.28** - Smart contract language
- **Hardhat** - Development framework
- **OpenZeppelin** - Security libraries
- **Viem** - Ethereum library

### Infrastructure
- **The Graph Protocol** - Blockchain indexing
- **IPFS** - Decentralized storage
- **Pinata** - IPFS pinning service
- **Base** - Layer 2 blockchain

## 📊 Smart Contract Details

### Distributor Contract

The core `Distributor` contract manages fundraising pools with the following key functions:

- `createPool()`: Creates a new fundraising pool with invitation codes and percentages
- `joinPool()`: Allows users to join pools using invitation codes
- `donate()`: Processes donations and automatically distributes funds
- `deactivatePool()`: Allows creators to deactivate their pools

### Key Features:
- **Automatic Distribution**: Funds are split and distributed immediately upon donation
- **Invitation System**: Secure access control using hash-based invitation codes
- **Percentage-based Allocation**: Flexible percentage distribution among members
- **USDC Settlement**: All donations are settled in USDC for consistency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Coinbase Developer Platform](https://developers.coinbase.com/)
- Powered by [Wakeup Labs](https://wakeuplabs.io/)
- Deployed on [Base](https://base.org/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Visit [Wakeup Labs](https://wakeuplabs.io/) for professional support
- Check the [Coinbase Developer Platform documentation](https://developers.coinbase.com/)

---

**Built with ❤️ for the Coinbase Developer Platform**