import type { Metadata } from 'next';
import './globals.css';
import './responsive.css';
import type { Viewport } from 'next';
export const metadata: Metadata = {
  title: 'Гуманитарные исследования Центральной России',
  description: 'Научный рецензируемый журнал. ISSN 2541-9056',
}
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};
export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
         <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
            rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      </html>
  )
}