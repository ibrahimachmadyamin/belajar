import * as SecureStore from 'expo-secure-store';

const GEMINI_API_KEY_NAME = 'gemini_api_key';

export const saveApiKey = async (key: string) => {
  try {
    await SecureStore.setItemAsync(GEMINI_API_KEY_NAME, key);
  } catch (error) {
    console.error('Error saving API Key', error);
  }
};

export const getApiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(GEMINI_API_KEY_NAME);
  } catch (error) {
    console.error('Error getting API Key', error);
    return null;
  }
};

export const deleteApiKey = async () => {
  try {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY_NAME);
  } catch (error) {
    console.error('Error deleting API Key', error);
  }
};
