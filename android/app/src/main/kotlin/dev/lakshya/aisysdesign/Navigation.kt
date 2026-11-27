package dev.lakshya.aisysdesign

import android.widget.Toast
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.Style
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import dev.lakshya.aisysdesign.data.model.RoadmapItem
import dev.lakshya.aisysdesign.data.model.RoadmapItemType
import dev.lakshya.aisysdesign.ui.AppViewModel
import dev.lakshya.aisysdesign.ui.RecommendationMode
import dev.lakshya.aisysdesign.ui.components.FloatingPillNavBar
import dev.lakshya.aisysdesign.ui.components.GistSyncSheet
import dev.lakshya.aisysdesign.ui.components.NavPillDestination
import dev.lakshya.aisysdesign.ui.components.PocketToolsSheet
import dev.lakshya.aisysdesign.ui.components.SettingsSheet
import dev.lakshya.aisysdesign.ui.screens.LibraryScreen
import dev.lakshya.aisysdesign.ui.screens.ProblemDetailScreen
import dev.lakshya.aisysdesign.ui.screens.ProjectDetailScreen
import dev.lakshya.aisysdesign.ui.screens.ReaderScreen
import dev.lakshya.aisysdesign.ui.screens.RecallScreen
import dev.lakshya.aisysdesign.ui.screens.TodayScreen

@Composable
fun MainNavigation(vm: AppViewModel) {
  val backStack: NavBackStack<NavKey> = rememberNavBackStack(TodayRoute)
  val catalog by vm.catalog.collectAsState()
  val contentVersion by vm.contentVersion.collectAsState()
  val contentSyncUi by vm.contentSyncUi.collectAsState()
  val studyState by vm.studyState.collectAsState()
  val syncUi by vm.syncUi.collectAsState()
  val userPrefs by vm.userPrefs.collectAsState()
  val timerState by vm.mockTimer.collectAsState()
  val ttsState by vm.ttsState.collectAsState()
  val context = LocalContext.current

  var recommendationMode by remember { mutableStateOf(RecommendationMode.ROADMAP) }
  var showPocketTools by remember { mutableStateOf(false) }
  var showSyncSheet by remember { mutableStateOf(false) }
  var showSettingsSheet by remember { mutableStateOf(false) }

  val currentTop = backStack.lastOrNull()
  val showBottomNav = currentTop is TodayRoute || currentTop is RecallRoute || currentTop is LibraryRoute

  val selectedNavId =
    when (currentTop) {
      is RecallRoute -> "recall"
      is LibraryRoute -> "library"
      else -> "today"
    }

  val navDestinations = remember {
    listOf(
      NavPillDestination("today", "Today", Icons.Rounded.WbSunny),
      NavPillDestination("recall", "Recall", Icons.Rounded.Style),
      NavPillDestination("library", "Library", Icons.Rounded.AutoStories),
    )
  }

  fun openTopDestination(id: String) {
    val target: NavKey =
      when (id) {
        "recall" -> RecallRoute()
        "library" -> LibraryRoute
        else -> TodayRoute
      }
    backStack.clear()
    backStack.add(target)
  }

  fun openRoadmapItem(item: RoadmapItem) {
    when (item.type) {
      RoadmapItemType.FUNDAMENTAL -> backStack.add(ReaderRoute("fundamental", item.rawId))
      RoadmapItemType.SESSION -> backStack.add(ReaderRoute("session", item.rawId))
      RoadmapItemType.PROBLEM -> backStack.add(ProblemRoute(item.rawId))
    }
  }

  Box(modifier = Modifier.fillMaxSize()) {
    NavDisplay(
      backStack = backStack,
      onBack = {
        vm.stopSpeaking()
        backStack.removeLastOrNull()
      },
      entryProvider =
        entryProvider {
          entry<TodayRoute> {
            val activeNext = vm.getActiveNextItem(studyState, recommendationMode)
            val dueCount = vm.dueFlashcardsCount(studyState)
            val streak = vm.computeStudyStreakDays(studyState)
            val combinedSyncUi = syncUi.copy(
              isSyncing = syncUi.isSyncing || contentSyncUi.isSyncing,
            )
            TodayScreen(
              catalog = catalog,
              studyState = studyState,
              syncUi = combinedSyncUi,
              timerState = timerState,
              streakDays = streak,
              activeNextItem = activeNext,
              recommendationMode = recommendationMode,
              dueCardsCount = dueCount,
              isCompleted = { id -> vm.isCompleted(id, studyState) },
              onChangeMode = { recommendationMode = it },
              onOpenItem = ::openRoadmapItem,
              onToggleItemCompleted = vm::toggleCompleted,
              onOpenRecallFlashcards = {
                backStack.clear()
                backStack.add(RecallRoute(initialMode = 0))
              },
              onOpenPocketTools = { showPocketTools = true },
              onOpenSyncSheet = { showSyncSheet = true },
              onOpenSettings = { showSettingsSheet = true },
            )
          }

          entry<RecallRoute> { key ->
            RecallScreen(
              catalog = catalog,
              studyState = studyState,
              initialMode = key.initialMode,
              initialSourceId = key.sourceId,
              onRateFlashcard = vm::rateFlashcard,
              onRecordQuizAnswer = vm::recordQuizAnswer,
              onResetQuizzes = vm::resetQuizQuestions,
            )
          }

          entry<LibraryRoute> {
            LibraryScreen(
              catalog = catalog,
              studyState = studyState,
              isCompleted = { id -> vm.isCompleted(id, studyState) },
              onToggleCompleted = vm::toggleCompleted,
              onOpenRoadmapItem = ::openRoadmapItem,
              onOpenFundamental = { id -> backStack.add(ReaderRoute("fundamental", id)) },
              onOpenSession = { id -> backStack.add(ReaderRoute("session", id)) },
              onOpenProblem = { p -> backStack.add(ProblemRoute(p.id)) },
              onOpenProject = { proj -> backStack.add(ProjectRoute(proj.id)) },
              onRemoveHighlight = vm::removeHighlight,
            )
          }

          entry<ReaderRoute> { key ->
            val markdown = remember(key.itemType, key.itemId, contentVersion) {
              vm.loadMarkdown(key.itemType, key.itemId)
            }
            val title = remember(key.itemType, key.itemId, catalog) {
              if (key.itemType == "fundamental") {
                catalog.fundamentals.topics.firstOrNull { it.id == key.itemId }?.let {
                  "Topic ${it.number}: ${it.title}"
                } ?: key.itemId
              } else {
                catalog.sessions.firstOrNull { it.id == key.itemId }?.let {
                  "S${it.number.toString().padStart(2, '0')}: ${it.title}"
                } ?: key.itemId
              }
            }
            val studyPrompt = remember(key.itemType, key.itemId, catalog) {
              if (key.itemType == "fundamental") {
                "Explain $title from first principles with analogies, edge cases, and AI system tie-ins."
              } else {
                catalog.sessions.firstOrNull { it.id == key.itemId }?.studyPrompt
                  ?: "Teach me $title for a Senior AI System Design interview."
              }
            }
            val resources = remember(key.itemType, key.itemId, catalog) {
              if (key.itemType == "fundamental") {
                catalog.resources.fundamentals[key.itemId].orEmpty()
              } else {
                catalog.resources.sessions[key.itemId].orEmpty()
              }
            }
            val itemHighlights = remember(studyState.highlights, key.itemId) {
              studyState.highlights.filter { it.sourceId == key.itemId }
            }
            val quizCount = remember(key.itemId, catalog) {
              catalog.quizzes.count { it.sourceId == key.itemId }
            }
            val initialScroll = remember(key.itemId) { vm.getArticleScroll(key.itemId) }

            ReaderScreen(
              itemType = key.itemType,
              itemId = key.itemId,
              title = title,
              markdown = markdown,
              studyPrompt = studyPrompt,
              isCompleted = vm.isCompleted(key.itemId, studyState),
              scratchpadNote = studyState.scratchpadNotes[key.itemId].orEmpty(),
              highlights = itemHighlights,
              resources = resources,
              quizCount = quizCount,
              initialScrollIndex = initialScroll,
              ttsState = ttsState,
              isRefreshingContent = contentSyncUi.isSyncing,
              onRefreshArticle = {
                vm.refreshSingleArticle(key.itemType, key.itemId) { ok ->
                  Toast.makeText(
                    context,
                    if (ok) "Updated from GitHub" else "Could not refresh (offline?)",
                    Toast.LENGTH_SHORT,
                  ).show()
                }
              },
              onSaveScrollIndex = { idx -> vm.saveArticleScroll(key.itemId, idx) },
              onBack = {
                vm.stopSpeaking()
                backStack.removeLastOrNull()
              },
              onToggleCompleted = { vm.toggleCompleted(key.itemId) },
              onSaveScratchpad = { note -> vm.updateScratchpad(key.itemId, note) },
              onAddHighlight = { quote, color, note ->
                vm.addHighlight(
                  sourceType = key.itemType,
                  sourceId = key.itemId,
                  sourceTitle = title,
                  sectionTitle = "Mobile Study Anchor",
                  text = quote,
                  color = color,
                  note = note,
                )
              },
              onOpenQuizzes = {
                vm.stopSpeaking()
                backStack.add(RecallRoute(initialMode = 1, sourceId = key.itemId))
              },
              onOpenInternalResource = { href ->
                val targetId = href.substringAfterLast("/")
                if (href.contains("/fundamentals/")) {
                  backStack.add(ReaderRoute("fundamental", targetId))
                } else if (href.contains("/roadmap/")) {
                  backStack.add(ReaderRoute("session", targetId))
                }
              },
              onToggleSpeak = vm::toggleSpeak,
              onCycleTtsSpeed = vm::cycleTtsSpeed,
            )
          }

          entry<ProblemRoute> { key ->
            val problem = catalog.problems.firstOrNull { it.id == key.problemId }
            if (problem != null) {
              ProblemDetailScreen(
                problem = problem,
                isCompleted = vm.isCompleted(problem.id, studyState) || vm.isCompleted("problem:${problem.id}", studyState),
                timerState = timerState,
                onBack = { backStack.removeLastOrNull() },
                onToggleCompleted = { vm.toggleCompleted("problem:${problem.id}") },
                onStartTimer = {
                  if (!timerState.isRunning) vm.startMockTimerFresh()
                  showPocketTools = true
                },
              )
            }
          }

          entry<ProjectRoute> { key ->
            val project = catalog.projects.firstOrNull { it.id == key.projectId }
            if (project != null) {
              ProjectDetailScreen(
                project = project,
                ttsState = ttsState,
                onToggleSpeak = vm::toggleSpeak,
                onBack = {
                  vm.stopSpeaking()
                  backStack.removeLastOrNull()
                },
              )
            }
          }
        },
    )

    if (showBottomNav) {
      FloatingPillNavBar(
        destinations = navDestinations,
        selectedId = selectedNavId,
        onSelect = ::openTopDestination,
        modifier = Modifier.align(Alignment.BottomCenter),
      )
    }
  }

  if (showPocketTools) {
    PocketToolsSheet(
      timerState = timerState,
      onToggleTimer = vm::toggleMockTimer,
      onResetTimer = vm::resetMockTimer,
      onDismiss = { showPocketTools = false },
    )
  }

  if (showSyncSheet) {
    GistSyncSheet(
      syncUi = syncUi,
      contentSyncUi = contentSyncUi,
      onSyncContentNow = { vm.refreshContentFromGitHub(silent = false) },
      onConnect = vm::connectSync,
      onSyncNow = vm::syncNow,
      onDisconnect = vm::disconnectSync,
      onDismiss = { showSyncSheet = false },
    )
  }

  if (showSettingsSheet) {
    SettingsSheet(
      prefs = userPrefs,
      onSetThemeMode = vm::setThemeMode,
      onSetDynamicColor = vm::setDynamicColor,
      onUpdateReminder = vm::updateReminder,
      onSendTestNotification = vm::sendTestNotification,
      onExportJson = vm::exportProgressJson,
      onImportJson = vm::importProgressJson,
      onDismiss = { showSettingsSheet = false },
    )
  }
}
