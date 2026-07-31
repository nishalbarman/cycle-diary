import React from "react";
import { Text, Pressable, PressableProps } from "react-native";
import theme from "@/shared/theme";

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
  style,
  ...props
}: CustomButtonProps) {
  let buttonStyle: any = {};
  let textStyle: any = { color: "#ffffff" };

  if (bgVariant === "primary") {
    buttonStyle = { backgroundColor: theme.primary };
    textStyle = { color: "#ffffff" };
  } else if (bgVariant === "outline") {
    buttonStyle = { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.primary };
    textStyle = { color: theme.primary };
  } else if (bgVariant === "secondary") {
    buttonStyle = { backgroundColor: "#8b5cf6" };
    textStyle = { color: "#ffffff" };
  } else if (bgVariant === "danger") {
    buttonStyle = { backgroundColor: "#ef4444" };
    textStyle = { color: "#ffffff" };
  } else if (bgVariant === "purple") {
    buttonStyle = { backgroundColor: "#6366f1" };
    textStyle = { color: "#ffffff" };
  } else if (bgVariant === "greenery") {
    buttonStyle = { backgroundColor: "#10b981" };
    textStyle = { color: "#ffffff" };
  }

  return (
    <Pressable
      style={[buttonStyle, style, disabled && { opacity: 0.5 }]}
      className={`
        items-center justify-center
        ${sizeClasses[size]}
        ${className || ""}
      `}
      disabled={disabled}
      {...props}>
      <Text
        style={textStyle}
        className={`font-lexend-semibold ${textSizeClasses[size]}`}>
        {title}
      </Text>
    </Pressable>
  );
}
