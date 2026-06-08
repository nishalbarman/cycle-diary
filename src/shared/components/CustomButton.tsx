import React from "react";
import { Text, Pressable, PressableProps, View } from "react-native";

interface CustomButtonProps extends PressableProps {
  title: string;
  bgVariant?:
    | "primary"
    | "secondary"
    | "outline"
    | "danger"
    | "purple"
    | "greenery";
  size?: "sm" | "md" | "lg";
}

const bgClasses: Record<string, string> = {
  primary: "bg-pink-500 active:bg-pink-600",
  secondary: "bg-purple-500 active:bg-purple-600",
  outline: "bg-transparent border border-pink-500 active:bg-pink-50",
  danger: "bg-red-500 active:bg-red-600",
  purple: "bg-indigo-500 active:bg-indigo-600",
  greenery: "bg-emerald-500 active:bg-emerald-600",
};

const textClasses: Record<string, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-pink-500",
  danger: "text-white",
  purple: "text-white",
  greenery: "text-white",
};

const sizeClasses: Record<string, string> = {
  sm: "px-4 py-2 rounded-lg",
  md: "px-6 py-3 rounded-xl",
  lg: "px-8 py-4 rounded-xl",
};

const textSizeClasses: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export default function CustomButton({
  title,
  bgVariant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: CustomButtonProps) {
  return (
    <Pressable
      className={`
        items-center justify-center
        ${bgClasses[bgVariant]}
        ${sizeClasses[size]}
        ${disabled ? "opacity-50" : ""}
        ${className || ""}
      `}
      disabled={disabled}
      {...props}>
      <Text
        className={`font-lexend-semibold ${textClasses[bgVariant]} ${textSizeClasses[size]}`}>
        {title}
      </Text>
    </Pressable>
  );
}
