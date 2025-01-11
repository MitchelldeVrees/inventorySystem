const { withCloudflarePagesAdapter } = require('@cloudflare/next-on-pages/adapter');

module.exports = withCloudflarePagesAdapter({
  output: 'standalone',
});
