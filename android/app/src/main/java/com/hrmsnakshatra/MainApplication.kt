package com.hrmsnakshatra

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(PipPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createNotificationChannels()
  }

  /**
   * Creates the notification channel required by react-native-background-actions
   * for Android 8+ (API 26+). Without this channel the foreground service
   * notification is silently dropped in release builds, which prevents the
   * background service from starting correctly.
   *
   * The channel ID "rn_background_actions" must match the one used internally
   * by the react-native-background-actions library.
   */
  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        "rn_background_actions",
        "Location Tracking",
        NotificationManager.IMPORTANCE_LOW  // LOW = no sound, no popup — suitable for ongoing tracking
      ).apply {
        description = "Shows while your location is being tracked for attendance."
        setShowBadge(false)
      }

      val manager = getSystemService(NotificationManager::class.java)
      manager?.createNotificationChannel(channel)
    }
  }
}
