package com.omnisign.recognition

import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

/**
 * VisionCamera Frame Processor Plugin: runs MediaPipe HandLandmarker
 * on live camera frames and returns 21 landmarks as {x, y, z} coordinates.
 */
class HandLandmarksFrameProcessorPlugin(proxy: VisionCameraProxy) : FrameProcessorPlugin() {
    private var helper: HandLandmarkerHelper? = null
    private val context = proxy.context

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        try {
            val h = helper ?: HandLandmarkerHelper(context).also { helper = it }

            val bitmap = HandLandmarkerHelper.imageProxyToBitmap(frame.imageProxy)
            val mpImage = HandLandmarkerHelper.toMPImage(bitmap)
            val result = h.detect(mpImage)

            val hands = result.landmarks()
            if (hands.isEmpty()) return null

            return hands[0].map { landmark ->
                mapOf(
                    "x" to landmark.x().toDouble(),
                    "y" to landmark.y().toDouble(),
                    "z" to landmark.z().toDouble(),
                )
            }
        } catch (e: Throwable) {
            return null
        }
    }
}
