package dev.lakshya.aisysdesign.data

import android.content.Context
import dev.lakshya.aisysdesign.data.model.CaseStudyProblem
import dev.lakshya.aisysdesign.data.model.CurriculumData
import dev.lakshya.aisysdesign.data.model.CurriculumSession
import dev.lakshya.aisysdesign.data.model.Flashcard
import dev.lakshya.aisysdesign.data.model.FundamentalTopic
import dev.lakshya.aisysdesign.data.model.FundamentalsData
import dev.lakshya.aisysdesign.data.model.QuizQuestion
import dev.lakshya.aisysdesign.data.model.ResourcesData
import dev.lakshya.aisysdesign.data.model.ResumeProject
import dev.lakshya.aisysdesign.data.model.RoadmapItem
import dev.lakshya.aisysdesign.data.model.RoadmapItemType
import dev.lakshya.aisysdesign.data.model.RolesData
import kotlinx.serialization.json.Json

data class PortalCatalog(
  val curriculum: CurriculumData,
  val fundamentals: FundamentalsData,
  val flashcards: List<Flashcard>,
  val quizzes: List<QuizQuestion>,
  val problems: List<CaseStudyProblem>,
  val projects: List<ResumeProject>,
  val roles: RolesData,
  val resources: ResourcesData,
  val sessions: List<CurriculumSession>,
  val sequenceItems: List<RoadmapItem>,
)

class PortalRepository(private val context: Context) {

  companion object {
    val json = Json {
      ignoreUnknownKeys = true
      isLenient = true
      encodeDefaults = true
    }

    fun buildCatalog(
      curriculumJson: String,
      fundamentalsJson: String,
      flashcardsJson: String,
      quizzesJson: String,
      problemsJson: String,
      projectsJson: String,
      rolesJson: String = "{}",
      resourcesJson: String = "{}",
    ): PortalCatalog {
      val curriculum = json.decodeFromString<CurriculumData>(curriculumJson)
      val fundamentals = json.decodeFromString<FundamentalsData>(fundamentalsJson)
      val flashcards = json.decodeFromString<List<Flashcard>>(flashcardsJson)
      val quizzes = json.decodeFromString<List<QuizQuestion>>(quizzesJson)
      val problems = json.decodeFromString<List<CaseStudyProblem>>(problemsJson)
      val projects = json.decodeFromString<List<ResumeProject>>(projectsJson)
      val roles = json.decodeFromString<RolesData>(rolesJson)
      val resources = json.decodeFromString<ResourcesData>(resourcesJson)

      val sessions = curriculum.modules.flatMap { it.sessions }
      val sessionMap = sessions.associateBy { it.id }
      val fundMap = fundamentals.topics.associateBy { it.id }
      val problemMap = problems.associateBy { it.id }
      val phaseMap = curriculum.phases.associateBy { it.number }

      val sequenceItems = buildList {
        for (week in curriculum.weeks) {
          val phaseTitle = phaseMap[week.phase]?.title ?: "Phase ${week.phase}"
          for (itemId in week.items) {
            when {
              itemId.startsWith("fund-") -> {
                val t = fundMap[itemId] ?: continue
                add(
                  RoadmapItem(
                    id = itemId,
                    rawId = itemId,
                    week = week.week,
                    phaseNumber = week.phase,
                    phaseTitle = phaseTitle,
                    weekFocus = week.focus,
                    weekMilestone = week.milestone,
                    type = RoadmapItemType.FUNDAMENTAL,
                    typeLabel = "Fundamental",
                    title = "Topic ${t.number}: ${t.title}",
                    shortTitle = t.title,
                    subtitle = t.aiTieIn,
                    readTime = t.readTime,
                    status = t.status,
                    studyPrompt = "Explain ${t.title} from first principles with everyday analogies, edge cases, failure scenarios, and AI system tie-ins.",
                  )
                )
              }
              itemId.startsWith("problem:") -> {
                val pId = itemId.removePrefix("problem:")
                val p = problemMap[pId] ?: continue
                add(
                  RoadmapItem(
                    id = itemId,
                    rawId = pId,
                    week = week.week,
                    phaseNumber = week.phase,
                    phaseTitle = phaseTitle,
                    weekFocus = week.focus,
                    weekMilestone = week.milestone,
                    type = RoadmapItemType.PROBLEM,
                    typeLabel = "Case Study",
                    title = p.title,
                    shortTitle = p.title.removePrefix("Design an ").removePrefix("Design a "),
                    subtitle = p.resumeTie,
                    readTime = "45 min mock",
                    status = p.status,
                    studyPrompt = p.prompt,
                    tier = p.tier,
                  )
                )
              }
              itemId.startsWith("session-") -> {
                val s = sessionMap[itemId] ?: continue
                add(
                  RoadmapItem(
                    id = itemId,
                    rawId = itemId,
                    week = week.week,
                    phaseNumber = week.phase,
                    phaseTitle = phaseTitle,
                    weekFocus = week.focus,
                    weekMilestone = week.milestone,
                    type = RoadmapItemType.SESSION,
                    typeLabel = "Session",
                    title = "Session ${s.number}: ${s.title}",
                    shortTitle = s.title,
                    subtitle = s.projectTieIn,
                    readTime = s.estimatedReadTime.ifBlank { "15 min" },
                    status = s.status,
                    studyPrompt = s.studyPrompt,
                  )
                )
              }
            }
          }
        }
      }

      return PortalCatalog(
        curriculum = curriculum,
        fundamentals = fundamentals,
        flashcards = flashcards,
        quizzes = quizzes,
        problems = problems,
        projects = projects,
        roles = roles,
        resources = resources,
        sessions = sessions,
        sequenceItems = sequenceItems,
      )
    }
  }

  private fun readAssetText(path: String): String {
    return context.assets.open(path).bufferedReader().use { it.readText() }
  }

  fun loadCatalog(): PortalCatalog {
    return buildCatalog(
      curriculumJson = readAssetText("data/curriculum.json"),
      fundamentalsJson = readAssetText("data/fundamentals.json"),
      flashcardsJson = readAssetText("data/flashcards.json"),
      quizzesJson = readAssetText("data/quizzes.json"),
      problemsJson = readAssetText("data/problems.json"),
      projectsJson = readAssetText("data/projects.json"),
      rolesJson = readAssetText("data/roles.json"),
      resourcesJson = readAssetText("data/resources.json"),
    )
  }

  fun loadMarkdown(itemType: String, itemId: String): String {
    val folder = if (itemType == "fundamental") "fundamentals" else "sessions"
    val cleanId = itemId.removeSuffix(".md")
    return try {
      readAssetText("content/$folder/$cleanId.md")
    } catch (_: Exception) {
      "# $cleanId\n\nContent file not found in bundled assets."
    }
  }
}
