package com.mosipmobileidsdk

import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
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
import java.io.InputStream


class MosipMobileidSdkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun faceAuth(capturedImage: String, vcImage: String, promise: Promise) {
    BiometricSdkFactory.configure(
            BiometricSdkConfigBuilder(this.reactApplicationContext)
                .withFace(
                    FaceExtractProperties(),
                    FaceEncodeProperties(),
                    FaceMatchProperties()
                )
                .build()
        )
    val sdk = BiometricSdkFactory.getInstance()

    val decodedcapturedImage: ByteArray = Base64.decode(capturedImage, Base64.DEFAULT)
    val capturedInputStream: InputStream = ByteArrayInputStream(decodedcapturedImage)
    val capturedImageBmp = BitmapFactory.decodeStream(capturedInputStream)
     val capturedImageTemplate = sdk.face()
                .encoder()
                .extractAndEncode(sdk.io().convert(capturedImageBmp))


    val decodedvcImage: ByteArray = Base64.decode(vcImage, Base64.DEFAULT)
    val vcInputStream: InputStream = ByteArrayInputStream(decodedvcImage)
    val vcImageBmp = BitmapFactory.decodeStream(vcInputStream)
    val vcImageTemplate = sdk.face()
      .encoder()
      .extractAndEncode(sdk.io().convert(vcImageBmp))

    promise.resolve(sdk.face().matcher().matches(capturedImageTemplate, vcImageTemplate))
  }

  companion object {
    const val NAME = "MosipMobileidSdk"
  }
}
