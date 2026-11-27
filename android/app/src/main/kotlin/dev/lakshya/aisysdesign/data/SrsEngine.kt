package dev.lakshya.aisysdesign.data

import dev.lakshya.aisysdesign.data.model.FlashcardSRSItem
import dev.lakshya.aisysdesign.data.model.QuizAttempt
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.data.model.TextHighlight
import java.time.Instant
import java.time.format.DateTimeFormatter
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Pure Spaced-Repetition & Last-Write-Wins Gist merge engine, matching the web portal's
 * ProgressProvider.tsx and gistSync.ts semantics 1-to-1.
 */
object SrsEngine {

  private const val TEN_MINUTES_MS = 10L * 60L * 1000L
  private const val ONE_DAY_MS = 24L * 60L * 60L * 1000L

  fun toIsoString(epochMs: Long): String {
    return DateTimeFormatter.ISO_INSTANT.format(Instant.ofEpochMilli(epochMs))
  }

  fun parseIsoMillis(iso: String?): Long {
    if (iso.isNullOrBlank()) return 0L
    return try {
      Instant.parse(iso).toEpochMilli()
    } catch (_: Exception) {
      0L
    }
  }

  fun computeNextSrs(
    prev: FlashcardSRSItem?,
    rating: String,
    nowMs: Long = System.currentTimeMillis(),
  ): FlashcardSRSItem {
    var repetitions = prev?.repetitions ?: 0
    var easeFactor = prev?.easeFactor ?: 2.5
    var intervalDays = prev?.intervalDays ?: 0
    var dueAtMs = nowMs

    when (rating) {
      "hard" -> {
        repetitions = 0
        intervalDays = 0
        easeFactor = max(1.3, easeFactor - 0.2)
        dueAtMs = nowMs + TEN_MINUTES_MS
      }
      "medium" -> {
        repetitions += 1
        intervalDays =
          when (repetitions) {
            1 -> 1
            2 -> 3
            else -> max(1, (intervalDays * easeFactor).roundToInt())
          }
        dueAtMs = nowMs + intervalDays * ONE_DAY_MS
      }
      "easy" -> {
        repetitions += 1
        easeFactor += 0.15
        intervalDays =
          when (repetitions) {
            1 -> 3
            2 -> 7
            else -> max(1, (intervalDays * easeFactor * 1.3).roundToInt())
          }
        dueAtMs = nowMs + intervalDays * ONE_DAY_MS
      }
    }

    val nowIso = toIsoString(nowMs)
    return FlashcardSRSItem(
      rating = rating,
      intervalDays = intervalDays,
      easeFactor = easeFactor,
      repetitions = repetitions,
      dueAt = toIsoString(dueAtMs),
      lastReviewedAt = nowIso,
    )
  }

  fun previewIntervalLabel(prev: FlashcardSRSItem?, rating: String): String {
    if (rating == "hard") return "10m"
    val next = computeNextSrs(prev, rating, 0L)
    return "${next.intervalDays}d"
  }

  fun isCardDue(srs: FlashcardSRSItem?, nowMs: Long = System.currentTimeMillis()): Boolean {
    if (srs == null) return true
    return parseIsoMillis(srs.dueAt) <= nowMs
  }

  fun mergeStudyStates(
    local: SyncedStudyState,
    remote: SyncedStudyState,
    localDeletedIds: List<String> = emptyList(),
    nowMs: Long = System.currentTimeMillis(),
  ): SyncedStudyState {
    val completedSessions =
      (local.completedSessions + remote.completedSessions).distinct()

    val localItems = local.completedItems.ifEmpty { local.completedSessions }
    val remoteItems = remote.completedItems.ifEmpty { remote.completedSessions }
    val completedItems = (localItems + remoteItems).distinct()

    val flashcardRatings = remote.flashcardRatings + local.flashcardRatings

    val flashcardSRS = remote.flashcardSRS.toMutableMap()
    for ((cardId, localSrs) in local.flashcardSRS) {
      val remoteSrs = flashcardSRS[cardId]
      if (remoteSrs == null) {
        flashcardSRS[cardId] = localSrs
      } else {
        val localTime = parseIsoMillis(localSrs.lastReviewedAt)
        val remoteTime = parseIsoMillis(remoteSrs.lastReviewedAt)
        flashcardSRS[cardId] = if (localTime >= remoteTime) localSrs else remoteSrs
      }
    }

    val quizResults = remote.quizResults.toMutableMap()
    for ((qId, localQuiz) in local.quizResults) {
      val remoteQuiz = quizResults[qId]
      if (remoteQuiz == null) {
        quizResults[qId] = localQuiz
      } else {
        val localTime = parseIsoMillis(localQuiz.answeredAt)
        val remoteTime = parseIsoMillis(remoteQuiz.answeredAt)
        quizResults[qId] = if (localTime >= remoteTime) localQuiz else remoteQuiz
      }
    }

    val localStateTime = parseIsoMillis(local.lastModifiedAt)
    val remoteStateTime = parseIsoMillis(remote.lastModifiedAt)
    val allNoteKeys = (local.scratchpadNotes.keys + remote.scratchpadNotes.keys).distinct()
    val scratchpadNotes = mutableMapOf<String, String>()
    for (k in allNoteKeys) {
      val localNote = local.scratchpadNotes[k].orEmpty()
      val remoteNote = remote.scratchpadNotes[k].orEmpty()
      when {
        localNote.isNotEmpty() && remoteNote.isEmpty() -> scratchpadNotes[k] = localNote
        localNote.isEmpty() && remoteNote.isNotEmpty() -> scratchpadNotes[k] = remoteNote
        localNote.isNotEmpty() && remoteNote.isNotEmpty() -> {
          scratchpadNotes[k] = if (localStateTime >= remoteStateTime) localNote else remoteNote
        }
      }
    }

    val allDeleted = (local.deletedHighlightIds + localDeletedIds + remote.deletedHighlightIds)
      .distinct()
      .take(300)
    val deletedSet = allDeleted.toSet()

    val highlightMap = linkedMapOf<String, TextHighlight>()
    for (hl in remote.highlights) {
      if (hl.id !in deletedSet) {
        highlightMap[hl.id] = hl
      }
    }
    for (hl in local.highlights) {
      if (hl.id in deletedSet) continue
      val existing = highlightMap[hl.id]
      if (existing == null) {
        highlightMap[hl.id] = hl
      } else {
        val localHlTime = parseIsoMillis(hl.updatedAt ?: hl.createdAt)
        val existingHlTime = parseIsoMillis(existing.updatedAt ?: existing.createdAt)
        if (localHlTime >= existingHlTime) {
          highlightMap[hl.id] = hl
        }
      }
    }

    val maxTime = maxOf(localStateTime, remoteStateTime, nowMs)

    return SyncedStudyState(
      version = 2,
      completedSessions = completedSessions,
      completedItems = completedItems,
      flashcardRatings = flashcardRatings,
      flashcardSRS = flashcardSRS,
      quizResults = quizResults,
      scratchpadNotes = scratchpadNotes,
      highlights = highlightMap.values.toList(),
      deletedHighlightIds = allDeleted,
      lastModifiedAt = toIsoString(maxTime),
      sourceDevice = "android",
    )
  }
}
