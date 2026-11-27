package dev.lakshya.aisysdesign

import dev.lakshya.aisysdesign.ui.components.MarkdownBlock
import dev.lakshya.aisysdesign.ui.components.parseMarkdownBlocks
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class MarkdownParserTest {

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
  fun parsesRealFundamentalAndSessionMarkdown() {
    val fundBlocks = parseMarkdownBlocks(readContentFile("fundamentals/fund-01.md"))
    assertTrue(fundBlocks.any { it is MarkdownBlock.Heading })
    assertTrue(fundBlocks.any { it is MarkdownBlock.Blockquote })
    assertTrue(fundBlocks.any { it is MarkdownBlock.MermaidBlock })

    val sessionBlocks = parseMarkdownBlocks(readContentFile("sessions/session-01.md"))
    assertTrue(sessionBlocks.any { it is MarkdownBlock.Heading })
    assertTrue(sessionBlocks.any { it is MarkdownBlock.BulletList || it is MarkdownBlock.OrderedList })
  }
}
