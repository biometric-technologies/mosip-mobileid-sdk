package com.mosipmobileidsdk

import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import net.iriscan.sdk.BiometricSdkConfigBuilder
import net.iriscan.sdk.BiometricSdkFactory
import net.iriscan.sdk.face.FaceEncodeProperties
import net.iriscan.sdk.face.FaceExtractProperties
import net.iriscan.sdk.face.FaceMatchProperties
import net.iriscan.sdk.face.FaceNetModelConfiguration
import java.io.ByteArrayInputStream

// Example method
// See https://reactnative.dev/docs/native-modules-android
class MosipMobileidSdkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // https://github.com/biometric-technologies/biometric-sdk-android-example/blob/master/app/src/main/java/net/iriscan/sdktest/MainActivity.kt
  @ReactMethod
  fun init() {
    BiometricSdkFactory.configure(
      BiometricSdkConfigBuilder(this.reactApplicationContext)
        .withFace(
          FaceExtractProperties(),
          FaceEncodeProperties(
            faceNetModel = FaceNetModelConfiguration(
              "https://github.com/biometric-technologies/biometric-sdk-android-example/blob/master/app/src/main/assets/facenet.tflite?raw=true",
              160,
              160,
              128
            )
          ),
          FaceMatchProperties(
            threshold = 10.0
          )
        )
        .build()
    )
  }


  @ReactMethod
  fun faceAuth(capturedImage: String, vcImage: String, promise: Promise) {
    val sdk = BiometricSdkFactory.getInstance()

    val capturedBitmap =
      BitmapFactory.decodeStream(ByteArrayInputStream(Base64.decode(capturedImage, Base64.DEFAULT)))
    val vcBitmap =
      BitmapFactory.decodeStream(ByteArrayInputStream(Base64.decode(vcImage, Base64.DEFAULT)))

    val capturedTemplate = sdk.face()
      .encoder()
      .extractAndEncode(sdk.io().convert(capturedBitmap))
    val vcTemplate = sdk.face()
      .encoder()
      .extractAndEncode(sdk.io().convert(vcBitmap))

    promise.resolve(sdk.face().matcher().matches(capturedTemplate, vcTemplate))
  }

  companion object {
    const val NAME = "MosipMobileidSdk"
  }
}
