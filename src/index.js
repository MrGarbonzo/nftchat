const TelegramBot = require('./services/telegramBot');
const { setupCommands } = require('./handlers/commands');
const { config, validateConfig } = require('./config/config');
const logger = require('./utils/logger');

async function main() {
  try {
    logger.info('Starting bot...');
    
    validateConfig();
    logger.info('Configuration validated');
    
    const telegramBot = new TelegramBot();
    const bot = telegramBot.getBot();
    
    setupCommands(bot);
    logger.info('Commands registered');
    
    await telegramBot.launch();
    
    process.once('SIGINT', () => telegramBot.stop('SIGINT'));
    process.once('SIGTERM', () => telegramBot.stop('SIGTERM'));
    
  } catch (error) {
    logger.error('Failed to start bot', { error });
    process.exit(1);
  }
}

main();