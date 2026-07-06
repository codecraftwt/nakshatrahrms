package com.hrmsnakshatra

import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Bundle
import android.os.Build
import android.util.Rational
import android.util.Log
import android.content.pm.PackageManager
import android.content.Context
import android.os.PowerManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  @Volatile private var trackingPipEnabled: Boolean = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "HRMSNakshatra"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onUserLeaveHint() {
      super.onUserLeaveHint()

      // Screen off check: do not enter PiP if screen is off/not interactive
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      val isInteractive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
          powerManager.isInteractive
      } else {
          @Suppress("DEPRECATION")
          powerManager.isScreenOn
      }
      if (!isInteractive) {
          return
      }

      if (trackingPipEnabled) {
          enterTrackingPictureInPicture()
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
      Log.d(TAG, "PiP mode changed: $isInPictureInPictureMode")
      PipModule.instance?.sendPipEvent(isInPictureInPictureMode)
  }

  fun setTrackingPipEnabled(enabled: Boolean) {
      trackingPipEnabled = enabled
  }

  fun enterTrackingPictureInPicture(): Boolean {
      if (!isPipSupported() || isInPictureInPictureMode || !trackingPipEnabled) {
          return false
      }

      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      val isInteractive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
          powerManager.isInteractive
      } else {
          @Suppress("DEPRECATION")
          powerManager.isScreenOn
      }
      if (!isInteractive) {
          return false
      }

      return try {
          val params = PictureInPictureParams.Builder()
              .setAspectRatio(Rational(16, 9))
              .build()
          enterPictureInPictureMode(params)
      } catch (error: Exception) {
          Log.w(TAG, "Unable to enter PiP", error)
          false
      }
  }

  private fun isPipSupported(): Boolean {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
          return false
      }
      return packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
  }

  companion object {
      private const val TAG = "MainActivityPiP"
  }
}

