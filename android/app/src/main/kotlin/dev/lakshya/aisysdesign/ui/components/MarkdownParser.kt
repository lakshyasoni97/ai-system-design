package dev.lakshya.aisysdesign.ui.components

sealed interface MarkdownBlock {
  data class Heading(val level: Int, val text: String) : MarkdownBlock
  data class Paragraph(val text: String) : MarkdownBlock
  data class Blockquote(val lines: List<String>) : MarkdownBlock
  data class BulletList(val items: List<String>) : MarkdownBlock
  data class OrderedList(val items: List<String>) : MarkdownBlock
  data class CodeBlock(val language: String, val code: String) : MarkdownBlock
  data class MermaidBlock(val code: String) : MarkdownBlock
  data class Table(val headers: List<String>, val rows: List<List<String>>) : MarkdownBlock
  data object HorizontalRule : MarkdownBlock
}

private val orderedItemRegex = Regex("^\\s*\\d+\\.\\s+(.*)$")
private val bulletItemRegex = Regex("^\\s*[-*+]\\s+(.*)$")
private val tableSeparatorRegex = Regex("^\\s*\\|?[\\s:\\-|]+\\|?\\s*$")

fun parseMarkdownBlocks(markdown: String): List<MarkdownBlock> {
  val lines = markdown.replace("\r\n", "\n").split("\n")
  val blocks = mutableListOf<MarkdownBlock>()
  var i = 0

  while (i < lines.size) {
    val line = lines[i]
    val trimmed = line.trim()

    // Blank line
    if (trimmed.isEmpty()) {
      i++
      continue
    }

    // Horizontal rule
    if (trimmed == "---" || trimmed == "***" || trimmed == "___") {
      blocks += MarkdownBlock.HorizontalRule
      i++
      continue
    }

    // Fenced code / mermaid block
    if (trimmed.startsWith("```")) {
      val lang = trimmed.removePrefix("```").trim().lowercase()
      val codeLines = mutableListOf<String>()
      i++
      while (i < lines.size && !lines[i].trim().startsWith("```")) {
        codeLines += lines[i]
        i++
      }
      if (i < lines.size) i++ // consume closing ```
      val code = codeLines.joinToString("\n")
      if (lang == "mermaid") {
        blocks += MarkdownBlock.MermaidBlock(code)
      } else {
        blocks += MarkdownBlock.CodeBlock(lang, code)
      }
      continue
    }

    // Heading
    if (trimmed.startsWith("#")) {
      val hashes = trimmed.takeWhile { it == '#' }.length
      if (hashes in 1..6 && trimmed.length > hashes && trimmed[hashes] == ' ') {
        blocks += MarkdownBlock.Heading(hashes, trimmed.substring(hashes + 1).trim())
        i++
        continue
      }
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      val quoteLines = mutableListOf<String>()
      while (i < lines.size && lines[i].trim().startsWith(">")) {
        quoteLines += lines[i].trim().removePrefix(">").trimStart()
        i++
      }
      blocks += MarkdownBlock.Blockquote(quoteLines)
      continue
    }

    // Markdown table
    if (trimmed.startsWith("|") && i + 1 < lines.size && tableSeparatorRegex.matches(lines[i + 1])) {
      fun splitRow(row: String): List<String> =
        row.trim().trim('|').split("|").map { it.trim() }

      val headers = splitRow(trimmed)
      i += 2 // skip header + separator
      val rows = mutableListOf<List<String>>()
      while (i < lines.size && lines[i].trim().startsWith("|")) {
        rows += splitRow(lines[i])
        i++
      }
      blocks += MarkdownBlock.Table(headers, rows)
      continue
    }

    // Bullet list
    if (bulletItemRegex.matches(line)) {
      val items = mutableListOf<String>()
      while (i < lines.size && bulletItemRegex.matches(lines[i])) {
        val match = bulletItemRegex.find(lines[i])
        val itemText = StringBuilder(match?.groupValues?.get(1)?.trim().orEmpty())
        i++
        // Handle indented continuation lines
        while (i < lines.size && lines[i].startsWith("  ") && !bulletItemRegex.matches(lines[i]) && !orderedItemRegex.matches(lines[i])) {
          val cont = lines[i].trim()
          if (cont.isEmpty()) break
          itemText.append(" ").append(cont)
          i++
        }
        items += itemText.toString()
      }
      blocks += MarkdownBlock.BulletList(items)
      continue
    }

    // Ordered list
    if (orderedItemRegex.matches(line)) {
      val items = mutableListOf<String>()
      while (i < lines.size && orderedItemRegex.matches(lines[i])) {
        val match = orderedItemRegex.find(lines[i])
        val itemText = StringBuilder(match?.groupValues?.get(1)?.trim().orEmpty())
        i++
        while (i < lines.size && lines[i].startsWith("  ") && !orderedItemRegex.matches(lines[i]) && !bulletItemRegex.matches(lines[i])) {
          val cont = lines[i].trim()
          if (cont.isEmpty()) break
          itemText.append(" ").append(cont)
          i++
        }
        items += itemText.toString()
      }
      blocks += MarkdownBlock.OrderedList(items)
      continue
    }

    // Paragraph (accumulate consecutive plain text lines)
    val para = mutableListOf<String>()
    while (i < lines.size) {
      val cur = lines[i]
      val curTrim = cur.trim()
      if (curTrim.isEmpty() ||
        curTrim == "---" ||
        curTrim.startsWith("#") ||
        curTrim.startsWith("```") ||
        curTrim.startsWith(">") ||
        curTrim.startsWith("|") ||
        bulletItemRegex.matches(cur) ||
        orderedItemRegex.matches(cur)
      ) {
        break
      }
      para += curTrim
      i++
    }
    if (para.isNotEmpty()) {
      blocks += MarkdownBlock.Paragraph(para.joinToString(" "))
    } else {
      i++
    }
  }

  return blocks
}
