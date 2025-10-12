import crypto from 'crypto';

interface EmailLoginReturn {
  email: string
  message?: string
  error?: string
}

interface MagicLinkReturn {
  jwt: string
  user: {
    id: number
    email: string
  }
}

export default ({ strapi }) => ({
  async handleEmailLogin(email: string): Promise<EmailLoginReturn> {
    try {
      // todo: hash
      const token = crypto.randomBytes(32).toString('hex');
      const expiresInSeconds = 15 * 60;
      const key = `magiclink:${token}`;
      await strapi.redis.set(key, email, 'EX', expiresInSeconds);
      
      const frontUrl = process.env.FRONT_URL || 'http://localhost:5173';
      const link = `${frontUrl}/auth/email?token=${token}`;

      await strapi.plugin('email').service('email').send({
        to: email,
        subject: 'Login Link',
        html: `<p>Click <a href="${link}">here</a> to log in. This link expires in 15 minutes.</p>`,
      });

      return { email, message: 'Login link sent successfully' };
    } catch (err) {
      strapi.log.error('Error sending email:', err);
      return { email, error: 'Failed to send email' };
    }
  },
  async handleMagicLink(token: string, { consume = true } = {}): Promise<MagicLinkReturn> {
    const key = `magiclink:${token}`;
    const email = await strapi.redis.get(key);

    if (!email) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    if (consume) {
      await strapi.redis.del(key);
    }

    let user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email },
    });

    if (!user) {
      user = await strapi.db.query('plugin::users-permissions.user').create({
        data: {
          email,
          username: email,
          confirmed: true,
        },
      });
    }

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    return {
      jwt,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
});