"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CinemaRoomGridUpgraded from "@/components/admin/CinemaRoomGridUpgraded";
import BookingsRealtimeList from "@/components/admin/BookingsRealtimeList";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "bookings">("rooms");

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "GET",
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          router.push("/admin");
        }
      } catch (err) {
        // Not authenticated, redirect to login
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    // Clear session cookie by calling logout endpoint
    await fetch("/api/admin/verify", {
      method: "DELETE",
    });

    setIsAuthenticated(false);
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kelong Melamun - Bookings Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Cinema-Style Inventory & Real-time Booking Management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to CMS
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`${
                activeTab === "rooms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              🏠 Cinema Room Grid
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`${
                activeTab === "bookings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              📋 Bookings Management
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "rooms" && <CinemaRoomGridUpgraded />}
        {activeTab === "bookings" && <BookingsRealtimeList />}
      </div>
    </div>
  );
}
