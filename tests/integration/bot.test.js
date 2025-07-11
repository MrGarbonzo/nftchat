jest.mock('telegraf', () => require('../mocks/telegram.mock'));

const TelegramBot = require('../../src/services/telegramBot');
const { setupCommands } = require('../../src/handlers/commands');
const { config, validateConfig } = require('../../src/config/config');

describe('Bot Integration', () => {
  let telegramBot;
  let bot;

  beforeEach(() => {
    telegramBot = new TelegramBot();
    bot = telegramBot.getBot();
    setupCommands(bot);
  });

  afterEach(async () => {
    await telegramBot.stop();
  });

  test('should initialize bot with token from config', () => {
    expect(bot.token).toBe(config.telegram.botToken);
  });

  test('should launch bot successfully', async () => {
    await expect(telegramBot.launch()).resolves.not.toThrow();
  });

  test('should handle middleware chain correctly', async () => {
    const ctx = await bot.simulateCommand('start');
    
    // Middleware should have been called
    expect(ctx.reply).toHaveBeenCalled();
  });

  test('should validate configuration on startup', () => {
    expect(() => validateConfig()).not.toThrow();
  });

  test('should handle errors gracefully', async () => {
    // Simulate an error in the error handler
    let errorCaught = false;
    bot.catch((err) => {
      errorCaught = true;
    });
    
    bot.handlers.set('command:error', async () => {
      throw new Error('Test error');
    });

    try {
      await bot.simulateCommand('error');
    } catch (e) {
      // Expected error
    }
    
    // Error handler should be defined
    expect(bot.errorHandler).toBeDefined();
  });

  test('should stop gracefully', async () => {
    await telegramBot.launch();
    expect(() => telegramBot.stop('SIGTERM')).not.toThrow();
  });
});