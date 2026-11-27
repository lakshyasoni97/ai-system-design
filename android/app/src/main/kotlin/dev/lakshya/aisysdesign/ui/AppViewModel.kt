package dev.lakshya.aisysdesign.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import dev.lakshya.aisysdesign.data.PortalCatalog
import dev.lakshya.aisysdesign.data.PortalRepository
import dev.lakshya.aisysdesign.data.ProgressRepository
import dev.lakshya.aisysdesign.data.SrsEngine
import dev.lakshya.aisysdesign.data.StudyTtsController
import dev.lakshya.aisysdesign.data.ThemeMode
import dev.lakshya.aisysdesign.data.TtsUiState
import dev.lakshya.aisysdesign.data.UserPreferencesRepository
import dev.lakshya.aisysdesign.data.UserPrefs
import dev.lakshya.aisysdesign.data.model.RoadmapItem
import dev.lakshya.aisysdesign.data.model.SyncUiState
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.notifications.StudyReminderManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Locale

enum class RecommendationMode {
  ROADMAP,
  READY,
}

data class MockPhaseInfo(
  val label: String,
  val rangeMinutes: IntRange,
  val tip: String,
)

val MOCK_INTERVIEW_PHASES = listOf(
  MockPhaseInfo("1. Clarify & Scope", 0 until 5, "Nail functional/non-functional reqs, SLOs, and hard constraints."),
  MockPhaseInfo("2. Back-of-Envelope", 5 until 10, "QPS, peak multiplier, RAM/VRAM sizing, and token/cost budget."),
  MockPhaseInfo("3. High-Level Design", 10 until 25, "End-to-end boxes: ingestion, retrieval/routing, inference, state."),
  MockPhaseInfo("4. Deep Dive", 25 until 40, "Failure modes, tail latency, quantization, RBAC, evals & security."),
  MockPhaseInfo("5. Wrap-Up & Trade-offs", 40..45, "Summarize bottlenecks, cost levers, and resume bridge."),
)

data class MockTimerState(
  val totalSeconds: Int = 45 * 60,
  val remainingSeconds: Int = 45 * 60,
  val isRunning: Boolean = false,
) {
  val isActiveOrModified: Boolean
    get() = isRunning || remainingSeconds < totalSeconds

  val elapsedMinutes: Int
    get() = (totalSeconds - remainingSeconds) / 60

  val currentPhase: MockPhaseInfo
    get() = MOCK_INTERVIEW_PHASES.firstOrNull { elapsedMinutes in it.rangeMinutes }
      ?: MOCK_INTERVIEW_PHASES.last()

  val formattedTime: String
    get() = String.format(Locale.US, "%02d:%02d", remainingSeconds / 60, remainingSeconds % 60)
}

class AppViewModel(application: Application) : AndroidViewModel(application) {
  private val appContext = application.applicationContext
  private val portalRepo = PortalRepository(appContext)
  private val progressRepo = ProgressRepository(appContext)
  private val prefsRepo = UserPreferencesRepository(appContext)
  private val ttsController = StudyTtsController(appContext)

  val catalog: PortalCatalog = portalRepo.loadCatalog()
  val studyState: StateFlow<SyncedStudyState> = progressRepo.state
  val syncUi: StateFlow<SyncUiState> = progressRepo.syncUi
  val userPrefs: StateFlow<UserPrefs> = prefsRepo.userPrefs
  val ttsState: StateFlow<TtsUiState> = ttsController.uiState

  private val _mockTimer = MutableStateFlow(MockTimerState())
  val mockTimer: StateFlow<MockTimerState> = _mockTimer.asStateFlow()
  private var timerJob: Job? = null

  fun isCompleted(itemId: String, state: SyncedStudyState): Boolean {
    val rawId = itemId.removePrefix("problem:")
    return itemId in state.completedItems ||
      rawId in state.completedItems ||
      itemId in state.completedSessions ||
      rawId in state.completedSessions
  }

  fun getActiveNextItem(state: SyncedStudyState, mode: RecommendationMode): RoadmapItem {
    val items = catalog.sequenceItems
    val roadmapNext = items.firstOrNull { !isCompleted(it.id, state) } ?: items.first()
    return when (mode) {
      RecommendationMode.ROADMAP -> roadmapNext
      RecommendationMode.READY ->
        items.firstOrNull { !isCompleted(it.id, state) && it.status == "written" } ?: roadmapNext
    }
  }

  fun dueFlashcardsCount(state: SyncedStudyState): Int {
    val now = System.currentTimeMillis()
    return catalog.flashcards.count { card ->
      SrsEngine.isCardDue(state.flashcardSRS[card.id], now)
    }
  }

  fun computeStudyStreakDays(state: SyncedStudyState): Int {
    val zone = ZoneId.systemDefault()
    val dates = buildSet {
      state.flashcardSRS.values.forEach { srs ->
        val ms = SrsEngine.parseIsoMillis(srs.lastReviewedAt)
        if (ms > 0) add(Instant.ofEpochMilli(ms).atZone(zone).toLocalDate())
      }
      state.quizResults.values.forEach { q ->
        val ms = SrsEngine.parseIsoMillis(q.answeredAt)
        if (ms > 0) add(Instant.ofEpochMilli(ms).atZone(zone).toLocalDate())
      }
      state.highlights.forEach { h ->
        val ms = SrsEngine.parseIsoMillis(h.createdAt)
        if (ms > 0) add(Instant.ofEpochMilli(ms).atZone(zone).toLocalDate())
      }
    }
    if (dates.isEmpty()) return 0

    val today = LocalDate.now(zone)
    var cursor = if (today in dates) today else if (today.minusDays(1) in dates) today.minusDays(1) else return 0
    var streak = 0
    while (cursor in dates) {
      streak++
      cursor = cursor.minusDays(1)
    }
    return streak
  }

  fun toggleCompleted(itemId: String) = progressRepo.toggleItemCompleted(itemId)

  fun rateFlashcard(cardId: String, rating: String) = progressRepo.rateFlashcard(cardId, rating)

  fun recordQuizAnswer(questionId: String, selectedOptionId: String, isCorrect: Boolean) =
    progressRepo.recordQuizAnswer(questionId, selectedOptionId, isCorrect)

  fun resetQuizQuestions(questionIds: List<String>) =
    progressRepo.resetQuizQuestions(questionIds)

  fun updateScratchpad(key: String, note: String) = progressRepo.updateScratchpad(key, note)

  fun addHighlight(
    sourceType: String,
    sourceId: String,
    sourceTitle: String,
    sectionTitle: String,
    text: String,
    color: String,
    note: String?,
  ) = progressRepo.addHighlight(sourceType, sourceId, sourceTitle, sectionTitle, text, color, note)

  fun removeHighlight(id: String) = progressRepo.removeHighlight(id)

  fun loadMarkdown(itemType: String, itemId: String): String =
    portalRepo.loadMarkdown(itemType, itemId)

  // Sync & Backup
  fun connectSync(token: String) {
    viewModelScope.launch { progressRepo.connectSync(token) }
  }

  fun syncNow() {
    viewModelScope.launch { progressRepo.syncNow() }
  }

  fun disconnectSync() = progressRepo.disconnectSync()

  fun exportProgressJson(): String = progressRepo.exportProgressJson()

  fun importProgressJson(rawJson: String): Boolean = progressRepo.importProgressJson(rawJson)

  // Preferences & Notifications
  fun setThemeMode(mode: ThemeMode) = prefsRepo.setThemeMode(mode)

  fun setDynamicColor(enabled: Boolean) = prefsRepo.setDynamicColor(enabled)

  fun updateReminder(enabled: Boolean, hour: Int, minute: Int) {
    prefsRepo.setReminder(enabled, hour, minute)
    if (enabled) {
      StudyReminderManager.scheduleDailyReminder(appContext, hour, minute)
    } else {
      StudyReminderManager.cancelReminder(appContext)
    }
  }

  fun sendTestNotification() {
    StudyReminderManager.showDueNotification(appContext)
  }

  fun saveArticleScroll(articleId: String, firstVisibleIndex: Int) =
    prefsRepo.saveScrollPosition(articleId, firstVisibleIndex)

  fun getArticleScroll(articleId: String): Int = prefsRepo.getScrollPosition(articleId)

  // TTS Listen Mode
  fun toggleSpeak(id: String, plainText: String) = ttsController.toggleSpeak(id, plainText)

  fun stopSpeaking() = ttsController.stop()

  fun cycleTtsSpeed() = ttsController.cycleSpeed()

  // Persistent 45-min Mock Timer
  fun toggleMockTimer() {
    val cur = _mockTimer.value
    if (cur.isRunning) {
      timerJob?.cancel()
      _mockTimer.update { it.copy(isRunning = false) }
    } else {
      _mockTimer.update {
        val secs = if (it.remainingSeconds <= 0) it.totalSeconds else it.remainingSeconds
        it.copy(remainingSeconds = secs, isRunning = true)
      }
      timerJob?.cancel()
      timerJob = viewModelScope.launch {
        while (_mockTimer.value.isRunning && _mockTimer.value.remainingSeconds > 0) {
          delay(1000L)
          _mockTimer.update { state ->
            val next = (state.remainingSeconds - 1).coerceAtLeast(0)
            state.copy(remainingSeconds = next, isRunning = next > 0)
          }
        }
      }
    }
  }

  fun startMockTimerFresh() {
    timerJob?.cancel()
    _mockTimer.value = MockTimerState(remainingSeconds = 45 * 60, isRunning = true)
    timerJob = viewModelScope.launch {
      while (_mockTimer.value.isRunning && _mockTimer.value.remainingSeconds > 0) {
        delay(1000L)
        _mockTimer.update { state ->
          val next = (state.remainingSeconds - 1).coerceAtLeast(0)
          state.copy(remainingSeconds = next, isRunning = next > 0)
        }
      }
    }
  }

  fun resetMockTimer() {
    timerJob?.cancel()
    _mockTimer.value = MockTimerState()
  }

  override fun onCleared() {
    super.onCleared()
    timerJob?.cancel()
    ttsController.shutdown()
  }
}
