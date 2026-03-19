import Constants from "expo-constants";

const getApiBaseUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const [host] = hostUri.split(":");
    return `http://${host}:3000/api`;
  }

  return "http://localhost:3000/api";
};

export const API_BASE_URL = getApiBaseUrl();
