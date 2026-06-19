package com.hrmsnakshatra

import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Bundle
import android.os.Build
import android.util.Rational
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "HRMSNakshatra"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          if (PipModule.isPipAllowed) {
              val params = PictureInPictureParams.Builder()
                  .setAspectRatio(Rational(16, 9))
                  .build()
              enterPictureInPictureMode(params)
          }
      }
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
      PipModule.instance?.sendPipEvent(isInPictureInPictureMode)
  }
}
