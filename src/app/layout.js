import './globals.css';
import Providers from './providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: 'Encrypted CLI Chat',
  description: 'End-to-end encrypted chat with a retro CLI interface',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            theme="dark"
            toastStyle={{
              backgroundColor: "#000",
              color: "#22c55e",
              border: "1px solid #22c55e",
              fontFamily: "'VT323', monospace",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}