export default ({ env }) => {
  const isSecure = env.bool('SMTP_SECURE', false);

  return {
    'local-updates': {
      enabled: true,
      resolve: './src/plugins/local-updates'
    },
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST', 'smtp.gmail.com'),
          port: 465,
          secure: true,
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD'),
          },
          tls: { family: 4 }, // force IPv4
        },
        settings: {
          defaultFrom: env('EMAIL_DEFAULT_FROM', 'no-reply@example.com'),
          defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@example.com'),
        },
      },
    }
  }
};