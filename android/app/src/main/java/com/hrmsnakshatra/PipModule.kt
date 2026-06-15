package com.hrmsnakshatra

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

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
