package dev.lakshya.aisysdesign.data

enum class StudyTabId(val shortLabel: String, val fullLabel: String) {
  INTUITION("Intuition", "1. Intuition"),
  ARCHITECTURE("Architecture", "2. Core & Architecture"),
  DEEP_DIVE("Deep Dive", "3. Deep Dive & Code"),
  INTERVIEW("Interview", "4. Interview Drill"),
  ALL("All", "All Sections"),
}

data class ArticleSubHeading(
  val id: String,
  val title: String,
)

data class ArticleSection(
  val id: String,
  val title: String,
  val markdown: String,
  val tab: StudyTabId,
  val subHeadings: List<ArticleSubHeading>,
)

data class ParsedArticle(
  val introMarkdown: String,
  val sections: List<ArticleSection>,
  val availableTabs: List<StudyTabId>,
)

data class SocraticStep(
  val question: String,
  val answerMarkdown: String,
)

data class ExplainLayer(
  val label: String,
  val shortLabel: String,
  val bodyMarkdown: String,
)

data class TimelineEvent(
  val time: String,
  val bodyMarkdown: String,
)

data class InterviewQAItem(
  val id: String,
  val title: String,
  val bodyMarkdown: String,
)

data class RapidFireItem(
  val prompt: String,
  val answer: String,
)

sealed interface SectionBlock {
  data class Markdown(val markdown: String) : SectionBlock
  data class SocraticLadder(
    val id: String,
    val heading: String,
    val steps: List<SocraticStep>,
  ) : SectionBlock
  data class ExplainInLayers(
    val id: String,
    val heading: String,
    val layers: List<ExplainLayer>,
  ) : SectionBlock
  data class TimestampedTimeline(
    val id: String,
    val heading: String,
    val events: List<TimelineEvent>,
    val takeawayMarkdown: String? = null,
  ) : SectionBlock
  data class InterviewQaGroup(val items: List<InterviewQAItem>) : SectionBlock
  data class RapidFire(
    val id: String,
    val heading: String,
    val items: List<RapidFireItem>,
  ) : SectionBlock
}

object StudyArticleParser {
  private val fenceRegex = Regex("^\\s*(```|~~~)")
  private val h1Regex = Regex("^#\\s+")
  private val h2Regex = Regex("^##\\s+(.+)$")
  private val h3Regex = Regex("^###\\s+(.+)$")
  private val trailingRuleRegex = Regex("(?:\\r?\\n\\s*---\\s*)+$")
  private val nonSlugRegex = Regex("[^\\w\\s-]")
  private val spaceRegex = Regex("\\s+")

  private val interviewTabRegex = Regex(
    "interview|rapid\\s*fire|quick\\s*recall|canonical\\s*problems|deliverable|socratic\\s*study\\s*prompt|\\bsection\\s*f\\b|\\bsection\\s*g\\b|\\bpart\\s*8\\b",
    RegexOption.IGNORE_CASE,
  )
  private val deepDiveTabRegex = Regex(
    "deep[-\\s]?dive|failure|production\\s*ai|resume|\\bcode\\b|\\bmechanics\\b|\\bsection\\s*e\\b|\\bpart\\s*[67]\\b",
    RegexOption.IGNORE_CASE,
  )
  private val intuitionTabRegex = Regex(
    "build\\s*it\\s*from\\s*zero|quick\\s*summary|topics\\s*to\\s*cover|why\\s*do\\s*we\\s*copy|jargon\\s*translated|\\bsection\\s*a\\b|\\bpart\\s*[12]\\b",
    RegexOption.IGNORE_CASE,
  )
  private val archTabRegex = Regex(
    "first\\s*principles|analogies|capacity|visual|blueprint|architecture|diagram|comparison|trade[-\\s]?off|decision|choose\\s*your|topologies|synchronous|consistency|\\bcap\\b|pacelc|consistent\\s*hashing|row[-\\s]?oriented|b-tree|how\\s*databases|\\bsection\\s*[bcd]\\b|\\bpart\\s*[345]\\b",
    RegexOption.IGNORE_CASE,
  )

  private val socraticQRegex = Regex("^\\*\\*🤔\\s*(.+?)\\*\\*\\s*$")
  private val layerItemRegex = Regex("^-\\s+\\*\\*([^*:]+):?\\*\\*:?\\s*(.*)$")
  private val timelineItemRegex = Regex("^-\\s+`([^`]+)`\\s*[—–-]\\s*(.+)$")
  private val rapidFireQRegex = Regex("^-\\s+\\*\\*Q:\\s*(.+?)\\*\\*\\s*(.*)$", RegexOption.IGNORE_CASE)
  private val rapidFireARegex = Regex("^\\s*-\\s+\\*\\*A:\\*\\*\\s*(.+)$", RegexOption.IGNORE_CASE)
  private val singleBulletRegex = Regex("^-\\s+(.+)$")
  private val interviewQaHeadingRegex = Regex("^(Q\\d+|Question\\s*\\d+)\\s*[:.—–-]", RegexOption.IGNORE_CASE)

  fun slugifyHeading(text: String): String {
    return text.lowercase()
      .replace(nonSlugRegex, "")
      .replace(spaceRegex, "-")
  }

  private fun stripTrailingRule(md: String): String {
    return md.replace(trailingRuleRegex, "").trim()
  }

  private fun classifyHeading(rawHeading: String, index: Int, total: Int): StudyTabId {
    if (interviewTabRegex.containsMatchIn(rawHeading)) return StudyTabId.INTERVIEW
    if (deepDiveTabRegex.containsMatchIn(rawHeading)) return StudyTabId.DEEP_DIVE
    if (intuitionTabRegex.containsMatchIn(rawHeading)) return StudyTabId.INTUITION
    if (archTabRegex.containsMatchIn(rawHeading)) return StudyTabId.ARCHITECTURE
    if (index == 0) return StudyTabId.INTUITION
    if (index < (total + 1) / 2) return StudyTabId.ARCHITECTURE
    return StudyTabId.DEEP_DIVE
  }

  private fun extractSubHeadings(markdown: String): List<ArticleSubHeading> {
    val result = mutableListOf<ArticleSubHeading>()
    var inFence = false
    for (line in markdown.lines()) {
      if (fenceRegex.containsMatchIn(line)) {
        inFence = !inFence
        continue
      }
      if (inFence) continue
      val m = h3Regex.find(line)
      if (m != null) {
        val title = m.groupValues[1].trim()
        result += ArticleSubHeading(slugifyHeading(title), title)
      }
    }
    return result
  }

  fun parseStudyArticle(content: String): ParsedArticle {
    val lines = content.replace("\r\n", "\n").split("\n")
    var startIdx = 0
    while (startIdx < lines.size && lines[startIdx].isBlank()) startIdx++
    if (startIdx < lines.size && h1Regex.containsMatchIn(lines[startIdx])) startIdx++

    val introLines = mutableListOf<String>()
    val rawSections = mutableListOf<Pair<String, MutableList<String>>>()
    var currentSection: Pair<String, MutableList<String>>? = null
    var inFence = false

    for (i in startIdx until lines.size) {
      val line = lines[i]
      if (fenceRegex.containsMatchIn(line)) inFence = !inFence
      if (!inFence) {
        val h2 = h2Regex.find(line)
        if (h2 != null) {
          currentSection?.let { rawSections += it }
          currentSection = h2.groupValues[1].trim() to mutableListOf()
          continue
        }
      }
      if (currentSection != null) currentSection.second += line else introLines += line
    }
    currentSection?.let { rawSections += it }

    val sections = rawSections.mapIndexed { idx, (title, secLines) ->
      val md = stripTrailingRule(secLines.joinToString("\n"))
      ArticleSection(
        id = slugifyHeading(title),
        title = title,
        markdown = md,
        tab = classifyHeading(title, idx, rawSections.size),
        subHeadings = extractSubHeadings(md),
      )
    }

    val presentTabs = sections.map { it.tab }.toSet()
    val coreOrder = listOf(StudyTabId.INTUITION, StudyTabId.ARCHITECTURE, StudyTabId.DEEP_DIVE, StudyTabId.INTERVIEW)
    val availableTabs = coreOrder.filter { it in presentTabs }

    return ParsedArticle(
      introMarkdown = stripTrailingRule(introLines.joinToString("\n")),
      sections = sections,
      availableTabs = availableTabs,
    )
  }

  private fun splitByH3(markdown: String): List<Pair<String?, String>> {
    val parts = mutableListOf<Pair<String?, MutableList<String>>>()
    var currentHeading: String? = null
    var currentLines = mutableListOf<String>()
    var inFence = false

    for (line in markdown.lines()) {
      if (fenceRegex.containsMatchIn(line)) inFence = !inFence
      if (!inFence) {
        val m = h3Regex.find(line)
        if (m != null) {
          if (currentHeading != null || currentLines.joinToString("\n").isNotBlank()) {
            parts += currentHeading to currentLines
          }
          currentHeading = m.groupValues[1].trim()
          currentLines = mutableListOf()
          continue
        }
      }
      currentLines += line
    }
    if (currentHeading != null || currentLines.joinToString("\n").isNotBlank()) {
      parts += currentHeading to currentLines
    }
    return parts.map { (h, ls) -> h to ls.joinToString("\n").trim() }
  }

  private fun tryParseSocraticLadder(heading: String, body: String): List<SocraticStep>? {
    if (!heading.contains("socratic", ignoreCase = true) || !heading.contains("ladder", ignoreCase = true)) {
      return null
    }
    val steps = mutableListOf<SocraticStep>()
    var currentQ: String? = null
    val answerLines = mutableListOf<String>()

    for (line in body.lines()) {
      val m = socraticQRegex.find(line)
      if (m != null) {
        currentQ?.let { steps += SocraticStep(it, answerLines.joinToString("\n").trim()) }
        currentQ = m.groupValues[1].trim()
        answerLines.clear()
      } else if (currentQ != null) {
        answerLines += line
      }
    }
    currentQ?.let { steps += SocraticStep(it, answerLines.joinToString("\n").trim()) }
    return steps.takeIf { it.size >= 2 }
  }

  private fun shortenLayerLabel(label: String): String {
    val lower = label.lowercase()
    return when {
      "12-year" in lower -> "12-Year-Old"
      "non-backend" in lower || "non-tech" in lower -> "Non-Backend"
      "engineer" in lower -> "Engineer"
      else -> label.replace(Regex("\\s*\\([^)]*\\)"), "").trim().ifEmpty { label }
    }
  }

  private fun tryParseExplainInLayers(heading: String, body: String): List<ExplainLayer>? {
    if (!Regex("explain\\s*it\\s*in\\s*layers", RegexOption.IGNORE_CASE).containsMatchIn(heading)) {
      return null
    }
    val layers = mutableListOf<ExplainLayer>()
    var currentLabel: String? = null
    val currentLines = mutableListOf<String>()

    for (line in body.lines()) {
      val m = layerItemRegex.find(line)
      if (m != null) {
        currentLabel?.let { lbl ->
          layers += ExplainLayer(lbl, shortenLayerLabel(lbl), currentLines.joinToString("\n").trim())
        }
        currentLabel = m.groupValues[1].trim().removeSuffix(":")
        currentLines.clear()
        val first = m.groupValues[2].trim()
        if (first.isNotEmpty()) currentLines += first
      } else if (currentLabel != null && line.isNotBlank()) {
        currentLines += line.trim()
      }
    }
    currentLabel?.let { lbl ->
      layers += ExplainLayer(lbl, shortenLayerLabel(lbl), currentLines.joinToString("\n").trim())
    }
    return layers.takeIf { it.size >= 2 }
  }

  private fun tryParseTimestampedStory(
    heading: String,
    body: String,
  ): Pair<List<TimelineEvent>, String?>? {
    if (!Regex("timestamped|alice\\s*&\\s*bob", RegexOption.IGNORE_CASE).containsMatchIn(heading)) {
      return null
    }
    val events = mutableListOf<TimelineEvent>()
    val trailing = mutableListOf<String>()
    for (line in body.lines()) {
      if (line.isBlank()) continue
      val m = timelineItemRegex.find(line)
      if (m != null) {
        events += TimelineEvent(m.groupValues[1].trim(), m.groupValues[2].trim())
      } else if (events.isNotEmpty()) {
        trailing += line
      } else {
        return null
      }
    }
    if (events.size < 2) return null
    val takeaway = trailing.joinToString("\n").trim().takeIf { it.isNotEmpty() }
    return events to takeaway
  }

  private fun tryParseRapidFire(heading: String, body: String): List<RapidFireItem>? {
    if (!Regex("rapid\\s*fire", RegexOption.IGNORE_CASE).containsMatchIn(heading)) {
      return null
    }
    val items = mutableListOf<RapidFireItem>()
    var currentPrompt: String? = null
    val answerLines = mutableListOf<String>()

    for (line in body.lines()) {
      val qm = rapidFireQRegex.find(line)
      if (qm != null) {
        currentPrompt?.let { items += RapidFireItem(it, answerLines.joinToString(" ").trim()) }
        currentPrompt = qm.groupValues[1].trim()
        answerLines.clear()
        val rest = qm.groupValues[2].trim()
        if (rest.isNotEmpty()) answerLines += rest
        continue
      }
      val am = rapidFireARegex.find(line)
      if (am != null && currentPrompt != null) {
        answerLines += am.groupValues[1].trim()
        continue
      }
      val sb = singleBulletRegex.find(line)
      if (sb != null && currentPrompt == null) {
        val raw = sb.groupValues[1].trim()
        val parts = raw.split(Regex("\\s+[—–]\\s+"))
        if (parts.size >= 2) {
          items += RapidFireItem(
            prompt = parts[0].replace("**", "").trim(),
            answer = parts.drop(1).joinToString(" — ").trim(),
          )
        }
      } else if (currentPrompt != null && line.isNotBlank()) {
        answerLines += line.trim()
      }
    }
    currentPrompt?.let { items += RapidFireItem(it, answerLines.joinToString(" ").trim()) }
    return items.takeIf { it.size >= 2 }
  }

  fun parseSectionBlocks(section: ArticleSection): List<SectionBlock> {
    val parts = splitByH3(section.markdown)
    val blocks = mutableListOf<SectionBlock>()
    val pendingQA = mutableListOf<InterviewQAItem>()

    fun flushQA() {
      if (pendingQA.isNotEmpty()) {
        blocks += SectionBlock.InterviewQaGroup(pendingQA.toList())
        pendingQA.clear()
      }
    }

    for ((heading, body) in parts) {
      if (heading == null) {
        flushQA()
        if (body.isNotBlank()) blocks += SectionBlock.Markdown(body)
        continue
      }

      tryParseSocraticLadder(heading, body)?.let { steps ->
        flushQA()
        blocks += SectionBlock.SocraticLadder(slugifyHeading(heading), heading, steps)
        continue
      }

      tryParseExplainInLayers(heading, body)?.let { layers ->
        flushQA()
        blocks += SectionBlock.ExplainInLayers(slugifyHeading(heading), heading, layers)
        continue
      }

      tryParseTimestampedStory(heading, body)?.let { (events, takeaway) ->
        flushQA()
        blocks += SectionBlock.TimestampedTimeline(slugifyHeading(heading), heading, events, takeaway)
        continue
      }

      tryParseRapidFire(heading, body)?.let { items ->
        flushQA()
        blocks += SectionBlock.RapidFire(slugifyHeading(heading), heading, items)
        continue
      }

      if (section.tab == StudyTabId.INTERVIEW &&
        interviewQaHeadingRegex.containsMatchIn(heading) &&
        body.isNotBlank()
      ) {
        pendingQA += InterviewQAItem(slugifyHeading(heading), heading, body)
        continue
      }

      flushQA()
      blocks += SectionBlock.Markdown("### $heading\n\n$body".trim())
    }

    flushQA()
    return blocks
  }

  fun stripMarkdownForSpeech(markdown: String): String {
    var text = markdown
    // Remove mermaid and fenced code blocks so TTS reads cleanly
    text = text.replace(Regex("```[\\s\\S]*?```"), " Code example omitted. ")
    // Replace markdown links [label](url) -> label
    text = text.replace(Regex("\\[([^\\]]+)]\\([^)]+\\)"), "$1")
    // Strip formatting characters
    text = text.replace(Regex("(?m)^#{1,6}\\s+"), "")
    text = text.replace(Regex("(?m)^>\\s*"), "")
    text = text.replace(Regex("(?m)^[-*+]\\s+"), "")
    text = text.replace(Regex("\\*\\*|__|`|\\*"), "")
    text = text.replace(Regex("\\|"), ", ")
    text = text.replace(Regex("(?m)^[-:]+$"), "")
    text = text.replace(Regex("\\s{2,}"), " ")
    return text.trim()
  }
}
