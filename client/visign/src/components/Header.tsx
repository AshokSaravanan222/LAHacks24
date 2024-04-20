import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-green-500 text-white py-8">
      <nav className="container mx-auto flex justify-between items-center">
        <div>
          <Link href="/"className="mr-6 hover:text-green-200 transition-colors duration-300 animate-float"> Home</Link>
          <Link href="/about" className="hover:text-green-200 transition-colors duration-300 animate-float">
            About Us
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
