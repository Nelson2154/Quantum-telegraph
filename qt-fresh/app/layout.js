export const metadata = {
  title: "Quantum Telegraph — Can You Send a Message Faster Than Light?",
  description: "An interactive 5-level game that teaches you why quantum entanglement can't be used for faster-than-light communication.",
  openGraph: {
    title: "Can You Send a Message Faster Than Light?",
    description: "5 levels. 2 entangled particles. 1 impossible mission. Try to break quantum physics.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
