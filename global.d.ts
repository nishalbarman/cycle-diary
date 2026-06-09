declare module "*.png" {
  const value: import("react-native").ImageSourcePropType;
  return value;
}

declare module "*.wav" {
  const value: string;
  return value;
}

declare module "*.css" {
  const value: string;
  return value;
}