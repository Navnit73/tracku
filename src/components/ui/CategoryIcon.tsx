import React from "react";
import {
  Tag,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Film,
  Banknote,
  Laptop,
  TrendingUp,
  PieChart,
  Coins,
  Bitcoin,
  ShieldCheck,
  Briefcase,
  HeartPulse,
  CreditCard,
  Wallet,
} from "lucide-react";

export function CategoryIcon({ iconName, className = "w-5 h-5" }: { iconName?: string; className?: string }) {
  switch (iconName) {
    case "Utensils":
      return <Utensils className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Home":
      return <Home className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Film":
      return <Film className={className} />;
    case "Banknote":
      return <Banknote className={className} />;
    case "Laptop":
      return <Laptop className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "PieChart":
      return <PieChart className={className} />;
    case "Coins":
      return <Coins className={className} />;
    case "Bitcoin":
      return <Bitcoin className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "HeartPulse":
      return <HeartPulse className={className} />;
    case "CreditCard":
      return <CreditCard className={className} />;
    case "Wallet":
      return <Wallet className={className} />;
    case "Tag":
    default:
      return <Tag className={className} />;
  }
}
