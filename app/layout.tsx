import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'VASTHUSILPY Keralassery - Architectural Plans, 3D Designs & Client Vault',
  description: 'Official architectural project portal for VASTHUSILPY Keralassery. Secure client folder vaults, 3D design renders, blueprints, QR visiting card generator, multi-modal client discussions, and Google Cloud Data Vault sync.',
  openGraph: {
    title: 'VASTHUSILPY Keralassery - Architectural Plans, 3D Designs & Client Vault',
    description: 'Official architectural project portal for VASTHUSILPY Keralassery. Secure client folder vaults, 3D design renders, blueprints, QR visiting card generator, multi-modal client discussions, and Google Cloud Data Vault sync.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VASTHUSILPY Keralassery - Architectural Plans, 3D Designs & Client Vault',
    description: 'Official architectural project portal for VASTHUSILPY Keralassery. Secure client folder vaults, 3D design renders, blueprints, QR visiting card generator, multi-modal client discussions, and Google Cloud Data Vault sync.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
