const { Telegraf } = require('telegraf');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class TelegramBot {
  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.setupMiddleware();
  }

  setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      logger.info('Response time', { ms, update: ctx.update });
    });

    this.bot.catch((err, ctx) => {
      logger.error('Bot error', { error: err, update: ctx.update });
      ctx.reply('An error occurred. Please try again later.');
    });
  }

  getBot() {
    return this.bot;
  }

  async launch() {
    try {
      await this.bot.launch();
      logger.info('Bot launched successfully');
    } catch (error) {
      logger.error('Failed to launch bot', { error });
      throw error;
    }
  }

  stop(signal) {
    this.bot.stop(signal);
  }
}

module.exports = TelegramBot;