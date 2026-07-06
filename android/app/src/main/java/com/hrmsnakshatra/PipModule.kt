package com.hrmsnakshatra

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.content.Intent
import android.content.ComponentName
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.content.Context
import android.provider.Settings
import android.location.LocationManager
import com.facebook.react.bridge.Promise

class PipModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        instance = this
    }

    override fun getName(): String {
        return "PipModule"
    }

    @ReactMethod
    fun setPipAllowed(allowed: Boolean) {
        isPipAllowed = allowed
    }

    @ReactMethod
    fun openOnePlusAutoLaunchSettings() {
        val context = reactApplicationContext
        val intents = arrayOf(
            // OnePlus / Oppo / Realme
            Intent().setComponent(ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity")),
            Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")),
            Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")),
            Intent().setComponent(ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")),
            // Vivo / iQOO
            Intent().setComponent(ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity")),
            Intent().setComponent(ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.PurviewTabActivity")),
            Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager")),
            Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.safeguard.PurviewTabActivity")),
            Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"))
        )
        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return
            } catch (e: Exception) {
                // Try next one
            }
        }
        // Fallback: open main settings
        try {
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Do nothing
        }
    }

    @ReactMethod
    fun requestDisableBatteryOptimization() {
        val context = reactApplicationContext
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(context.packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    try {
                        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(intent)
                    } catch (e2: Exception) {
                        // Do nothing
                    }
                }
            }
        }
    }

    @ReactMethod
    fun isLocationEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            promise.resolve(isGpsEnabled || isNetworkEnabled)
        } catch (e: Exception) {
            promise.reject("ERR_LOCATION_ENABLED_CHECK", e.message, e)
        }
    }

    @ReactMethod
    fun openLocationSettings() {
        val context = reactApplicationContext
        try {
            val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e2: Exception) {
                // Do nothing
            }
        }
    }

    fun sendPipEvent(isPipMode: Boolean) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPipModeChanged", isPipMode)
        }
    }

    companion object {
        var isPipAllowed: Boolean = false
        var instance: PipModule? = null
    }
}
