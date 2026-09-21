import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // TypeScript strict
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // ads.txt statique
      {
        source: '/ads.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]
  },

  // Redirections
  async redirects() {
    return []
  },

  // Images : domaines autorisés
  images: {
    domains: [],
  },

  // Variables d'environnement exposées côté client (préfixées NEXT_PUBLIC_)
  // Elles sont déjà disponibles automatiquement via process.env.NEXT_PUBLIC_*

  // Compression
  compress: true,

  // Désactiver X-Powered-By
  poweredByHeader: false,

  // Activer le strict mode React
  reactStrictMode: true,

  // Expérimental : optimisations
  experimental: {
    // Optimisation des imports de packages volumineux
    optimizePackageImports: ['lucide-react'],
  },

  // Durées de cache par défaut (overridées per-page via generateStaticParams et revalidate)
  // Les valeurs sont dans .env pour être configurables
}

export default nextConfig
