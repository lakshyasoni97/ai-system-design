package dev.lakshya.aisysdesign.data

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.Locale

data class TtsUiState(
  val isReady: Boolean = false,
  val isSpeaking: Boolean = false,
  val activeId: String? = null,
  val speechRate: Float = 1.0f,
)

class StudyTtsController(context: Context) {
  private val _uiState = MutableStateFlow(TtsUiState())
  val uiState: StateFlow<TtsUiState> = _uiState.asStateFlow()

  private var tts: TextToSpeech? = null
  private var lastText: String = ""
  private var lastId: String = ""

  init {
    tts = TextToSpeech(context.applicationContext) { status ->
      if (status == TextToSpeech.SUCCESS) {
        tts?.language = Locale.US
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
          override fun onStart(utteranceId: String?) {
            _uiState.update { it.copy(isSpeaking = true) }
          }

          override fun onDone(utteranceId: String?) {
            if (utteranceId == "end") {
              _uiState.update { it.copy(isSpeaking = false, activeId = null) }
            }
          }

          @Deprecated("Deprecated in Java")
          override fun onError(utteranceId: String?) {
            _uiState.update { it.copy(isSpeaking = false, activeId = null) }
          }
        })
        _uiState.update { it.copy(isReady = true) }
      }
    }
  }

  fun toggleSpeak(id: String, plainText: String) {
    val cur = _uiState.value
    if (cur.isSpeaking && cur.activeId == id) {
      stop()
    } else {
      speak(id, plainText)
    }
  }

  fun speak(id: String, plainText: String) {
    val engine = tts ?: return
    if (!_uiState.value.isReady || plainText.isBlank()) return

    lastId = id
    lastText = plainText
    engine.stop()
    engine.setSpeechRate(_uiState.value.speechRate)

    val chunks = splitChunks(plainText, maxLen = 2200)
    _uiState.update { it.copy(isSpeaking = true, activeId = id) }
    chunks.forEachIndexed { idx, chunk ->
      val mode = if (idx == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
      val uttId = if (idx == chunks.lastIndex) "end" else "chunk-$idx"
      engine.speak(chunk, mode, null, uttId)
    }
  }

  fun stop() {
    tts?.stop()
    _uiState.update { it.copy(isSpeaking = false, activeId = null) }
  }

  fun cycleSpeed() {
    val nextRate = when (_uiState.value.speechRate) {
      1.0f -> 1.25f
      1.25f -> 1.5f
      else -> 1.0f
    }
    _uiState.update { it.copy(speechRate = nextRate) }
    if (_uiState.value.isSpeaking && lastText.isNotBlank() && lastId.isNotBlank()) {
      speak(lastId, lastText)
    }
  }

  fun shutdown() {
    tts?.stop()
    tts?.shutdown()
    tts = null
  }

  private fun splitChunks(text: String, maxLen: Int): List<String> {
    if (text.length <= maxLen) return listOf(text)
    val result = mutableListOf<String>()
    var idx = 0
    while (idx < text.length) {
      val end = (idx + maxLen).coerceAtMost(text.length)
      var splitAt = end
      if (end < text.length) {
        val period = text.lastIndexOf(". ", end)
        if (period > idx + maxLen / 2) {
          splitAt = period + 1
        }
      }
      result += text.substring(idx, splitAt).trim()
      idx = splitAt
    }
    return result.filter { it.isNotEmpty() }
  }
}
