# NFT Gating Telegram Bot

A customizable Telegram bot for gating group access based on SNIP-721 NFT ownership on Secret Network.

## Features

- ✅ SNIP-721 NFT ownership verification
- ✅ Keplr wallet integration
- ✅ Automated Telegram group management
- ✅ Multi-project support via branches
- ✅ Environment-based configuration
- ✅ Rate limiting and security features
- ✅ Comprehensive audit logging

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/MrGarbonzo/nftchat.git
   cd nftchat
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your project details
   ```

3. **Run database migrations:**
   ```bash
   npm run migrate
   ```

4. **Start the bot:**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## Configuration

All configuration is handled through environment variables:

- `BOT_TOKEN` - Telegram bot token from BotFather
- `GROUP_ID` - Telegram group to manage
- `CONTRACT_ADDRESS` - SNIP-721 contract address
- `CONTRACT_CODE_HASH` - Contract code hash
- `PROJECT_NAME` - Your NFT project name

See `.env.example` for all options.

## Multi-Project Setup

This bot is designed to support multiple NFT projects:

1. Create a new branch for each project:
   ```bash
   git checkout -b project-panthers
   ```

2. Customize the `.env` file with project-specific details

3. Optionally customize messages in `src/handlers/commands.js`

4. Deploy each branch separately

## Development

- `npm run dev` - Start with auto-reload
- `npm test` - Run tests
- `npm run lint` - Check code style

## Documentation

Detailed documentation is available in the `refrences/` directory:

- Development roadmap
- Technical specifications
- Integration guides
- Code templates

## License

ISC