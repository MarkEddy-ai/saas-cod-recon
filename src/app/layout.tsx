import './globals.css';

export const metadata = {
  title: 'Console COD Enterprise - Réconciliation & Anti-RTO',
  description: 'Plateforme enterprise de réconciliation financière COD',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}