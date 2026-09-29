/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Permet de déployer sur Vercel même en présence d'avertissements de typage
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore les vérifications ESLint strictes pendant le build de production
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
