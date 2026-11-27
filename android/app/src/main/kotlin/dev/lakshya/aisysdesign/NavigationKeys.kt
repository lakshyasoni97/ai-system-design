package dev.lakshya.aisysdesign

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object TodayRoute : NavKey

@Serializable
data class RecallRoute(
  val initialMode: Int = 0,
  val sourceId: String? = null,
) : NavKey

@Serializable
data object LibraryRoute : NavKey

@Serializable
data class ReaderRoute(
  val itemType: String,
  val itemId: String,
) : NavKey

@Serializable
data class ProblemRoute(
  val problemId: String,
) : NavKey

@Serializable
data class ProjectRoute(
  val projectId: String,
) : NavKey
