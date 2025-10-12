export default ({ env }) => {
  const isSecure = env.bool('SMTP_SECURE', false);

  return {
    'local-updates': {
      enabled: true,
      resolve: './src/plugins/local-updates'
    },
    'email': {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST', 'smtp.gmail.com'),
          port: isSecure ? 465 : 587,
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD')
          },
          secure: isSecure
        },
        settings: {
          defaultFrom: env('EMAIL_DEFAULT_FROM', 'no-reply@example.com'),
          defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@example.com')
        },
      },
    }
  }
};