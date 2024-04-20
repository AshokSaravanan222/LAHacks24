import Link from 'next/link';

const Navbar = () => {
  return (
      <nav className="bg-cyan-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-lg font-bold font-display hover:text-cyan-300">
            ViSign
          </Link>
          <div className="font-display">
            <Link href="/about" className="mx-2 hover:text-gray-300">About</Link>
            <Link href="/contact" className="mx-2 hover:text-gray-300">Contact</Link>
          </div>
        </div>
      </nav>
  );
};

export default Navbar;
