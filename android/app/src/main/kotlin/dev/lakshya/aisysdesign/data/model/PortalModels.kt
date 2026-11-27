package dev.lakshya.aisysdesign.data.model

import kotlinx.serialization.Serializable

@Serializable
data class CurriculumData(
  val candidate: CandidateProfile,
  val quickRevisionMetrics: List<QuickRevisionMetric> = emptyList(),
  val modules: List<CurriculumModule> = emptyList(),
  val phases: List<CurriculumPhase> = emptyList(),
  val weeks: List<CurriculumWeek> = emptyList(),
  val tiers: Map<String, String> = emptyMap(),
)

@Serializable
data class CandidateProfile(
  val name: String,
  val role: String,
  val experience: String,
  val coreStack: List<String> = emptyList(),
  val targetProfile: String = "",
)

@Serializable
data class QuickRevisionMetric(
  val id: String,
  val category: String,
  val title: String,
  val formula: String,
  val detail: String,
)

@Serializable
data class CurriculumModule(
  val id: String,
  val title: String,
  val focus: String,
  val sessions: List<CurriculumSession> = emptyList(),
)

@Serializable
data class CurriculumSession(
  val id: String,
  val number: Int,
  val title: String,
  val projectTieIn: String = "",
  val estimatedReadTime: String = "15 min",
  val phase: Int = 1,
  val week: Int = 1,
  val priority: String = "core",
  val status: String = "skeleton",
  val isNew: Boolean = false,
  val topics: List<String> = emptyList(),
  val canonicalProblems: List<String> = emptyList(),
  val deliverable: String = "",
  val studyPrompt: String = "",
)

@Serializable
data class CurriculumPhase(
  val id: String,
  val number: Int,
  val title: String,
  val weeks: String,
  val goal: String,
  val exitCriteria: List<String> = emptyList(),
)

@Serializable
data class CurriculumWeek(
  val week: Int,
  val phase: Int,
  val focus: String,
  val items: List<String> = emptyList(),
  val milestone: String = "",
)

@Serializable
data class FundamentalsData(
  val title: String,
  val focus: String,
  val topics: List<FundamentalTopic> = emptyList(),
)

@Serializable
data class FundamentalTopic(
  val id: String,
  val number: Int,
  val title: String,
  val readTime: String = "15 min",
  val aiTieIn: String = "",
  val status: String = "written",
  val topics: List<String> = emptyList(),
  val phase: Int = 0,
  val week: Int = 1,
)

@Serializable
data class Flashcard(
  val id: String,
  val sessionId: String,
  val module: String,
  val projectTag: String,
  val question: String,
  val answer: String,
)

@Serializable
data class QuizQuestion(
  val id: String,
  val sourceId: String,
  val module: String,
  val category: String,
  val projectTag: String? = null,
  val scenario: String,
  val question: String,
  val options: List<QuizOption> = emptyList(),
  val correctOptionId: String,
  val takeaway: String,
)

@Serializable
data class QuizOption(
  val id: String,
  val text: String,
  val trapLabel: String,
  val explanation: String,
)

@Serializable
data class CaseStudyProblem(
  val id: String,
  val title: String,
  val difficulty: String,
  val tracks: List<String> = emptyList(),
  val prompt: String,
  val clarifying: List<String> = emptyList(),
  val estimation: List<String> = emptyList(),
  val architecture: List<String> = emptyList(),
  val mermaid: String = "",
  val deepDives: List<DeepDiveQA> = emptyList(),
  val tradeoffs: List<String> = emptyList(),
  val failureModes: List<String> = emptyList(),
  val resumeTie: String = "",
  val relatedSessions: List<String> = emptyList(),
  val followUps: List<String> = emptyList(),
  val tier: String = "",
  val week: Int = 1,
  val mustDo: Boolean = false,
  val status: String = "written",
  val upgradeNotes: List<String> = emptyList(),
)

@Serializable
data class DeepDiveQA(
  val q: String,
  val a: String,
)

@Serializable
data class ResumeProject(
  val id: String,
  val tag: String,
  val company: String,
  val title: String,
  val subtitle: String,
  val elevatorPitch: String,
  val impactMetrics: List<ImpactMetric> = emptyList(),
  val techStack: List<String> = emptyList(),
  val currentArchitectureMermaid: String = "",
  val scale100xArchitectureMermaid: String = "",
  val hardNumbers: HardNumbers,
  val hostileQuestions: List<HostileQuestion> = emptyList(),
)

@Serializable
data class ImpactMetric(
  val label: String,
  val value: String,
  val delta: String,
)

@Serializable
data class HardNumbers(
  val qps: String,
  val dailyVolume: String,
  val latency: String,
  val costPer1k: String,
  val evalMetrics: String,
)

@Serializable
data class HostileQuestion(
  val question: String,
  val answer: String,
)

@Serializable
data class RolesData(
  val intro: String = "",
  val weightLegend: Map<String, String> = emptyMap(),
  val roles: List<TargetRole> = emptyList(),
)

@Serializable
data class TargetRole(
  val id: String,
  val title: String,
  val priority: String = "",
  val fit: String = "",
  val tagline: String = "",
  val titlesToSearch: List<String> = emptyList(),
  val targetCompanies: String = "",
  val whatTheyTest: List<String> = emptyList(),
  val weights: Map<String, Int> = emptyMap(),
  val mustDo: List<String> = emptyList(),
  val skim: List<String> = emptyList(),
  val skip: List<String> = emptyList(),
  val gapsToClose: List<String> = emptyList(),
  val problems: List<String> = emptyList(),
  val resumeFraming: String = "",
)

@Serializable
data class ResourcesData(
  val foundationalBooks: List<StudyResource> = emptyList(),
  val fundamentals: Map<String, List<StudyResource>> = emptyMap(),
  val sessions: Map<String, List<StudyResource>> = emptyMap(),
)

@Serializable
data class StudyResource(
  val title: String,
  val type: String = "article",
  val why: String = "",
  val url: String? = null,
  val href: String? = null,
)

enum class RoadmapItemType {
  FUNDAMENTAL,
  SESSION,
  PROBLEM,
}

data class RoadmapItem(
  val id: String,
  val rawId: String,
  val week: Int,
  val phaseNumber: Int,
  val phaseTitle: String,
  val weekFocus: String,
  val weekMilestone: String,
  val type: RoadmapItemType,
  val typeLabel: String,
  val title: String,
  val shortTitle: String,
  val subtitle: String,
  val readTime: String,
  val status: String,
  val studyPrompt: String,
  val tier: String? = null,
)
