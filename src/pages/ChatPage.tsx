import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Sprout,
  Calendar,
  Coins,
  BookOpen,
  Bot,
  Zap,
  MapPin
} from "lucide-react";
import { Header } from "../components/layout/Header";
import { ChatWindow } from "../components/chat/ChatWindow";
import { WeatherWidget } from "../components/dashboard/WeatherWidget";
import heroImage from "../assets/hero-farm.jpg";

interface ChatPageProps {
  readonly onBackToHome: () => void;
  readonly onDashboardClick: () => void;
  readonly userData?: any;
}

export function ChatPage({
  onBackToHome,
  onDashboardClick,
  userData
}: ChatPageProps) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser.");
      setIsLoadingWeather(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = { lat: latitude, lon: longitude };
        setLocation(currentLocation);

        const fetchWeatherData = async () => {
          const API_KEY = import.meta.env.VITE_WEATHERAPI_KEY;

          if (!API_KEY) {
            console.warn("Weather API Key is missing");
            setIsLoadingWeather(false);
            return;
          }

          const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=5&alerts=yes`;

          try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Could not fetch weather data.");
            const data = await response.json();
            setWeatherData(data);
          } catch (err: any) {
            setWeatherError(err.message);
          } finally {
            setIsLoadingWeather(false);
          }
        };

        fetchWeatherData();
      },
      () => {
        setWeatherError("Location access denied.");
        setIsLoadingWeather(false);
      }
    );
  }, []);

  const navItems = [
    { icon: Home, label: "Back to Home", action: onBackToHome, color: "text-blue-400" },
    { icon: Sprout, label: "My Crops", action: () => { }, color: "text-green-400" },
    { icon: Calendar, label: "Planting Calendar", action: () => { }, color: "text-amber-400" },
    { icon: Coins, label: "Market Prices", action: () => { }, color: "text-yellow-400" },
    { icon: BookOpen, label: "Farming Tips", action: () => { }, color: "text-purple-400" }
  ];

  return (
    <div className="h-screen overflow-hidden relative font-sans">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4) blur(2px)"
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-black/40 to-slate-900/40 z-10" />

      <div className="relative z-20 flex flex-col h-full">
        <Header
          onChatClick={() => { }}
          onDashboardClick={onDashboardClick}
          onWeatherClick={() => { }}
        />

        <main className="flex-1 container py-6 overflow-hidden">
          <div className="grid lg:grid-cols-4 gap-6 h-full">

            {/* LEFT SIDEBAR */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1 hidden lg:flex flex-col gap-4 h-full"
            >
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-6 text-white/80 px-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Quick Actions
                  </h2>
                </div>

                <div className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-white"
                      onClick={item.action}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-sm font-medium opacity-90">
                        {item.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-green-900/20 backdrop-blur-xl border border-green-500/20 rounded-2xl p-5 mt-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-green-200/60">Detected Location</p>
                    <p className="text-sm font-medium text-white">
                      {location
                        ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                        : "Locating..."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CHAT SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 flex flex-col h-full overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-t-2xl p-4 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      AI Farming Assistant
                    </h1>
                    <span className="text-xs text-green-400 font-medium">
                      ● Online
                    </span>
                  </div>
                </div>
              </div>

              {/* SCROLLABLE CHAT AREA */}
              <div className="flex-1 bg-black/20 backdrop-blur-sm border-x border-b border-white/10 rounded-b-2xl shadow-2xl overflow-hidden">
                <ChatWindow location={location} />
              </div>
            </motion.div>

            {/* RIGHT SIDEBAR */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-1 h-full"
            >
              <div className="sticky top-6">
                <WeatherWidget
                  weatherData={weatherData}
                  isLoading={isLoadingWeather}
                  error={weatherError}
                />
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}
