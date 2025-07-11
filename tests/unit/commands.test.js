jest.mock('telegraf', () => require('../mocks/telegram.mock'));

const { setupCommands } = require('../../src/handlers/commands');
const { Telegraf, createMockContext } = require('../mocks/telegram.mock');
const { config } = require('../../src/config/config');

describe('Bot Commands', () => {
  let bot;

  beforeEach(() => {
    bot = new Telegraf('mock_token');
    setupCommands(bot);
  });

  describe('/start command', () => {
    test('should send welcome message', async () => {
      const ctx = await bot.simulateCommand('start');
      
      expect(ctx.reply).toHaveBeenCalled();
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('Welcome to Test NFT Project');
      expect(message).toContain('/verify');
      expect(message).toContain('/help');
    });

    test('should include project name from config', async () => {
      const ctx = await bot.simulateCommand('start');
      
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain(config.telegram.projectName);
    });
  });

  describe('/help command', () => {
    test('should show all available commands', async () => {
      const ctx = await bot.simulateCommand('help');
      
      expect(ctx.reply).toHaveBeenCalled();
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('/start');
      expect(message).toContain('/verify');
      expect(message).toContain('/status');
      expect(message).toContain('/update');
      expect(message).toContain('/help');
    });

    test('should explain verification process', async () => {
      const ctx = await bot.simulateCommand('help');
      
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('Keplr wallet');
      expect(message).toContain('signature');
      expect(message).toContain('NFT ownership');
    });
  });

  describe('/verify command', () => {
    test('should respond to verify request', async () => {
      const ctx = await bot.simulateCommand('verify');
      
      expect(ctx.reply).toHaveBeenCalled();
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('coming soon');
    });

    test('should handle user context', async () => {
      const customCtx = createMockContext('999888777', 'customuser');
      await bot.simulateCommand('verify', customCtx);
      
      expect(customCtx.reply).toHaveBeenCalled();
      expect(customCtx.from.id).toBe('999888777');
      expect(customCtx.from.username).toBe('customuser');
    });
  });

  describe('/status command', () => {
    test('should respond to status check', async () => {
      const ctx = await bot.simulateCommand('status');
      
      expect(ctx.reply).toHaveBeenCalled();
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('coming soon');
    });
  });

  describe('/update command', () => {
    test('should respond to update request', async () => {
      const ctx = await bot.simulateCommand('update');
      
      expect(ctx.reply).toHaveBeenCalled();
      const message = ctx.reply.mock.calls[0][0];
      expect(message).toContain('coming soon');
    });
  });

  describe('Invalid commands', () => {
    test('should not respond to invalid commands', async () => {
      const ctx = await bot.simulateCommand('invalid');
      
      expect(ctx.reply).not.toHaveBeenCalled();
    });
  });
});