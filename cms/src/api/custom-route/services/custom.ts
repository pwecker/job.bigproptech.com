export default ({ strapi }) => ({
  async handleEmailLogin(email: string) {
    return { email, message: 'Login link sent (stub)' };
  },
});