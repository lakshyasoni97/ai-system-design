package dev.lakshya.aisysdesign.data

import android.content.Context
import dev.lakshya.aisysdesign.data.model.FlashcardSRSItem
import dev.lakshya.aisysdesign.data.model.GitHubUserInfo
import dev.lakshya.aisysdesign.data.model.QuizAttempt
import dev.lakshya.aisysdesign.data.model.SyncUiState
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.data.model.TextHighlight
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.io.File

class ProgressRepository(
  private val context: Context,
  private val gistClient: GistSyncClient = GistSyncClient(),
) {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val prefs = context.getSharedPreferences("sysdesign_sync_prefs_v1", Context.MODE_PRIVATE)
  private val stateFile = File(context.filesDir, "study_progress_v2.json")

  private val json = Json {
    ignoreUnknownKeys = true
    isLenient = true
    encodeDefaults = true
  }

  private var syncToken: String? = prefs.getString("token", null)
  private var syncGistId: String? = prefs.getString("gist_id", null)
  private var debounceJob: Job? = null

  private val _state = MutableStateFlow(loadInitialState())
  val state: StateFlow<SyncedStudyState> = _state.asStateFlow()

  private val _syncUi = MutableStateFlow(loadInitialSyncUiState())
  val syncUi: StateFlow<SyncUiState> = _syncUi.asStateFlow()

  init {
    if (!syncToken.isNullOrBlank() && !syncGistId.isNullOrBlank()) {
      scope.launch { syncNow() }
    }
  }

  private fun defaultSeedState(): SyncedStudyState {
    return SyncedStudyState(
      version = 2,
      completedSessions = listOf("session-01"),
      completedItems = listOf("session-01", "fund-01"),
      flashcardRatings = mapOf(
        "fc-001" to "easy",
        "fc-002" to "medium",
        "fc-006" to "easy",
      ),
      flashcardSRS = mapOf(
        "fc-001" to FlashcardSRSItem(
          rating = "easy",
          intervalDays = 7,
          easeFactor = 2.65,
          repetitions = 2,
          dueAt = "2026-11-08T12:00:00.000Z",
          lastReviewedAt = "2026-11-01T12:00:00.000Z",
        ),
        "fc-002" to FlashcardSRSItem(
          rating = "medium",
          intervalDays = 3,
          easeFactor = 2.5,
          repetitions = 2,
          dueAt = "2026-11-04T12:00:00.000Z",
          lastReviewedAt = "2026-11-01T12:00:00.000Z",
        ),
        "fc-006" to FlashcardSRSItem(
          rating = "easy",
          intervalDays = 7,
          easeFactor = 2.65,
          repetitions = 2,
          dueAt = "2026-11-08T12:00:00.000Z",
          lastReviewedAt = "2026-11-01T12:00:00.000Z",
        ),
      ),
      scratchpadNotes = mapOf(
        "session-01" to "Remember to emphasize KEDA scaling on in-flight requests/PubSub lag vs naive CPU HPA when defending Deloitte GKE setup.",
      ),
      lastModifiedAt = "2026-11-01T12:30:00.000Z",
      sourceDevice = "android",
    )
  }

  private fun loadInitialState(): SyncedStudyState {
    if (!stateFile.exists()) return defaultSeedState()
    return try {
      val raw = stateFile.readText()
      json.decodeFromString<SyncedStudyState>(raw)
    } catch (_: Exception) {
      defaultSeedState()
    }
  }

  private fun loadInitialSyncUiState(): SyncUiState {
    val token = prefs.getString("token", null)
    val gistId = prefs.getString("gist_id", null)
    val gistUrl = prefs.getString("gist_url", null)
    val lastSynced = prefs.getString("last_synced_at", null)
    val userJson = prefs.getString("user_json", null)
    val user = userJson?.let {
      runCatching { json.decodeFromString<GitHubUserInfo>(it) }.getOrNull()
    }
    return SyncUiState(
      isConfigured = !token.isNullOrBlank() && !gistId.isNullOrBlank(),
      lastSyncedAt = lastSynced,
      gistUrl = gistUrl,
      githubUser = user,
    )
  }

  private fun persistState(newState: SyncedStudyState) {
    try {
      stateFile.writeText(json.encodeToString(SyncedStudyState.serializer(), newState))
    } catch (_: Exception) {
    }
  }

  private fun getLocalDeletedHighlightIds(): List<String> {
    val raw = prefs.getString("deleted_hl_ids", null) ?: return emptyList()
    return runCatching { json.decodeFromString<List<String>>(raw) }.getOrDefault(emptyList())
  }

  private fun recordDeletedHighlightId(id: String) {
    val current = getLocalDeletedHighlightIds()
    if (id !in current) {
      val updated = (listOf(id) + current).take(300)
      prefs.edit().putString("deleted_hl_ids", json.encodeToString(updated)).apply()
    }
  }

  private fun mutateAndSchedulePush(transform: (SyncedStudyState) -> SyncedStudyState) {
    lateinit var updated: SyncedStudyState
    _state.update { current ->
      updated = transform(current).copy(
        lastModifiedAt = SrsEngine.toIsoString(System.currentTimeMillis()),
        sourceDevice = "android",
      )
      updated
    }
    persistState(updated)
    scheduleDebouncedPush()
  }

  private fun scheduleDebouncedPush() {
    val token = syncToken ?: return
    val gistId = syncGistId ?: return
    debounceJob?.cancel()
    debounceJob = scope.launch {
      delay(2200L)
      _syncUi.update { it.copy(isSyncing = true, syncError = null) }
      try {
        gistClient.pushToGist(token, gistId, _state.value)
        val nowIso = SrsEngine.toIsoString(System.currentTimeMillis())
        prefs.edit().putString("last_synced_at", nowIso).apply()
        _syncUi.update { it.copy(isSyncing = false, lastSyncedAt = nowIso) }
      } catch (e: Exception) {
        _syncUi.update { it.copy(isSyncing = false, syncError = e.message ?: "Sync push failed") }
      }
    }
  }

  fun isItemCompleted(itemId: String): Boolean {
    val rawId = itemId.removePrefix("problem:")
    val cur = _state.value
    return itemId in cur.completedItems ||
      rawId in cur.completedItems ||
      itemId in cur.completedSessions ||
      rawId in cur.completedSessions
  }

  fun toggleItemCompleted(itemId: String) {
    mutateAndSchedulePush { cur ->
      val rawId = itemId.removePrefix("problem:")
      val completed = itemId in cur.completedItems || rawId in cur.completedItems ||
        itemId in cur.completedSessions || rawId in cur.completedSessions
      val nextItems =
        if (completed) {
          cur.completedItems.filterNot { it == itemId || it == rawId }
        } else {
          (cur.completedItems + itemId).distinct()
        }
      val nextSessions =
        if (itemId.startsWith("session-")) {
          if (completed) cur.completedSessions.filterNot { it == itemId }
          else (cur.completedSessions + itemId).distinct()
        } else {
          cur.completedSessions
        }
      cur.copy(completedItems = nextItems, completedSessions = nextSessions)
    }
  }

  fun rateFlashcard(cardId: String, rating: String) {
    mutateAndSchedulePush { cur ->
      val prevSrs = cur.flashcardSRS[cardId]
      val nextSrs = SrsEngine.computeNextSrs(prevSrs, rating)
      cur.copy(
        flashcardRatings = cur.flashcardRatings + (cardId to rating),
        flashcardSRS = cur.flashcardSRS + (cardId to nextSrs),
      )
    }
  }

  fun recordQuizAnswer(questionId: String, selectedOptionId: String, isCorrect: Boolean) {
    val nowIso = SrsEngine.toIsoString(System.currentTimeMillis())
    mutateAndSchedulePush { cur ->
      cur.copy(
        quizResults = cur.quizResults + (
          questionId to QuizAttempt(
            selectedOptionId = selectedOptionId,
            isCorrect = isCorrect,
            answeredAt = nowIso,
          )
        )
      )
    }
  }

  fun resetQuizQuestions(questionIds: List<String>) {
    if (questionIds.isEmpty()) return
    val idSet = questionIds.toSet()
    mutateAndSchedulePush { cur ->
      cur.copy(quizResults = cur.quizResults.filterKeys { it !in idSet })
    }
  }

  fun updateScratchpad(key: String, note: String) {
    mutateAndSchedulePush { cur ->
      cur.copy(scratchpadNotes = cur.scratchpadNotes + (key to note))
    }
  }

  fun addHighlight(
    sourceType: String,
    sourceId: String,
    sourceTitle: String,
    sectionTitle: String,
    text: String,
    color: String,
    note: String?,
  ) {
    val nowIso = SrsEngine.toIsoString(System.currentTimeMillis())
    val href = if (sourceType == "fundamental") "/fundamentals/$sourceId" else "/roadmap/$sourceId"
    val item = TextHighlight(
      id = "hl-${System.currentTimeMillis()}-${(1000..9999).random()}",
      sourceType = sourceType,
      sourceId = sourceId,
      sourceTitle = sourceTitle,
      href = href,
      sectionId = "mobile-anchor",
      sectionTitle = sectionTitle,
      text = text.trim(),
      color = color,
      note = note?.trim()?.takeIf { it.isNotEmpty() },
      createdAt = nowIso,
      updatedAt = nowIso,
    )
    mutateAndSchedulePush { cur ->
      cur.copy(highlights = listOf(item) + cur.highlights)
    }
  }

  fun removeHighlight(id: String) {
    recordDeletedHighlightId(id)
    mutateAndSchedulePush { cur ->
      cur.copy(
        highlights = cur.highlights.filterNot { it.id == id },
        deletedHighlightIds = (listOf(id) + cur.deletedHighlightIds).distinct().take(300),
      )
    }
  }

  suspend fun connectSync(token: String): Boolean {
    _syncUi.update { it.copy(isSyncing = true, syncError = null) }
    return try {
      val cleanToken = token.trim()
      val user = gistClient.validateToken(cleanToken)
      val (gistId, gistUrl, remoteState) = gistClient.findOrCreateSyncGist(cleanToken, _state.value)

      prefs.edit()
        .putString("token", cleanToken)
        .putString("gist_id", gistId)
        .putString("gist_url", gistUrl)
        .putString("user_json", json.encodeToString(GitHubUserInfo.serializer(), user))
        .apply()

      syncToken = cleanToken
      syncGistId = gistId

      if (remoteState != null) {
        val merged = SrsEngine.mergeStudyStates(
          local = _state.value,
          remote = remoteState,
          localDeletedIds = getLocalDeletedHighlightIds(),
        )
        gistClient.pushToGist(cleanToken, gistId, merged)
        _state.value = merged
        persistState(merged)
      }

      val nowIso = SrsEngine.toIsoString(System.currentTimeMillis())
      prefs.edit().putString("last_synced_at", nowIso).apply()
      _syncUi.value = SyncUiState(
        isConfigured = true,
        isSyncing = false,
        lastSyncedAt = nowIso,
        syncError = null,
        gistUrl = gistUrl,
        githubUser = user,
      )
      true
    } catch (e: Exception) {
      _syncUi.update { it.copy(isSyncing = false, syncError = e.message ?: "Failed to connect") }
      false
    }
  }

  suspend fun syncNow() {
    val token = syncToken ?: return
    val gistId = syncGistId ?: return
    _syncUi.update { it.copy(isSyncing = true, syncError = null) }
    try {
      val (remoteState, gistUrl) = gistClient.fetchFromGist(token, gistId)
      val merged = SrsEngine.mergeStudyStates(
        local = _state.value,
        remote = remoteState,
        localDeletedIds = getLocalDeletedHighlightIds(),
      )
      gistClient.pushToGist(token, gistId, merged)
      _state.value = merged
      persistState(merged)
      val nowIso = SrsEngine.toIsoString(System.currentTimeMillis())
      prefs.edit()
        .putString("last_synced_at", nowIso)
        .putString("gist_url", gistUrl)
        .apply()
      _syncUi.update {
        it.copy(isSyncing = false, lastSyncedAt = nowIso, gistUrl = gistUrl, syncError = null)
      }
    } catch (e: Exception) {
      _syncUi.update { it.copy(isSyncing = false, syncError = e.message ?: "Sync failed") }
    }
  }

  fun disconnectSync() {
    debounceJob?.cancel()
    syncToken = null
    syncGistId = null
    prefs.edit()
      .remove("token")
      .remove("gist_id")
      .remove("gist_url")
      .remove("user_json")
      .remove("last_synced_at")
      .apply()
    _syncUi.value = SyncUiState()
  }

  fun exportProgressJson(): String {
    val exportJson = Json(json) { prettyPrint = true }
    return exportJson.encodeToString(SyncedStudyState.serializer(), _state.value)
  }

  fun importProgressJson(rawJson: String): Boolean {
    return try {
      val imported = json.decodeFromString<SyncedStudyState>(rawJson.trim())
      val merged = SrsEngine.mergeStudyStates(
        local = _state.value,
        remote = imported,
        localDeletedIds = getLocalDeletedHighlightIds(),
      )
      _state.value = merged
      persistState(merged)
      scheduleDebouncedPush()
      true
    } catch (_: Exception) {
      false
    }
  }
}
