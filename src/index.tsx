import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-mosip-mobileid-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const MosipMobileidSdk = NativeModules.MosipMobileidSdk
  ? NativeModules.MosipMobileidSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function faceAuth(
  capturedImage: string,
  vcImage: string
): Promise<boolean> {
  return MosipMobileidSdk.faceAuth(capturedImage, vcImage);
}
