package dev.lakshya.aisysdesign.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.FilterList
import androidx.compose.material.icons.rounded.Flip
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.PortalCatalog
import dev.lakshya.aisysdesign.data.SrsEngine
import dev.lakshya.aisysdesign.data.model.Flashcard
import dev.lakshya.aisysdesign.data.model.QuizQuestion
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.ui.components.MarkdownBlockView
import dev.lakshya.aisysdesign.ui.components.TactilePillButton
import dev.lakshya.aisysdesign.ui.components.TonalChip
import dev.lakshya.aisysdesign.ui.components.TonalIconPill
import dev.lakshya.aisysdesign.ui.components.parseMarkdownBlocks
import dev.lakshya.aisysdesign.ui.components.renderInlineMarkdown
import dev.lakshya.aisysdesign.ui.theme.EasyOnTintDark
import dev.lakshya.aisysdesign.ui.theme.EasyOnTintLight
import dev.lakshya.aisysdesign.ui.theme.EasyTintDark
import dev.lakshya.aisysdesign.ui.theme.EasyTintLight
import dev.lakshya.aisysdesign.ui.theme.GoodOnTintDark
import dev.lakshya.aisysdesign.ui.theme.GoodOnTintLight
import dev.lakshya.aisysdesign.ui.theme.GoodTintDark
import dev.lakshya.aisysdesign.ui.theme.GoodTintLight
import dev.lakshya.aisysdesign.ui.theme.HardOnTintDark
import dev.lakshya.aisysdesign.ui.theme.HardOnTintLight
import dev.lakshya.aisysdesign.ui.theme.HardTintDark
import dev.lakshya.aisysdesign.ui.theme.HardTintLight
import kotlin.math.abs
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun RecallScreen(
  catalog: PortalCatalog,
  studyState: SyncedStudyState,
  initialMode: Int = 0,
  initialSourceId: String? = null,
  onRateFlashcard: (String, String) -> Unit,
  onRecordQuizAnswer: (String, String, Boolean) -> Unit,
  onResetQuizzes: (List<String>) -> Unit,
) {
  var mode by remember(initialMode) { mutableIntStateOf(initialMode) }
  var selectedModule by remember { mutableStateOf("All") }
  var dueOnly by remember { mutableStateOf(true) }
  var unansweredOnly by remember { mutableStateOf(false) }
  var sourceFilter by remember(initialSourceId) { mutableStateOf(initialSourceId) }
  var showFilterSheet by remember { mutableStateOf(false) }

  val modules = remember(catalog) {
    listOf("All") + (catalog.flashcards.map { it.module } + catalog.quizzes.map { it.module }).distinct().sorted()
  }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .statusBarsPadding()
      .padding(horizontal = 20.dp)
      .padding(top = 12.dp, bottom = 104.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(10.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      SingleChoiceSegmentedButtonRow(modifier = Modifier.weight(1f)) {
        listOf("Flashcards", "Quizzes").forEachIndexed { idx, label ->
          SegmentedButton(
            selected = mode == idx,
            onClick = { mode = idx },
            shape = SegmentedButtonDefaults.itemShape(index = idx, count = 2),
          ) {
            Text(label)
          }
        }
      }
      TonalIconPill(
        icon = Icons.Rounded.FilterList,
        contentDescription = "Filter deck",
        onClick = { showFilterSheet = true },
      )
    }

    if (sourceFilter != null) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        TonalChip(
          text = "Scoped to $sourceFilter",
          containerColor = MaterialTheme.colorScheme.primaryContainer,
          contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
        )
        TonalChip(
          text = "Clear ×",
          modifier = Modifier.clickable { sourceFilter = null },
        )
      }
    }

    if (mode == 0) {
      FlashcardArena(
        cards = catalog.flashcards,
        studyState = studyState,
        selectedModule = selectedModule,
        dueOnly = dueOnly,
        onShowAllCards = { dueOnly = false },
        onRate = onRateFlashcard,
      )
    } else {
      QuizArena(
        questions = catalog.quizzes,
        studyState = studyState,
        selectedModule = selectedModule,
        sourceFilter = sourceFilter,
        unansweredOnly = unansweredOnly,
        onAnswer = onRecordQuizAnswer,
        onResetScope = onResetQuizzes,
      )
    }
  }

  if (showFilterSheet) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
      onDismissRequest = { showFilterSheet = false },
      sheetState = sheetState,
      shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
      containerColor = MaterialTheme.colorScheme.surface,
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(horizontal = 20.dp)
          .padding(bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
      ) {
        Text("Filter Recall Deck", style = MaterialTheme.typography.headlineSmall)

        Text("Module", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          modules.forEach { mod ->
            val selected = selectedModule == mod
            Surface(
              shape = CircleShape,
              color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceContainerHigh,
              modifier = Modifier
                .clip(CircleShape)
                .clickable { selectedModule = mod },
            ) {
              Text(
                text = mod,
                style = MaterialTheme.typography.labelMedium,
                color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
              )
            }
          }
        }

        if (mode == 0) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            listOf(true to "Due Only", false to "All Cards").forEach { (flag, label) ->
              val selected = dueOnly == flag
              Surface(
                shape = CircleShape,
                color = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh,
                modifier = Modifier
                  .clip(CircleShape)
                  .clickable { dueOnly = flag },
              ) {
                Text(
                  text = label,
                  style = MaterialTheme.typography.labelMedium,
                  color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                  modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp),
                )
              }
            }
          }
        } else {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            listOf(false to "All Questions", true to "Unanswered Only").forEach { (flag, label) ->
              val selected = unansweredOnly == flag
              Surface(
                shape = CircleShape,
                color = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh,
                modifier = Modifier
                  .clip(CircleShape)
                  .clickable { unansweredOnly = flag },
              ) {
                Text(
                  text = label,
                  style = MaterialTheme.typography.labelMedium,
                  color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                  modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp),
                )
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun FlashcardArena(
  cards: List<Flashcard>,
  studyState: SyncedStudyState,
  selectedModule: String,
  dueOnly: Boolean,
  onShowAllCards: () -> Unit,
  onRate: (String, String) -> Unit,
) {
  val now = remember(studyState.flashcardSRS) { System.currentTimeMillis() }
  val filtered = remember(cards, studyState.flashcardSRS, selectedModule, dueOnly) {
    cards.filter { card ->
      val modMatch = selectedModule == "All" || card.module == selectedModule
      val dueMatch = !dueOnly || SrsEngine.isCardDue(studyState.flashcardSRS[card.id], now)
      modMatch && dueMatch
    }
  }

  var cardIndex by remember(selectedModule, dueOnly, filtered.size) { mutableIntStateOf(0) }
  var isFlipped by remember { mutableStateOf(false) }
  var dragX by remember { mutableFloatStateOf(0f) }
  val haptics = LocalHapticFeedback.current
  val density = LocalDensity.current.density

  val rotationYAngle by animateFloatAsState(
    targetValue = if (isFlipped) 180f else 0f,
    animationSpec = tween(durationMillis = 360),
    label = "cardRotationY",
  )

  if (filtered.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Surface(
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(
          modifier = Modifier.padding(28.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("Deck Caught Up!", style = MaterialTheme.typography.headlineSmall)
          Text(
            text = "Every flashcard in this filter is scheduled for later review.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
          TactilePillButton(
            text = "Practice All Cards",
            onClick = onShowAllCards,
            modifier = Modifier.fillMaxWidth(),
          )
        }
      }
    }
    return
  }

  val safeIndex = cardIndex.coerceIn(0, filtered.lastIndex)
  val currentCard = filtered[safeIndex]
  val currentSrs = studyState.flashcardSRS[currentCard.id]
  val answerBlocks = remember(currentCard.id) { parseMarkdownBlocks(currentCard.answer) }
  val isDark = isSystemInDarkTheme()

  val baseColor = MaterialTheme.colorScheme.surfaceContainerLow
  val hardWash = if (isDark) HardTintDark else HardTintLight
  val easyWash = if (isDark) EasyTintDark else EasyTintLight
  val swipeColor = when {
    dragX < -10f -> lerp(baseColor, hardWash, (abs(dragX) / 240f).coerceIn(0f, 0.85f))
    dragX > 10f -> lerp(baseColor, easyWash, (abs(dragX) / 240f).coerceIn(0f, 0.85f))
    else -> baseColor
  }

  fun submitRating(rating: String) {
    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
    onRate(currentCard.id, rating)
    isFlipped = false
    dragX = 0f
    cardIndex =
      if (rating == "hard") (safeIndex + 1) % filtered.size
      else if (filtered.size <= 1) 0
      else safeIndex % (filtered.size - 1).coerceAtLeast(1)
  }

  Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        TonalChip(text = currentCard.module)
        TonalChip(
          text = currentCard.projectTag,
          containerColor = MaterialTheme.colorScheme.secondaryContainer,
          contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
        )
      }
      Text(
        text = "${safeIndex + 1} / ${filtered.size}",
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }

    Surface(
      modifier = Modifier
        .fillMaxWidth()
        .weight(1f)
        .offset { IntOffset(dragX.roundToInt(), 0) }
        .graphicsLayer {
          rotationY = rotationYAngle
          rotationZ = (dragX / 36f).coerceIn(-8f, 8f)
          cameraDistance = 14f * density
        }
        .clip(RoundedCornerShape(28.dp))
        .pointerInput(currentCard.id, isFlipped) {
          detectHorizontalDragGestures(
            onDragEnd = {
              if (isFlipped && dragX < -180f) {
                submitRating("hard")
              } else if (isFlipped && dragX > 180f) {
                submitRating("easy")
              } else {
                dragX = 0f
              }
            },
            onDragCancel = { dragX = 0f },
            onHorizontalDrag = { _, dragAmount ->
              if (isFlipped) {
                dragX = (dragX + dragAmount).coerceIn(-320f, 320f)
              }
            },
          )
        }
        .clickable { isFlipped = !isFlipped },
      shape = RoundedCornerShape(28.dp),
      color = swipeColor,
    ) {
      if (rotationYAngle <= 90f) {
        Column(
          modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(22.dp),
          verticalArrangement = Arrangement.Center,
        ) {
          TonalChip(
            text = "QUESTION",
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
          )
          Spacer(modifier = Modifier.height(14.dp))
          Text(
            text = currentCard.question,
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurface,
          )
          Spacer(modifier = Modifier.height(18.dp))
          Text(
            text = "Tap card to flip",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }
      } else {
        Column(
          modifier = Modifier
            .fillMaxSize()
            .graphicsLayer { rotationY = 180f }
            .verticalScroll(rememberScrollState())
            .padding(22.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            TonalChip(
              text = "ANSWER",
              containerColor = MaterialTheme.colorScheme.secondaryContainer,
              contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            Text(
              text = when {
                dragX < -80f -> "Release -> Hard"
                dragX > 80f -> "Release -> Easy"
                else -> "Swipe <- Hard · Easy ->"
              },
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
          }
          answerBlocks.forEach { block ->
            MarkdownBlockView(block = block)
          }
        }
      }
    }

    if (!isFlipped) {
      TactilePillButton(
        text = "Show Answer",
        icon = Icons.Rounded.Flip,
        onClick = { isFlipped = true },
        modifier = Modifier.fillMaxWidth(),
      )
    } else {
      val hardLabel = SrsEngine.previewIntervalLabel(currentSrs, "hard")
      val goodLabel = SrsEngine.previewIntervalLabel(currentSrs, "medium")
      val easyLabel = SrsEngine.previewIntervalLabel(currentSrs, "easy")

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        TactilePillButton(
          text = "Hard · $hardLabel",
          containerColor = if (isDark) HardTintDark else HardTintLight,
          contentColor = if (isDark) HardOnTintDark else HardOnTintLight,
          onClick = { submitRating("hard") },
          modifier = Modifier.weight(1f),
        )
        TactilePillButton(
          text = "Good · $goodLabel",
          containerColor = if (isDark) GoodTintDark else GoodTintLight,
          contentColor = if (isDark) GoodOnTintDark else GoodOnTintLight,
          onClick = { submitRating("medium") },
          modifier = Modifier.weight(1f),
        )
        TactilePillButton(
          text = "Easy · $easyLabel",
          containerColor = if (isDark) EasyTintDark else EasyTintLight,
          contentColor = if (isDark) EasyOnTintDark else EasyOnTintLight,
          onClick = { submitRating("easy") },
          modifier = Modifier.weight(1f),
        )
      }
    }
  }
}

@Composable
private fun QuizArena(
  questions: List<QuizQuestion>,
  studyState: SyncedStudyState,
  selectedModule: String,
  sourceFilter: String?,
  unansweredOnly: Boolean,
  onAnswer: (String, String, Boolean) -> Unit,
  onResetScope: (List<String>) -> Unit,
) {
  val filtered = remember(questions, studyState.quizResults, selectedModule, sourceFilter, unansweredOnly) {
    questions.filter { q ->
      val modMatch = selectedModule == "All" || q.module == selectedModule
      val srcMatch = sourceFilter == null || q.sourceId == sourceFilter
      val ansMatch = !unansweredOnly || !studyState.quizResults.containsKey(q.id)
      modMatch && srcMatch && ansMatch
    }
  }

  var qIndex by remember(selectedModule, sourceFilter, unansweredOnly) { mutableIntStateOf(0) }

  if (filtered.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Surface(
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(
          modifier = Modifier.padding(24.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("No matching quizzes", style = MaterialTheme.typography.headlineSmall)
          Text(
            text = "Adjust filters or reset answered scenarios to practice again.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }
      }
    }
    return
  }

  val safeIndex = qIndex.coerceIn(0, filtered.lastIndex)
  val q = filtered[safeIndex]
  val attempt = studyState.quizResults[q.id]
  val isDark = isSystemInDarkTheme()

  Column(
    modifier = Modifier
      .fillMaxSize()
      .verticalScroll(rememberScrollState()),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        TonalChip(text = q.category)
        TonalChip(
          text = q.sourceId,
          containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
        )
      }
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        Text(
          text = "${safeIndex + 1} / ${filtered.size}",
          style = MaterialTheme.typography.labelLarge,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        TonalIconPill(
          icon = Icons.Rounded.Refresh,
          contentDescription = "Reset quiz attempts",
          onClick = { onResetScope(filtered.map { it.id }) },
        )
      }
    }

    Surface(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(24.dp),
      color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f),
    ) {
      Column(
        modifier = Modifier.padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        Text(
          text = "SCENARIO",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onSecondaryContainer,
        )
        Text(
          text = renderInlineMarkdown(q.scenario),
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSecondaryContainer,
        )
      }
    }

    Text(
      text = renderInlineMarkdown(q.question),
      style = MaterialTheme.typography.titleLarge,
      color = MaterialTheme.colorScheme.onSurface,
    )

    q.options.forEach { opt ->
      val isSelected = attempt?.selectedOptionId == opt.id
      val isCorrectOption = opt.id == q.correctOptionId
      val revealed = attempt != null

      val cardBg =
        when {
          !revealed -> MaterialTheme.colorScheme.surfaceContainerLow
          isCorrectOption -> if (isDark) EasyTintDark else EasyTintLight
          isSelected -> if (isDark) HardTintDark else HardTintLight
          else -> MaterialTheme.colorScheme.surfaceContainerLow
        }

      Surface(
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(20.dp))
          .clickable(enabled = !revealed) {
            onAnswer(q.id, opt.id, opt.id == q.correctOptionId)
          },
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            TonalChip(
              text = opt.id,
              containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.75f),
              contentColor = MaterialTheme.colorScheme.onSurface,
            )
            Text(
              text = renderInlineMarkdown(opt.text),
              style = MaterialTheme.typography.bodyLarge,
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.weight(1f),
            )
          }

          if (revealed && (isSelected || isCorrectOption)) {
            Text(
              text = opt.trapLabel,
              style = MaterialTheme.typography.labelMedium,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.primary,
            )
            Text(
              text = renderInlineMarkdown(opt.explanation),
              style = MaterialTheme.typography.bodyMedium,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
          }
        }
      }
    }

    if (attempt != null) {
      Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              imageVector = Icons.Rounded.CheckCircle,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
            )
            Text(
              text = "KEY TAKEAWAY",
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
          }
          Text(
            text = renderInlineMarkdown(q.takeaway),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
          )
        }
      }

      TactilePillButton(
        text = "Next Question",
        icon = Icons.AutoMirrored.Rounded.ArrowForward,
        onClick = { qIndex = (safeIndex + 1) % filtered.size },
        modifier = Modifier.fillMaxWidth(),
      )
    }
  }
}
