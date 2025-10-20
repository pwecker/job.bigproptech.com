import crypto from 'crypto';

interface EmailLoginReturn {
  email: string
  message?: string
  error?: string
  warn?: string
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
      const smtpUser = process.env.SMTP_USERNAME;
      const smtpPass = process.env.SMTP_PASSWORD;
      const smtpHost = process.env.SMTP_HOST;

      if (!smtpUser || !smtpPass || !smtpHost) {
        strapi.log.error('Email configuration missing required SMTP env variables');
        return { email, error: 'Email service misconfigured' };
      }

      // todo: get actual email failed send from plugin
      if (!(email.includes('@') && email.includes('.'))) {
        return { email, warn: 'Invalid email address' };
      }

      // todo: hash
      const token = crypto.randomBytes(32).toString('hex');
      const expiresInSeconds = 15 * 60;
      const key = `magiclink:${token}`;
      await strapi.redis.set(key, email, 'EX', expiresInSeconds);
      
      const frontUrl = process.env.FRONT_URL || 'http://localhost:5173';
      const link = `${frontUrl}/auth/email?token=${token}`;
      const emailPayload = {
        to: email,
        from: smtpUser,
        subject: 'Login Link',
        text: `Click ${link} to log in. This link expires in 15 minutes.`,
        html: `<p>Click <a href="${link}">here</a> to log in. This link expires in 15 minutes.</p>`,
      };

      try {
        await strapi.plugin('email').service('email').send(emailPayload);
      } catch (sendErr) {
        strapi.log.warn('Nodemailer send failed:', sendErr);
        return { email, warn: 'Failed to send login email' };
      }

      return { email, message: 'Login link sent successfully' };
    } catch (err) {
      strapi.log.error('Error in handleEmailLogin:', err);
      return { email, error: 'Unexpected error while handling email login' };
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