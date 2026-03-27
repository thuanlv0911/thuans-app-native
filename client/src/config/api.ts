import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_PORT = 3000;
const DEFAULT_LAN_HOST = "192.168.110.155";

const extractExpoHost = () => {
  const possibleHosts = [
    Constants.expoConfig?.hostUri,
    (Constants as typeof Constants & {
      manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      manifest?: { debuggerHost?: string };
    }).manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as typeof Constants & {
      manifest?: { debuggerHost?: string };
    }).manifest?.debuggerHost,
  ];

  for (const value of possibleHosts) {
    if (value) {
      return value.split(":")[0];
    }
  }

  return null;
};

const getApiBaseUrl = () => {
  const expoHost = extractExpoHost();

  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_PORT}/api`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEFAULT_PORT}/api`;
  }

  return `http://${DEFAULT_LAN_HOST}:${DEFAULT_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
