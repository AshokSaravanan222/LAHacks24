"use client"
import Image from "next/image";
import CameraFeed from "../components/CameraFeed";
import React from "react";

export default function Home() {
  return (
      <div>
        <h1>ASL Transcriber</h1>
        <CameraFeed />
      </div>
  );
}
