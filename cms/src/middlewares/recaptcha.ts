import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import fs from 'fs';
import os from 'os';
import path from 'path';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const siteKey = process.env.RECAPTCHA_SITE_KEY;
const credsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
const isDev = process.env.NODE_ENV === 'development';

let client: RecaptchaEnterpriseServiceClient | null = null;

if (!isDev) {
  if (credsBase64) {
    try {
      const credsJson = Buffer.from(credsBase64, 'base64').toString('utf-8');
      const tmpBase = path.join(os.tmpdir(), 'recaptcha');
      if (!fs.existsSync(tmpBase)) {
        fs.mkdirSync(tmpBase, { recursive: true });
      }
      const tempFilePath = path.join(tmpBase, 'gcloud-creds.json');
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        fs.writeFileSync(tempFilePath, credsJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
        client = new RecaptchaEnterpriseServiceClient();
      } catch (err) {
        console.error('Failed to set up Google credentials:', err);
      }
    } catch (err) {
      console.error('Failed to parse Google credentials:', err);
    }
  } else {
    client = new RecaptchaEnterpriseServiceClient();
  }
}

const thresholds = {
  email_login: 0.5,
  default: 0.5,
};

module.exports = (config, { strapi }) => {
  return async (ctx: any, next: any) => {
    if (isDev || !client) {
      console.log('dev!')
      return next();
    }

    const { recaptcha_token, recaptcha_action } = ctx.request.body || {};
    if (!recaptcha_token || !recaptcha_action) {
      return ctx.throw(400, 'Missing reCAPTCHA token or action');
    }

    const ip = ctx.ip || ctx.request.ip;
    const tokenKey = `recaptcha:${recaptcha_token}`;
    const cooldownKey = `cooldown:email-login:${ip}`;

    const inCooldown = await strapi.redis.get(cooldownKey);
    if (inCooldown) {
      return ctx.throw(429, 'Too many requests – please wait a few minutes before trying again');
    }

    const cached = await strapi.redis.get(tokenKey);
    if (cached) {
      strapi.log.debug(`Token ${recaptcha_token} found in cache, skipping verification`);
      await strapi.redis.set(cooldownKey, '1', 'EX', 120);
      return await next();
    }

    try {
      const parent = client.projectPath(projectId!);
      const request = {
        parent,
        assessment: {
          event: { token: recaptcha_token, siteKey, expectedAction: recaptcha_action },
        },
      };

      const [assessment] = await client.createAssessment(request);
      const { tokenProperties, riskAnalysis } = assessment;

      strapi.log.debug('reCAPTCHA tokenProperties:', tokenProperties);

      if (!tokenProperties?.valid) {
        return ctx.throw(403, `Invalid reCAPTCHA token: ${tokenProperties?.invalidReason || 'unknown'}`);
      }
      if (tokenProperties.action !== recaptcha_action) {
        return ctx.throw(403, 'Action mismatch');
      }

      const score = riskAnalysis?.score ?? 0;
      const threshold = thresholds[recaptcha_action] ?? thresholds.default;
      if (score < threshold) {
        return ctx.throw(403, `Low reCAPTCHA score: ${score}`);
      }

      await strapi.redis.set(tokenKey, '1', 'EX', 120);
      await strapi.redis.set(cooldownKey, '1', 'EX', 120);

      await next();
    } catch (err) {
      strapi.log.error('reCAPTCHA Enterprise verification error', err);
      return ctx.throw(500, 'reCAPTCHA verification failed');
    }
  };
};
