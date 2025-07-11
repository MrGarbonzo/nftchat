// Mock Telegraf implementation for testing
class MockContext {
  constructor(userId = '123456789', username = 'testuser') {
    this.from = {
      id: userId,
      username: username,
      first_name: 'Test',
      last_name: 'User'
    };
    this.chat = {
      id: userId,
      type: 'private'
    };
    this.update = {
      message: {
        text: '/start',
        from: this.from,
        chat: this.chat
      }
    };
    this.reply = jest.fn().mockResolvedValue({ message_id: 1 });
    this.replyWithMarkdown = jest.fn().mockResolvedValue({ message_id: 1 });
    this.telegram = {
      getChatMember: jest.fn().mockResolvedValue({
        status: 'member'
      }),
      banChatMember: jest.fn().mockResolvedValue(true),
      unbanChatMember: jest.fn().mockResolvedValue(true)
    };
  }
}

class MockTelegraf {
  constructor(token) {
    this.token = token;
    this.handlers = new Map();
    this.middleware = [];
  }

  command(command, handler) {
    this.handlers.set(`command:${command}`, handler);
  }

  on(event, handler) {
    this.handlers.set(`on:${event}`, handler);
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  catch(errorHandler) {
    this.errorHandler = errorHandler;
  }

  async launch() {
    return Promise.resolve();
  }

  stop() {
    return Promise.resolve();
  }

  // Helper method for testing - simulate command
  async simulateCommand(command, ctx = new MockContext()) {
    const handler = this.handlers.get(`command:${command}`);
    if (handler) {
      // Run middleware first
      for (const mw of this.middleware) {
        await mw(ctx, async () => {});
      }
      // Then run handler
      await handler(ctx);
    }
    return ctx;
  }
}

module.exports = {
  Telegraf: MockTelegraf,
  MockContext,
  createMockContext: (userId, username) => new MockContext(userId, username)
};