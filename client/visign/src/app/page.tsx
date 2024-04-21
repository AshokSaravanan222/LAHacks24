"use client"
import Image from "next/image";
import CameraFeed from "../components/CameraFeed";
import React from "react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
      <div>
          <Navbar />
          <div className="flex ml-2">
              <div className="flex flex-col flex-grow text-cyan-50 m-4 space-y-4 font-bold items-end justify-center">
                  <div className="flex text-end text-6xl">
                      A frictionless experience for ASL users.
                  </div>
                  <div className="flex text-end text-2xl">
                        <p className="text-end text-lg text-cyan-300">
                            Transcribe sign language to text in real-time.
                        </p>
                  </div>
              </div>
              <div className="flex flex-grow flex-col p-4 ml-4 pb-12 items-center bg-gray-900">
                  <CameraFeed />
              </div>
          </div>

      </div>
  );
}
