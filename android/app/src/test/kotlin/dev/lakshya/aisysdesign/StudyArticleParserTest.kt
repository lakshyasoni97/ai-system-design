package dev.lakshya.aisysdesign

import dev.lakshya.aisysdesign.data.SectionBlock
import dev.lakshya.aisysdesign.data.StudyArticleParser
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class StudyArticleParserTest {

  private fun readContentFile(relPath: String): String {
    val candidates = listOf(
      File("src/main/assets/content/$relPath"),
      File("app/src/main/assets/content/$relPath"),
      File("../src/content/$relPath"),
      File("../../src/content/$relPath"),
    )
    val file = candidates.firstOrNull { it.exists() }
      ?: error("Could not locate $relPath from ${File(".").absolutePath}")
    return file.readText()
  }

  @Test
  fun parsesFundamentalsIntoTabsAndMicroBlocks() {
    (1..8).forEach { idx ->
      val name = "fundamentals/fund-0$idx.md"
      val article = StudyArticleParser.parseStudyArticle(readContentFile(name))
      assertTrue("Expected sections in $name", article.sections.isNotEmpty())
      assertTrue("Expected multiple study tabs in $name", article.availableTabs.size >= 2)
      val allBlocks = article.sections.flatMap { StudyArticleParser.parseSectionBlocks(it) }
      assertTrue("Expected parsed blocks in $name", allBlocks.isNotEmpty())
    }

    val fund01 = StudyArticleParser.parseStudyArticle(readContentFile("fundamentals/fund-01.md"))
    val blocks01 = fund01.sections.flatMap { StudyArticleParser.parseSectionBlocks(it) }
    assertTrue(blocks01.any { it is SectionBlock.SocraticLadder || it is SectionBlock.ExplainInLayers || it is SectionBlock.InterviewQaGroup })
  }

  @Test
  fun stripsMarkdownForCleanTtsSpeech() {
    val raw = """
      ## Pattern 1: Single-Leader
      Use `WAIT 1 50` and [Read more](https://example.com).
      ```mermaid
      flowchart TD
        A --> B
      ```
    """.trimIndent()

    val spoken = StudyArticleParser.stripMarkdownForSpeech(raw)
    assertFalse(spoken.contains("```"))
    assertFalse(spoken.contains("https://"))
    assertTrue(spoken.contains("Pattern 1: Single-Leader"))
    assertTrue(spoken.contains("Read more"))
  }
}
