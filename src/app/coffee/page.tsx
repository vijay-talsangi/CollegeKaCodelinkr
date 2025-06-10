import Link from 'next/link';

export default function CoffeePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Buy Me a Tea</h1>
        <p className="text-gray-300 mb-4">
          Scan the QR code below to support me. <br />
          It will be used to pay bills of server/database and further help me to improve this platform. <br />
          Thank you! ☕
        </p>
        <div className="bg-black p-4 rounded-lg">
          <img
            src="/qr-code.png" // Replace with the path to your QR code image
            alt="QR Code"
            className="w-60 h-60 mx-auto"
          />
        </div>
        <Link
          href="/"
          className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}