package dev.lakshya.aisysdesign.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Checklist
import androidx.compose.material.icons.rounded.CloudDone
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Style
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.PortalCatalog
import dev.lakshya.aisysdesign.data.model.RoadmapItem
import dev.lakshya.aisysdesign.data.model.SyncUiState
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.ui.MockTimerState
import dev.lakshya.aisysdesign.ui.RecommendationMode
import dev.lakshya.aisysdesign.ui.components.TactilePillButton
import dev.lakshya.aisysdesign.ui.components.TonalChip
import dev.lakshya.aisysdesign.ui.components.TonalIconPill
import dev.lakshya.aisysdesign.ui.components.WavyProgressHeroCard

@Composable
fun TodayScreen(
  catalog: PortalCatalog,
  studyState: SyncedStudyState,
  syncUi: SyncUiState,
  timerState: MockTimerState,
  streakDays: Int,
  activeNextItem: RoadmapItem,
  recommendationMode: RecommendationMode,
  dueCardsCount: Int,
  isCompleted: (String) -> Boolean,
  onChangeMode: (RecommendationMode) -> Unit,
  onOpenItem: (RoadmapItem) -> Unit,
  onToggleItemCompleted: (String) -> Unit,
  onOpenRecallFlashcards: () -> Unit,
  onOpenPocketTools: () -> Unit,
  onOpenSyncSheet: () -> Unit,
  onOpenSettings: () -> Unit,
) {
  var showWeekSheet by remember { mutableStateOf(false) }
  val clipboard = LocalClipboardManager.current
  val context = LocalContext.current

  val sequence = catalog.sequenceItems
  val totalDone = sequence.count { isCompleted(it.id) }
  val fundDone = catalog.fundamentals.topics.count { isCompleted(it.id) }
  val sessDone = catalog.sessions.count { isCompleted(it.id) }
  val probDone = catalog.problems.count { isCompleted(it.id) || isCompleted("problem:${it.id}") }

  val currentWeekItems = remember(sequence, activeNextItem.week) {
    sequence.filter { it.week == activeNextItem.week }
  }
  val currentWeekDone = currentWeekItems.count { isCompleted(it.id) }

  LazyColumn(
    modifier = Modifier
      .fillMaxSize()
      .statusBarsPadding(),
    contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 112.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp),
  ) {
    // 1. Minimal Top Bar
    item {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Column(modifier = Modifier.weight(1f)) {
          Text(
            text = "Week ${activeNextItem.week} · Phase ${activeNextItem.phaseNumber}",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
          )
          Text(
            text = "Hey ${catalog.curriculum.candidate.name.substringBefore(" ")} · 100x Prep",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
          TonalIconPill(
            icon = Icons.Rounded.Calculate,
            contentDescription = "Mock timer and capacity math",
            onClick = onOpenPocketTools,
          )
          TonalIconPill(
            icon = when {
              syncUi.isSyncing -> Icons.Rounded.CloudSync
              syncUi.isConfigured -> Icons.Rounded.CloudDone
              else -> Icons.Rounded.CloudOff
            },
            contentDescription = "GitHub Gist Sync",
            badgeDotColor = when {
              syncUi.syncError != null -> MaterialTheme.colorScheme.error
              syncUi.isConfigured -> Color(0xFF2E9D5B)
              else -> null
            },
            onClick = onOpenSyncSheet,
          )
          TonalIconPill(
            icon = Icons.Rounded.Tune,
            contentDescription = "Preferences",
            onClick = onOpenSettings,
          )
        }
      }
    }

    // Live Persistent Mock Timer Banner (if active/paused)
    if (timerState.isActiveOrModified) {
      item {
        Surface(
          shape = CircleShape,
          color = MaterialTheme.colorScheme.tertiaryContainer,
          modifier = Modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .clickable(onClick = onOpenPocketTools),
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
              Icon(
                imageVector = Icons.Rounded.Timer,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onTertiaryContainer,
                modifier = Modifier.size(18.dp),
              )
              Text(
                text = "${timerState.formattedTime} · ${timerState.currentPhase.label}",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onTertiaryContainer,
              )
            }
            Text(
              text = if (timerState.isRunning) "Live" else "Paused",
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.onTertiaryContainer,
            )
          }
        }
      }
    }

    // 2. Buckwheat-style Wavy Progress Hero Card
    item {
      WavyProgressHeroCard(
        completedItems = totalDone,
        totalItems = sequence.size,
        fundamentalsDone = fundDone,
        fundamentalsTotal = catalog.fundamentals.topics.size,
        sessionsDone = sessDone,
        sessionsTotal = catalog.sessions.size,
        problemsDone = probDone,
        problemsTotal = catalog.problems.size,
        streakDays = streakDays,
        onClick = { showWeekSheet = true },
      )
    }

    // 3. Single-Focus "Next Up" Hero Card
    item {
      Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
      ) {
        Column(
          modifier = Modifier.padding(20.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
              TonalChip(
                text = "NEXT UP",
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
              )
              TonalChip(
                text = if (activeNextItem.status == "written") "Ready" else "Outline",
                containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
                contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }

            Row(
              modifier = Modifier
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceContainerHigh)
                .padding(3.dp),
              horizontalArrangement = Arrangement.spacedBy(2.dp),
            ) {
              listOf(
                RecommendationMode.ROADMAP to "10-Week",
                RecommendationMode.READY to "Ready",
              ).forEach { (mode, label) ->
                val selected = mode == recommendationMode
                Box(
                  modifier = Modifier
                    .clip(CircleShape)
                    .background(
                      if (selected) MaterialTheme.colorScheme.primary
                      else Color.Transparent
                    )
                    .clickable { onChangeMode(mode) }
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                ) {
                  Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    color =
                      if (selected) MaterialTheme.colorScheme.onPrimary
                      else MaterialTheme.colorScheme.onSurfaceVariant,
                  )
                }
              }
            }
          }

          Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
              text = "${activeNextItem.typeLabel} · ${activeNextItem.readTime}",
              style = MaterialTheme.typography.labelMedium,
              color = MaterialTheme.colorScheme.primary,
            )
            Text(
              text = activeNextItem.title,
              style = MaterialTheme.typography.headlineSmall,
              color = MaterialTheme.colorScheme.onSurface,
            )
            if (activeNextItem.subtitle.isNotBlank()) {
              Text(
                text = activeNextItem.subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
              )
            }
          }

          Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth(),
          ) {
            Text(
              text = "Week ${activeNextItem.week} goal: ${activeNextItem.weekMilestone}",
              style = MaterialTheme.typography.bodyMedium,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
              modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            )
          }

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
          ) {
            TonalIconPill(
              icon = Icons.Rounded.ContentCopy,
              contentDescription = "Copy Socratic AI prompt",
              onClick = {
                clipboard.setText(AnnotatedString(activeNextItem.studyPrompt))
                Toast.makeText(context, "Socratic study prompt copied", Toast.LENGTH_SHORT).show()
              },
            )
            TactilePillButton(
              text = "Continue Study",
              icon = Icons.AutoMirrored.Rounded.ArrowForward,
              onClick = { onOpenItem(activeNextItem) },
              modifier = Modifier.weight(1f),
            )
          }
        }
      }
    }

    // 4. Two Calm Secondary Tonal Pills
    item {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Surface(
          modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(24.dp))
            .clickable(onClick = onOpenRecallFlashcards),
          shape = RoundedCornerShape(24.dp),
          color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f),
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              imageVector = Icons.Rounded.Style,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSecondaryContainer,
              modifier = Modifier.size(20.dp),
            )
            Text(
              text = if (dueCardsCount > 0) "$dueCardsCount Due Cards" else "All Caught Up",
              style = MaterialTheme.typography.titleMedium,
              color = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            Text(
              text = "Spaced repetition",
              style = MaterialTheme.typography.bodyMedium,
              color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f),
            )
          }
        }

        Surface(
          modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(24.dp))
            .clickable { showWeekSheet = true },
          shape = RoundedCornerShape(24.dp),
          color = MaterialTheme.colorScheme.surfaceContainerLow,
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              imageVector = Icons.Rounded.Checklist,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(20.dp),
            )
            Text(
              text = "Week ${activeNextItem.week} List",
              style = MaterialTheme.typography.titleMedium,
              color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
              text = "$currentWeekDone of ${currentWeekItems.size} done",
              style = MaterialTheme.typography.bodyMedium,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
          }
        }
      }
    }
  }

  if (showWeekSheet) {
    WeekChecklistSheet(
      week = activeNextItem.week,
      weekFocus = activeNextItem.weekFocus,
      items = currentWeekItems,
      isCompleted = isCompleted,
      onToggleCompleted = onToggleItemCompleted,
      onOpenItem = {
        showWeekSheet = false
        onOpenItem(it)
      },
      onDismiss = { showWeekSheet = false },
    )
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WeekChecklistSheet(
  week: Int,
  weekFocus: String,
  items: List<RoadmapItem>,
  isCompleted: (String) -> Boolean,
  onToggleCompleted: (String) -> Unit,
  onOpenItem: (RoadmapItem) -> Unit,
  onDismiss: () -> Unit,
) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
  val haptics = LocalHapticFeedback.current

  ModalBottomSheet(
    onDismissRequest = onDismiss,
    sheetState = sheetState,
    shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    containerColor = MaterialTheme.colorScheme.surface,
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .navigationBarsPadding()
        .padding(horizontal = 20.dp)
        .padding(bottom = 24.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text(
        text = "Week $week Checklist",
        style = MaterialTheme.typography.headlineSmall,
      )
      Text(
        text = weekFocus,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )

      LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth().height(380.dp),
      ) {
        items(items, key = { it.id }) { item ->
          val done = isCompleted(item.id)
          Surface(
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(20.dp))
              .clickable { onOpenItem(item) },
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceContainerLow,
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
              IconButton(
                onClick = {
                  haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                  onToggleCompleted(item.id)
                },
                modifier = Modifier.size(32.dp),
              ) {
                Icon(
                  imageVector =
                    if (done) Icons.Rounded.CheckCircle
                    else Icons.Rounded.RadioButtonUnchecked,
                  contentDescription = "Toggle complete",
                  tint =
                    if (done) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
              }
              Column(modifier = Modifier.weight(1f)) {
                Text(
                  text = item.shortTitle,
                  style = MaterialTheme.typography.titleMedium,
                  fontWeight = FontWeight.Medium,
                  color = MaterialTheme.colorScheme.onSurface,
                  maxLines = 2,
                  overflow = TextOverflow.Ellipsis,
                )
                Text(
                  text = "${item.typeLabel} · ${item.readTime}",
                  style = MaterialTheme.typography.labelMedium,
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
              }
            }
          }
        }
      }
    }
  }
}
