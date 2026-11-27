package dev.lakshya.aisysdesign.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.PortalCatalog
import dev.lakshya.aisysdesign.data.model.CaseStudyProblem
import dev.lakshya.aisysdesign.data.model.ResumeProject
import dev.lakshya.aisysdesign.data.model.RoadmapItem
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import dev.lakshya.aisysdesign.ui.components.TonalChip

private enum class LibraryTab(val label: String) {
  PLAN("10-Week Plan"),
  FUNDAMENTALS("Fundamentals"),
  SESSIONS("Sessions"),
  PROBLEMS("Case Studies"),
  PROJECTS("Projects"),
  ROLES("Target Roles"),
  BOOKS("Books"),
  HIGHLIGHTS("Notes & Highlights"),
  FORMULAS("Formulas"),
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LibraryScreen(
  catalog: PortalCatalog,
  studyState: SyncedStudyState,
  isCompleted: (String) -> Boolean,
  onToggleCompleted: (String) -> Unit,
  onOpenRoadmapItem: (RoadmapItem) -> Unit,
  onOpenFundamental: (String) -> Unit,
  onOpenSession: (String) -> Unit,
  onOpenProblem: (CaseStudyProblem) -> Unit,
  onOpenProject: (ResumeProject) -> Unit,
  onRemoveHighlight: (String) -> Unit,
) {
  var selectedTab by remember { mutableStateOf(LibraryTab.PLAN) }
  var planViewMode by remember { mutableIntStateOf(0) } // 0 = Weeks, 1 = Modules
  var query by remember { mutableStateOf("") }
  val q = query.trim().lowercase()
  val context = LocalContext.current

  Column(
    modifier = Modifier
      .fillMaxSize()
      .statusBarsPadding()
      .padding(top = 12.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    OutlinedTextField(
      value = query,
      onValueChange = { query = it },
      placeholder = { Text("Search sessions, roles, problems, books...") },
      leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
      trailingIcon = {
        if (query.isNotEmpty()) {
          IconButton(onClick = { query = "" }) {
            Icon(Icons.Rounded.Close, contentDescription = "Clear")
          }
        }
      },
      singleLine = true,
      shape = CircleShape,
      colors = OutlinedTextFieldDefaults.colors(
        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainerLow,
        focusedContainerColor = MaterialTheme.colorScheme.surfaceContainerLow,
        unfocusedBorderColor = MaterialTheme.colorScheme.surfaceContainerLow,
        focusedBorderColor = MaterialTheme.colorScheme.primary,
      ),
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 20.dp),
    )

    Row(
      modifier = Modifier
        .fillMaxWidth()
        .horizontalScroll(rememberScrollState())
        .padding(horizontal = 20.dp),
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      LibraryTab.entries.forEach { tab ->
        val selected = tab == selectedTab
        Surface(
          shape = CircleShape,
          color =
            if (selected) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.surfaceContainerHigh,
          modifier = Modifier
            .clip(CircleShape)
            .clickable { selectedTab = tab },
        ) {
          Text(
            text = tab.label,
            style = MaterialTheme.typography.labelLarge,
            color =
              if (selected) MaterialTheme.colorScheme.onPrimary
              else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp),
          )
        }
      }
    }

    LazyColumn(
      modifier = Modifier.fillMaxSize(),
      contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 4.dp, bottom = 112.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      when (selectedTab) {
        LibraryTab.PLAN -> {
          item {
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
              listOf("Timeline (Weeks)", "Modules (M0–M5)").forEachIndexed { idx, label ->
                SegmentedButton(
                  selected = planViewMode == idx,
                  onClick = { planViewMode = idx },
                  shape = SegmentedButtonDefaults.itemShape(index = idx, count = 2),
                ) {
                  Text(label)
                }
              }
            }
          }

          if (planViewMode == 0) {
            val weekGroups = catalog.curriculum.weeks.mapNotNull { w ->
              val items = catalog.sequenceItems.filter {
                it.week == w.week &&
                  (q.isEmpty() || it.title.lowercase().contains(q) || it.subtitle.lowercase().contains(q))
              }
              if (items.isEmpty()) null else w to items
            }
            items(weekGroups, key = { it.first.week }) { (week, weekItems) ->
              val doneCount = weekItems.count { isCompleted(it.id) }
              Surface(
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surfaceContainerLow,
                modifier = Modifier.fillMaxWidth(),
              ) {
                Column(
                  modifier = Modifier.padding(16.dp),
                  verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                  ) {
                    Text(
                      text = "Week ${week.week} · Phase ${week.phase}",
                      style = MaterialTheme.typography.titleMedium,
                      color = MaterialTheme.colorScheme.onSurface,
                    )
                    TonalChip(
                      text = "$doneCount / ${weekItems.size}",
                      containerColor = MaterialTheme.colorScheme.primaryContainer,
                      contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                  }
                  Text(
                    text = week.focus,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                  )
                  weekItems.forEach { item ->
                    LibraryRowItem(
                      title = item.shortTitle,
                      subtitle = "${item.typeLabel} · ${item.readTime}",
                      badge = if (item.status == "written") "Ready" else "Outline",
                      completed = isCompleted(item.id),
                      onToggle = { onToggleCompleted(item.id) },
                      onClick = { onOpenRoadmapItem(item) },
                    )
                  }
                }
              }
            }
          } else {
            // Module 0: Distributed Fundamentals
            val fundTopics = catalog.fundamentals.topics.filter {
              q.isEmpty() || it.title.lowercase().contains(q) || it.aiTieIn.lowercase().contains(q)
            }
            if (fundTopics.isNotEmpty()) {
              item(key = "mod-0") {
                val doneCount = fundTopics.count { isCompleted(it.id) }
                val frac = doneCount.toFloat() / fundTopics.size.coerceAtLeast(1)
                Surface(
                  shape = RoundedCornerShape(24.dp),
                  color = MaterialTheme.colorScheme.surfaceContainerLow,
                  modifier = Modifier.fillMaxWidth(),
                ) {
                  Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                      modifier = Modifier.fillMaxWidth(),
                      horizontalArrangement = Arrangement.SpaceBetween,
                      verticalAlignment = Alignment.CenterVertically,
                    ) {
                      Text(catalog.fundamentals.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                      TonalChip(text = "$doneCount / ${fundTopics.size}")
                    }
                    LinearProgressIndicator(
                      progress = { frac },
                      modifier = Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),
                    )
                    fundTopics.forEach { t ->
                      LibraryRowItem(
                        title = "T${t.number}: ${t.title}",
                        subtitle = t.readTime,
                        badge = if (t.status == "written") "Ready" else "Outline",
                        completed = isCompleted(t.id),
                        onToggle = { onToggleCompleted(t.id) },
                        onClick = { onOpenFundamental(t.id) },
                      )
                    }
                  }
                }
              }
            }

            // Modules 1..5
            val filteredModules = catalog.curriculum.modules.mapNotNull { mod ->
              val sess = mod.sessions.filter {
                q.isEmpty() || it.title.lowercase().contains(q) || it.projectTieIn.lowercase().contains(q)
              }
              if (sess.isEmpty()) null else mod to sess
            }
            items(filteredModules, key = { it.first.id }) { (mod, sess) ->
              val doneCount = sess.count { isCompleted(it.id) }
              val frac = doneCount.toFloat() / sess.size.coerceAtLeast(1)
              Surface(
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surfaceContainerLow,
                modifier = Modifier.fillMaxWidth(),
              ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                  ) {
                    Text(mod.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    TonalChip(text = "$doneCount / ${sess.size}")
                  }
                  Text(mod.focus, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                  LinearProgressIndicator(
                    progress = { frac },
                    modifier = Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),
                  )
                  sess.forEach { s ->
                    LibraryRowItem(
                      title = "S${s.number}: ${s.title}",
                      subtitle = "Week ${s.week} · ${s.estimatedReadTime}",
                      badge = if (s.status == "written") "Ready" else "Outline",
                      completed = isCompleted(s.id),
                      onToggle = { onToggleCompleted(s.id) },
                      onClick = { onOpenSession(s.id) },
                    )
                  }
                }
              }
            }
          }
        }

        LibraryTab.FUNDAMENTALS -> {
          val filtered = catalog.fundamentals.topics.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.aiTieIn.lowercase().contains(q)
          }
          items(filtered, key = { it.id }) { t ->
            LibraryCardItem(
              title = "Topic ${t.number}: ${t.title}",
              subtitle = t.aiTieIn,
              meta = t.readTime,
              badge = if (t.status == "written") "Ready" else "Outline",
              completed = isCompleted(t.id),
              onToggle = { onToggleCompleted(t.id) },
              onClick = { onOpenFundamental(t.id) },
            )
          }
        }

        LibraryTab.SESSIONS -> {
          val filtered = catalog.sessions.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.projectTieIn.lowercase().contains(q)
          }.sortedBy { it.number }
          items(filtered, key = { it.id }) { s ->
            LibraryCardItem(
              title = "S${s.number.toString().padStart(2, '0')}: ${s.title}",
              subtitle = s.projectTieIn,
              meta = "Week ${s.week} · ${s.estimatedReadTime}",
              badge = if (s.status == "written") "Ready" else "Outline",
              completed = isCompleted(s.id),
              onToggle = { onToggleCompleted(s.id) },
              onClick = { onOpenSession(s.id) },
            )
          }
        }

        LibraryTab.PROBLEMS -> {
          val filtered = catalog.problems.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.prompt.lowercase().contains(q)
          }
          items(filtered, key = { it.id }) { p ->
            LibraryCardItem(
              title = p.title,
              subtitle = p.resumeTie.ifBlank { p.prompt },
              meta = "Week ${p.week} · ${p.difficulty}",
              badge = p.tier,
              completed = isCompleted(p.id) || isCompleted("problem:${p.id}"),
              onToggle = { onToggleCompleted("problem:${p.id}") },
              onClick = { onOpenProblem(p) },
            )
          }
        }

        LibraryTab.PROJECTS -> {
          val filtered = catalog.projects.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.company.lowercase().contains(q)
          }
          items(filtered, key = { it.id }) { proj ->
            Surface(
              shape = RoundedCornerShape(24.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .clickable { onOpenProject(proj) },
            ) {
              Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
              ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                  TonalChip(
                    text = proj.company,
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                  )
                  proj.impactMetrics.firstOrNull()?.let { m ->
                    TonalChip(
                      text = "${m.value} ${m.label}",
                      containerColor = MaterialTheme.colorScheme.secondaryContainer,
                      contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                  }
                }
                Text(
                  text = proj.title,
                  style = MaterialTheme.typography.titleLarge,
                  color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                  text = proj.subtitle,
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
              }
            }
          }
        }

        LibraryTab.ROLES -> {
          if (catalog.roles.intro.isNotBlank() && q.isEmpty()) {
            item {
              Surface(
                shape = RoundedCornerShape(22.dp),
                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f),
                modifier = Modifier.fillMaxWidth(),
              ) {
                Text(
                  text = catalog.roles.intro,
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSecondaryContainer,
                  modifier = Modifier.padding(16.dp),
                )
              }
            }
          }
          val filteredRoles = catalog.roles.roles.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.tagline.lowercase().contains(q)
          }
          items(filteredRoles, key = { it.id }) { role ->
            Surface(
              shape = RoundedCornerShape(24.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier.fillMaxWidth(),
            ) {
              Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
              ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                  if (role.priority.isNotBlank()) {
                    TonalChip(
                      text = role.priority,
                      containerColor = MaterialTheme.colorScheme.primaryContainer,
                      contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                  }
                  if (role.fit.isNotBlank()) TonalChip(text = role.fit)
                }
                Text(role.title, style = MaterialTheme.typography.titleLarge)
                Text(role.tagline, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

                if (role.weights.isNotEmpty()) {
                  FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    role.weights.entries.forEach { (modKey, weight) ->
                      val weightTag = when (weight) {
                        3 -> "Core"
                        2 -> "Solid"
                        1 -> "Skim"
                        else -> "Skip"
                      }
                      TonalChip(text = "$modKey: $weightTag")
                    }
                  }
                }

                if (role.gapsToClose.isNotEmpty()) {
                  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Gaps to Close", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                    role.gapsToClose.forEach { g ->
                      Text("• $g", style = MaterialTheme.typography.bodyMedium)
                    }
                  }
                }

                if (role.mustDo.isNotEmpty()) {
                  Text("Must-Do Sessions (tap to study)", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                  FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    role.mustDo.forEach { sessId ->
                      Surface(
                        shape = CircleShape,
                        color = if (isCompleted(sessId)) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh,
                        modifier = Modifier
                          .clip(CircleShape)
                          .clickable { onOpenSession(sessId) },
                      ) {
                        Text(
                          text = sessId.replace("session-", "S"),
                          style = MaterialTheme.typography.labelMedium,
                          modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        )
                      }
                    }
                  }
                }

                if (role.resumeFraming.isNotBlank()) {
                  Text(
                    text = "Pitch: ${role.resumeFraming}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                  )
                }
              }
            }
          }
        }

        LibraryTab.BOOKS -> {
          val filteredBooks = catalog.resources.foundationalBooks.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.why.lowercase().contains(q)
          }
          items(filteredBooks) { book ->
            Surface(
              shape = RoundedCornerShape(22.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .clickable(enabled = !book.url.isNullOrBlank()) {
                  book.url?.let { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) }
                },
            ) {
              Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
              ) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  TonalChip(text = book.type.uppercase())
                  if (!book.url.isNullOrBlank()) {
                    Icon(
                      imageVector = Icons.Rounded.OpenInNew,
                      contentDescription = "Open link",
                      tint = MaterialTheme.colorScheme.primary,
                      modifier = Modifier.size(16.dp),
                    )
                  }
                }
                Text(book.title, style = MaterialTheme.typography.titleMedium)
                Text(book.why, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
              }
            }
          }
        }

        LibraryTab.HIGHLIGHTS -> {
          val hls = studyState.highlights.filter {
            q.isEmpty() || it.text.lowercase().contains(q) || (it.note?.lowercase()?.contains(q) == true)
          }
          val notes = studyState.scratchpadNotes.entries.filter {
            it.value.isNotBlank() && (q.isEmpty() || it.key.lowercase().contains(q) || it.value.lowercase().contains(q))
          }
          if (hls.isEmpty() && notes.isEmpty()) {
            item {
              Text(
                text = "No saved highlights or scratchpad notes yet. Long-press any paragraph in the Reader to highlight.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
          }
          items(hls, key = { it.id }) { hl ->
            Surface(
              shape = RoundedCornerShape(22.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier.fillMaxWidth(),
            ) {
              Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
              ) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  TonalChip(text = hl.sourceTitle, modifier = Modifier.weight(1f, fill = false))
                  IconButton(onClick = { onRemoveHighlight(hl.id) }, modifier = Modifier.size(32.dp)) {
                    Icon(
                      imageVector = Icons.Rounded.DeleteOutline,
                      contentDescription = "Delete highlight",
                      tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                  }
                }
                Text(
                  text = "\"${hl.text}\"",
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSurface,
                )
                if (!hl.note.isNullOrBlank()) {
                  Text(
                    text = hl.note,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                  )
                }
              }
            }
          }
          items(notes.toList(), key = { "note-${it.key}" }) { (sourceId, noteText) ->
            Surface(
              shape = RoundedCornerShape(22.dp),
              color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f),
              modifier = Modifier.fillMaxWidth(),
            ) {
              Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
              ) {
                TonalChip(text = "Notebook · $sourceId")
                Text(
                  text = noteText,
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSurface,
                )
              }
            }
          }
        }

        LibraryTab.FORMULAS -> {
          val filtered = catalog.curriculum.quickRevisionMetrics.filter {
            q.isEmpty() || it.title.lowercase().contains(q) || it.formula.lowercase().contains(q)
          }
          items(filtered, key = { it.id }) { metric ->
            Surface(
              shape = RoundedCornerShape(22.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier.fillMaxWidth(),
            ) {
              Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
              ) {
                TonalChip(text = metric.category)
                Text(
                  text = metric.title,
                  style = MaterialTheme.typography.titleMedium,
                  color = MaterialTheme.colorScheme.onSurface,
                )
                Box(
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceContainerHigh)
                    .padding(12.dp),
                ) {
                  Text(
                    text = metric.formula,
                    fontFamily = FontFamily.Monospace,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                  )
                }
                Text(
                  text = metric.detail,
                  style = MaterialTheme.typography.bodyMedium,
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

@Composable
private fun LibraryRowItem(
  title: String,
  subtitle: String,
  badge: String,
  completed: Boolean,
  onToggle: () -> Unit,
  onClick: () -> Unit,
) {
  val haptics = LocalHapticFeedback.current
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(16.dp))
      .background(MaterialTheme.colorScheme.surface)
      .clickable(onClick = onClick)
      .padding(horizontal = 12.dp, vertical = 10.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    IconButton(
      onClick = {
        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        onToggle()
      },
      modifier = Modifier.size(30.dp),
    ) {
      Icon(
        imageVector = if (completed) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
        contentDescription = "Toggle completion",
        tint = if (completed) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }
    Column(modifier = Modifier.weight(1f)) {
      Text(
        text = title,
        style = MaterialTheme.typography.bodyLarge,
        fontWeight = FontWeight.Medium,
        color = MaterialTheme.colorScheme.onSurface,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
      Text(
        text = subtitle,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }
    TonalChip(text = badge)
  }
}

@Composable
private fun LibraryCardItem(
  title: String,
  subtitle: String,
  meta: String,
  badge: String,
  completed: Boolean,
  onToggle: () -> Unit,
  onClick: () -> Unit,
) {
  val haptics = LocalHapticFeedback.current
  Surface(
    shape = RoundedCornerShape(22.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(22.dp))
      .clickable(onClick = onClick),
  ) {
    Row(
      modifier = Modifier.padding(16.dp),
      verticalAlignment = Alignment.Top,
      horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      IconButton(
        onClick = {
          haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
          onToggle()
        },
        modifier = Modifier.size(32.dp),
      ) {
        Icon(
          imageVector = if (completed) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
          contentDescription = "Toggle completion",
          tint = if (completed) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
      Column(
        modifier = Modifier.weight(1f),
        verticalArrangement = Arrangement.spacedBy(5.dp),
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = meta,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
          )
          if (badge.isNotBlank()) {
            TonalChip(text = badge)
          }
        }
        Text(
          text = title,
          style = MaterialTheme.typography.titleMedium,
          color = MaterialTheme.colorScheme.onSurface,
        )
        if (subtitle.isNotBlank()) {
          Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
          )
        }
      }
    }
  }
}
