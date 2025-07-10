# External Documentation Links

*Essential documentation and resources for Panthers NFT bot development*

## Secret Network Documentation

### Core Documentation
- **Secret Network Developer Docs:** https://docs.scrt.network/
- **SNIP-721 Specification:** https://github.com/SecretFoundation/SNIPs/blob/master/SNIP-721.md
- **SNIP-722 Specification:** https://github.com/baedrik/snip-722-spec/blob/master/SNIP-722.md
- **SNIP-24 Permits:** https://github.com/SecretFoundation/SNIPs/blob/master/SNIP-24.md

### SecretJS Library
- **SecretJS GitHub:** https://github.com/scrtlabs/secret.js
- **SecretJS Documentation:** https://secretjs.scrt.network/
- **API Reference:** https://secretjs.scrt.network/classes/SecretNetworkClient.html

### Network Information
- **Secret Network Explorer:** https://secretnodes.com/
- **Testnet Faucet:** https://faucet.pulsar.scrttestnet.com/
- **RPC Endpoints:** https://docs.scrt.network/secret-network-documentation/development/resources-api-contract-addresses/connecting-to-the-network

---

## Keplr Wallet Integration

### Keplr Documentation
- **Keplr Developer Docs:** https://docs.keplr.app/
- **Keplr API Reference:** https://docs.keplr.app/api/
- **Message Signing Guide:** https://docs.keplr.app/api/cosmjs.html#sign-arbitrary

### Cosmos SDK Integration
- **CosmJS Library:** https://cosmos.github.io/cosmjs/
- **Signature Verification:** https://github.com/cosmos/cosmjs/tree/main/packages/crypto
- **Address Derivation:** https://github.com/cosmos/cosmjs/tree/main/packages/amino

---

## Telegram Bot Development

### Telegram Bot API
- **Official Bot API:** https://core.telegram.org/bots/api
- **BotFather Guide:** https://core.telegram.org/bots/tutorial
- **Group Management:** https://core.telegram.org/bots/api#managing-groups-and-channels

### Node.js Libraries
- **Telegraf Framework:** https://telegraf.js.org/
- **Node Telegram Bot API:** https://github.com/yagop/node-telegram-bot-api
- **Bot Examples:** https://github.com/telegraf/telegraf/tree/main/examples

---

## Development Tools & Libraries

### Node.js Packages
```json
{
  "secretjs": "https://www.npmjs.com/package/secretjs",
  "telegraf": "https://www.npmjs.com/package/telegraf", 
  "@keplr-wallet/cosmos": "https://www.npmjs.com/package/@keplr-wallet/cosmos",
  "@cosmjs/crypto": "https://www.npmjs.com/package/@cosmjs/crypto",
  "sqlite3": "https://www.npmjs.com/package/sqlite3",
  "pg": "https://www.npmjs.com/package/pg"
}
```

### Database Options
- **SQLite:** https://www.sqlite.org/docs.html
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Prisma ORM:** https://www.prisma.io/docs/

---

## Security & Best Practices

### Cryptography
- **Signature Verification:** https://github.com/cosmos/cosmjs/blob/main/packages/crypto/README.md
- **Key Derivation:** https://github.com/cosmos/cosmjs/blob/main/packages/crypto/src/secp256k1.ts
- **Bech32 Addresses:** https://github.com/bitcoinjs/bech32

### Node.js Security
- **Security Best Practices:** https://nodejs.org/en/docs/guides/security/
- **Environment Variables:** https://www.npmjs.com/package/dotenv
- **Rate Limiting:** https://www.npmjs.com/package/express-rate-limit

---

## Testing & Development

### Testing Frameworks
- **Jest:** https://jestjs.io/docs/getting-started
- **Mocha:** https://mochajs.org/
- **Supertest:** https://github.com/visionmedia/supertest

### Development Tools
- **Nodemon:** https://nodemon.io/
- **ESLint:** https://eslint.org/docs/user-guide/
- **Prettier:** https://prettier.io/docs/en/

---

## Deployment & Infrastructure

### Hosting Options
- **Railway:** https://railway.app/
- **Heroku:** https://devcenter.heroku.com/
- **DigitalOcean:** https://docs.digitalocean.com/products/app-platform/
- **AWS:** https://docs.aws.amazon.com/lambda/

### Process Management
- **PM2:** https://pm2.keymetrics.io/docs/
- **Docker:** https://docs.docker.com/
- **Systemd:** https://systemd.io/

---

## Community Resources

### Secret Network Community
- **Discord:** https://discord.com/invite/secret-network
- **Telegram:** https://t.me/SCRTCommunity
- **Forum:** https://forum.scrt.network/

### Developer Forums
- **Stack Overflow:** https://stackoverflow.com/questions/tagged/secret-network
- **Reddit:** https://www.reddit.com/r/SecretNetwork/
- **GitHub Discussions:** https://github.com/scrtlabs/SecretNetwork/discussions

---

## Useful Examples

### Code Repositories
- **Secret Toolkit:** https://github.com/scrtlabs/secret-toolkit
- **Secret Template:** https://github.com/scrtlabs/secret-template
- **SNIP-721 Examples:** https://github.com/baedrik/snip721-reference-impl

### Tutorial Projects
- **Secret Network Tutorials:** https://github.com/scrtlabs/secret-network-tutorials
- **Telegram Bot Examples:** https://github.com/telegraf/telegraf/tree/main/examples
- **Keplr Integration Examples:** https://github.com/chainapsis/keplr-wallet/tree/master/packages/extension/src/pages/sign

---

## API References Quick Links

### Most Used Endpoints
- **Secret LCD:** `https://lcd.secret.express`
- **Keplr Extension Detection:** `window.keplr`
- **Telegram Bot Token:** `https://t.me/BotFather`
- **Contract Query Format:** `/wasm/contract/{contract}/smart/{query}`

### Testing Networks
- **Secret Testnet:** `pulsar-3`
- **Testnet LCD:** `https://api.pulsar.scrttestnet.com`
- **Testnet Explorer:** https://testnet.secretnodes.com/
