"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub, FaListAlt, FaStore } from "react-icons/fa";
import Image from "next/image";
import tomori from "../../public/tomori.png";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="px-8 py-4 bg-black border-b border-gray-800 flex items-center justify-between min-h-[70px]">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={tomori}
            alt="anon"
            width={55}
            height={55}
            className="rounded"
          />
          <span className="text-white font-bold text-xl">Haruhikage</span>
        </Link>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/market"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 px-1 text-base font-medium"
          >
            <FaStore className="h-4 w-4" />
            <span>Market</span>
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 px-1 text-base font-medium"
          >
            <FaListAlt className="h-4 w-4" />
            <span>My Orders</span>
          </Link>
        </div>
      </div>

      {/* Right side - Network selector and Connect button */}
      <div className="flex items-center gap-5">
        <ConnectButton />
        <a
          href="https://github.com/ZMB000/SC4053-Project"
          target="_blank"
          className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors hidden md:block"
        >
          <FaGithub className="h-6 w-6 text-white" />
        </a>
      </div>
    </nav>
  );
}
