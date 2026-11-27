package dev.lakshya.aisysdesign

import dev.lakshya.aisysdesign.data.PortalRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class PortalDataParsingTest {

  private fun readDataFile(name: String): String {
    val candidates = listOf(
      File("src/main/assets/data/$name"),
      File("app/src/main/assets/data/$name"),
      File("../src/data/$name"),
      File("../../src/data/$name"),
    )
    val file = candidates.firstOrNull { it.exists() }
      ?: error("Could not locate $name from ${File(".").absolutePath}")
    return file.readText()
  }

  @Test
  fun parsesAllPortalJsonFilesCleanly() {
    val catalog = PortalRepository.buildCatalog(
      curriculumJson = readDataFile("curriculum.json"),
      fundamentalsJson = readDataFile("fundamentals.json"),
      flashcardsJson = readDataFile("flashcards.json"),
      quizzesJson = readDataFile("quizzes.json"),
      problemsJson = readDataFile("problems.json"),
      projectsJson = readDataFile("projects.json"),
      rolesJson = readDataFile("roles.json"),
      resourcesJson = readDataFile("resources.json"),
    )

    assertEquals(8, catalog.fundamentals.topics.size)
    assertEquals(31, catalog.sessions.size)
    assertEquals(18, catalog.problems.size)
    assertEquals(4, catalog.projects.size)
    assertEquals(5, catalog.roles.roles.size)
    assertTrue(catalog.resources.foundationalBooks.isNotEmpty())
    assertTrue(catalog.resources.fundamentals.isNotEmpty())
    assertTrue(catalog.flashcards.isNotEmpty())
    assertTrue(catalog.quizzes.isNotEmpty())
    assertTrue(catalog.sequenceItems.size >= 40)
  }
}
