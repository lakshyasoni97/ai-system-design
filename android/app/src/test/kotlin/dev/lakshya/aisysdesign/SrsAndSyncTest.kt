package dev.lakshya.aisysdesign

import dev.lakshya.aisysdesign.data.SrsEngine
import dev.lakshya.aisysdesign.data.model.QuizAttempt
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.data.model.TextHighlight
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SrsAndSyncTest {

  @Test
  fun computeNextSrsFollowsExpectedIntervals() {
    val base = 1_700_000_000_000L

    val firstMedium = SrsEngine.computeNextSrs(null, "medium", base)
    assertEquals(1, firstMedium.intervalDays)
    assertEquals(1, firstMedium.repetitions)

    val secondMedium = SrsEngine.computeNextSrs(firstMedium, "medium", base)
    assertEquals(3, secondMedium.intervalDays)

    val hardReset = SrsEngine.computeNextSrs(secondMedium, "hard", base)
    assertEquals(0, hardReset.repetitions)
    assertEquals(0, hardReset.intervalDays)
    assertEquals(2.3, hardReset.easeFactor, 0.001)
    assertFalse(SrsEngine.isCardDue(hardReset, base + 5 * 60 * 1000L))
    assertTrue(SrsEngine.isCardDue(hardReset, base + 10 * 60 * 1000L))

    val firstEasy = SrsEngine.computeNextSrs(null, "easy", base)
    assertEquals(3, firstEasy.intervalDays)
    assertEquals(2.65, firstEasy.easeFactor, 0.001)
  }

  @Test
  fun mergeStudyStatesUnionsCompletedAndRespectsTombstones() {
    val local = SyncedStudyState(
      completedSessions = listOf("session-01"),
      completedItems = listOf("session-01", "fund-01"),
      quizResults = mapOf(
        "qz-1" to QuizAttempt("A", true, "2026-11-26T10:00:00Z")
      ),
      highlights = listOf(
        TextHighlight(
          id = "hl-keep",
          sourceType = "fundamental",
          sourceId = "fund-01",
          sourceTitle = "Topic 1",
          href = "/fundamentals/fund-01",
          sectionId = "s1",
          sectionTitle = "Sec",
          text = "R + W > N",
          createdAt = "2026-11-26T10:00:00Z",
        )
      ),
      lastModifiedAt = "2026-11-26T10:00:00Z",
    )

    val remote = SyncedStudyState(
      completedSessions = listOf("session-02"),
      completedItems = listOf("session-02", "fund-02"),
      quizResults = mapOf(
        "qz-1" to QuizAttempt("B", false, "2026-11-26T09:00:00Z")
      ),
      highlights = listOf(
        TextHighlight(
          id = "hl-deleted",
          sourceType = "session",
          sourceId = "session-01",
          sourceTitle = "S01",
          href = "/roadmap/session-01",
          sectionId = "s1",
          sectionTitle = "Sec",
          text = "Old note",
          createdAt = "2026-11-25T10:00:00Z",
        )
      ),
      lastModifiedAt = "2026-11-26T09:00:00Z",
    )

    val merged = SrsEngine.mergeStudyStates(
      local = local,
      remote = remote,
      localDeletedIds = listOf("hl-deleted"),
    )

    assertTrue("fund-01" in merged.completedItems)
    assertTrue("fund-02" in merged.completedItems)
    assertEquals("A", merged.quizResults["qz-1"]?.selectedOptionId)
    assertEquals(listOf("hl-keep"), merged.highlights.map { it.id })
  }
}
