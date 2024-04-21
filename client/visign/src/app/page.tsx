"use client"
import Image from "next/image";
import CameraFeed from "../components/CameraFeed";
import React from "react";
import Navbar from "@/components/Navbar";
import VideoUpload from "@/components/VideoUpload";

export default function Home() {
  return (
      <div>
          <Navbar />
          <div className="flex flex-col items-center p-4">
              <CameraFeed />
              <VideoUpload />
          </div>
      </div>
  );
}
