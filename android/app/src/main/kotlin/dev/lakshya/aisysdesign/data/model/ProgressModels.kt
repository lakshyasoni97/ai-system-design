package dev.lakshya.aisysdesign.data.model

import kotlinx.serialization.Serializable

@Serializable
data class FlashcardSRSItem(
  val rating: String,
  val intervalDays: Int,
  val easeFactor: Double,
  val repetitions: Int,
  val dueAt: String,
  val lastReviewedAt: String,
)

@Serializable
data class QuizAttempt(
  val selectedOptionId: String,
  val isCorrect: Boolean,
  val answeredAt: String,
)

@Serializable
data class TextHighlight(
  val id: String,
  val sourceType: String,
  val sourceId: String,
  val sourceTitle: String,
  val href: String,
  val sectionId: String,
  val sectionTitle: String,
  val text: String,
  val prefix: String? = null,
  val suffix: String? = null,
  val color: String = "amber",
  val note: String? = null,
  val createdAt: String,
  val updatedAt: String? = null,
)

@Serializable
data class SyncedStudyState(
  val version: Int = 2,
  val completedSessions: List<String> = emptyList(),
  val completedItems: List<String> = emptyList(),
  val flashcardRatings: Map<String, String> = emptyMap(),
  val flashcardSRS: Map<String, FlashcardSRSItem> = emptyMap(),
  val quizResults: Map<String, QuizAttempt> = emptyMap(),
  val scratchpadNotes: Map<String, String> = emptyMap(),
  val highlights: List<TextHighlight> = emptyList(),
  val deletedHighlightIds: List<String> = emptyList(),
  val lastModifiedAt: String = "1970-01-01T00:00:00.000Z",
  val sourceDevice: String = "android",
)

@Serializable
data class GitHubUserInfo(
  val login: String,
  val name: String? = null,
  val avatar_url: String = "",
  val html_url: String = "",
)

data class SyncUiState(
  val isConfigured: Boolean = false,
  val isSyncing: Boolean = false,
  val lastSyncedAt: String? = null,
  val syncError: String? = null,
  val gistUrl: String? = null,
  val githubUser: GitHubUserInfo? = null,
)
