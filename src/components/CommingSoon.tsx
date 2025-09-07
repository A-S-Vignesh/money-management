// pages/ComingSoonPage.js (or wherever your main component is)
"use client";

import { useState, useEffect } from "react";
import {
  Rocket,
  Wrench,
  CalendarClock,
  Mail,
  Sparkles,
  Hammer,
} from "lucide-react";

interface NewBubbleStylesType {
    width: string;
    height: string;
    top: string;
    left: string;
    transform: string;
}


const FIXED_LAUNCH_DATE = new Date("2025-10-15T12:00:00");
// FIXED_LAUNCH_DATE.setDate(FIXED_LAUNCH_DATE.getDate() + 30);

export default function ComingSoonPage() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [bubbleStyles, setBubbleStyles] = useState<NewBubbleStylesType[]>([]);


  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = FIXED_LAUNCH_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    const generateBubbles = () => {
      const newBubbleStyles = [];
      for (let i = 0; i < 20; i++) {
        newBubbleStyles.push({
          width: `${Math.floor(Math.random() * 100) + 50}px`,
          height: `${Math.floor(Math.random() * 100) + 50}px`,
          top: `${Math.floor(Math.random() * 100)}%`,
          left: `${Math.floor(Math.random() * 100)}%`,
          transform: `translate(-50%, -50%)`,
        });
      }
      setBubbleStyles(newBubbleStyles);
    };

    generateBubbles();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden z-0">
        {bubbleStyles.map((style, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-5 bg-gradient-to-br from-indigo-500 to-purple-600"
            style={style}
          ></div>
        ))}
      </div>

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 py-2 px-5 rounded-full mb-8 font-medium">
            <Rocket className="w-4 h-4 mr-2" />
            <span>Coming Soon</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 tracking-tight">
            Something Amazing is Coming
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're crafting an exceptional experience for you. Our team is
            working diligently to bring innovative solutions that will transform
            your workflow.
          </p>
        </div>

        <div className="relative flex justify-center mb-16">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute w-full h-full flex items-center justify-center">
              <div className="bg-indigo-50 rounded-full w-48 h-48 flex items-center justify-center">
                <div className="bg-indigo-100 rounded-full w-32 h-32 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-md border">
              <Hammer className="w-6 h-6 text-indigo-500" />
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-md border">
              <Wrench className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-8 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 mr-2 text-indigo-500" />
            Launching In
          </h2>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Days", value: days },
              { label: "Hours", value: hours },
              { label: "Minutes", value: minutes },
              { label: "Seconds", value: seconds },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center"
              >
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {item.value.toString().padStart(2, "0")}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification form rendered dynamically */}
        {/* <DynamicEmailSubscriptionForm /> */}
      </div>
    </div>
  );
}
