package dev.lakshya.aisysdesign.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.HelpOutline
import androidx.compose.material.icons.rounded.Layers
import androidx.compose.material.icons.rounded.QuestionAnswer
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.lakshya.aisysdesign.data.ExplainLayer
import dev.lakshya.aisysdesign.data.InterviewQAItem
import dev.lakshya.aisysdesign.data.RapidFireItem
import dev.lakshya.aisysdesign.data.SocraticStep
import dev.lakshya.aisysdesign.data.TimelineEvent

@Composable
fun SocraticLadderCard(
  heading: String,
  steps: List<SocraticStep>,
  bodyFontSize: TextUnit,
  clozeState: ClozeState,
) {
  val openMap = remember(heading) { mutableStateMapOf<Int, Boolean>() }
  val allOpen = steps.indices.all { openMap[it] == true }
  val haptics = LocalHapticFeedback.current

  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.weight(1f),
      ) {
        Icon(Icons.Rounded.HelpOutline, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
        Text(heading, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
      }
      TonalChip(
        text = if (allOpen) "Hide all" else "Reveal all",
        modifier = Modifier
          .clip(CircleShape)
          .clickable {
            val next = !allOpen
            steps.indices.forEach { openMap[it] = next }
          },
      )
    }

    steps.forEachIndexed { idx, step ->
      val open = openMap[idx] == true
      Surface(
        shape = RoundedCornerShape(22.dp),
        color =
          if (open) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.28f)
          else MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(22.dp))
          .clickable {
            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            openMap[idx] = !open
          },
      ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            TonalChip(
              text = "Q${idx + 1}",
              containerColor = MaterialTheme.colorScheme.primaryContainer,
              contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
              text = step.question,
              style = MaterialTheme.typography.titleMedium,
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.weight(1f),
            )
            Icon(
              imageVector = if (open) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
          }

          if (open) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
            val blocks = remember(step.answerMarkdown) { parseMarkdownBlocks(step.answerMarkdown) }
            blocks.forEach { b ->
              MarkdownBlockView(block = b, bodyFontSize = bodyFontSize, clozeState = clozeState)
            }
          }
        }
      }
    }
  }
}

@Composable
fun ExplainInLayersCard(
  heading: String,
  layers: List<ExplainLayer>,
  bodyFontSize: TextUnit,
  clozeState: ClozeState,
) {
  val selectedIdx = remember(heading) { mutableIntStateOf(0) }
  val activeLayer = layers.getOrNull(selectedIdx.intValue) ?: layers.first()
  val blocks = remember(activeLayer.bodyMarkdown) { parseMarkdownBlocks(activeLayer.bodyMarkdown) }

  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Icon(Icons.Rounded.Layers, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
      Text(heading, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
    }

    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
      layers.forEachIndexed { idx, layer ->
        SegmentedButton(
          selected = selectedIdx.intValue == idx,
          onClick = { selectedIdx.intValue = idx },
          shape = SegmentedButtonDefaults.itemShape(index = idx, count = layers.size),
        ) {
          Text(layer.shortLabel, maxLines = 1)
        }
      }
    }

    Surface(
      shape = RoundedCornerShape(22.dp),
      color = MaterialTheme.colorScheme.surfaceContainerLow,
      modifier = Modifier.fillMaxWidth(),
    ) {
      Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
          text = activeLayer.label,
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.primary,
        )
        blocks.forEach { b ->
          MarkdownBlockView(block = b, bodyFontSize = bodyFontSize, clozeState = clozeState)
        }
      }
    }
  }
}

@Composable
fun TimestampedTimelineCard(
  heading: String,
  events: List<TimelineEvent>,
  takeawayMarkdown: String?,
  bodyFontSize: TextUnit,
  clozeState: ClozeState,
) {
  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Icon(Icons.Rounded.Schedule, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
      Text(heading, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
    }

    Surface(
      shape = RoundedCornerShape(24.dp),
      color = MaterialTheme.colorScheme.surfaceContainerLow,
      modifier = Modifier.fillMaxWidth(),
    ) {
      Column(
        modifier = Modifier.padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
      ) {
        events.forEach { ev ->
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
          ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
              Box(
                modifier = Modifier
                  .padding(top = 6.dp)
                  .size(10.dp)
                  .clip(CircleShape)
                  .background(MaterialTheme.colorScheme.primary),
              )
            }
            Column(
              modifier = Modifier.weight(1f),
              verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
              Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceContainerHigh,
              ) {
                Text(
                  text = ev.time,
                  fontFamily = FontFamily.Monospace,
                  style = MaterialTheme.typography.labelMedium,
                  color = MaterialTheme.colorScheme.primary,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                )
              }
              Text(
                text = renderInlineMarkdown(ev.bodyMarkdown, clozeState = clozeState),
                style = MaterialTheme.typography.bodyLarge.copy(
                  fontSize = bodyFontSize * 0.95f,
                  lineHeight = bodyFontSize * 1.45f,
                ),
                color = MaterialTheme.colorScheme.onSurface,
              )
            }
          }
        }
      }
    }

    if (!takeawayMarkdown.isNullOrBlank()) {
      Surface(
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
          val blocks = remember(takeawayMarkdown) { parseMarkdownBlocks(takeawayMarkdown) }
          blocks.forEach { b ->
            MarkdownBlockView(block = b, bodyFontSize = bodyFontSize * 0.95f, clozeState = clozeState)
          }
        }
      }
    }
  }
}

@Composable
fun InterviewQAGroupCard(
  items: List<InterviewQAItem>,
  bodyFontSize: TextUnit,
  clozeState: ClozeState,
) {
  val openMap = remember(items.firstOrNull()?.id) {
    mutableStateMapOf<String, Boolean>().apply {
      items.firstOrNull()?.let { put(it.id, true) }
    }
  }
  val allOpen = items.all { openMap[it.id] == true }

  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
      ) {
        Icon(Icons.Rounded.QuestionAnswer, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
        Text("${items.size} Interview Questions", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
      TonalChip(
        text = if (allOpen) "Collapse all" else "Expand all",
        modifier = Modifier
          .clip(CircleShape)
          .clickable {
            val next = !allOpen
            items.forEach { openMap[it.id] = next }
          },
      )
    }

    items.forEach { item ->
      val open = openMap[item.id] == true
      Surface(
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(22.dp))
          .clickable { openMap[item.id] = !open },
      ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            Text(
              text = item.title,
              style = MaterialTheme.typography.titleMedium,
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.weight(1f),
            )
            Icon(
              imageVector = if (open) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
          }

          if (open) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
            val blocks = remember(item.bodyMarkdown) { parseMarkdownBlocks(item.bodyMarkdown) }
            blocks.forEach { b ->
              MarkdownBlockView(block = b, bodyFontSize = bodyFontSize, clozeState = clozeState)
            }
          }
        }
      }
    }
  }
}

@Composable
fun RapidFireCard(
  heading: String,
  items: List<RapidFireItem>,
  bodyFontSize: TextUnit,
  clozeState: ClozeState,
) {
  val revealed = remember(heading) { mutableStateMapOf<Int, Boolean>() }
  val allRevealed = items.indices.all { revealed[it] == true }

  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.weight(1f),
      ) {
        Icon(Icons.Rounded.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary, modifier = Modifier.size(18.dp))
        Text(heading, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
      }
      TonalChip(
        text = if (allRevealed) "Hide all" else "Reveal all",
        modifier = Modifier
          .clip(CircleShape)
          .clickable {
            val next = !allRevealed
            items.indices.forEach { revealed[it] = next }
          },
      )
    }

    Surface(
      shape = RoundedCornerShape(24.dp),
      color = MaterialTheme.colorScheme.surfaceContainerLow,
      modifier = Modifier.fillMaxWidth(),
    ) {
      Column {
        items.forEachIndexed { idx, item ->
          val open = revealed[idx] == true
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .clickable { revealed[idx] = !open }
              .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.Top,
            ) {
              Text(
                text = item.prompt,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f).padding(end = 10.dp),
              )
              Text(
                text = if (open) "Hide" else "Reveal",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
              )
            }
            if (open) {
              Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                  modifier = Modifier
                    .width(3.dp)
                    .padding(vertical = 2.dp)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)),
                )
                Text(
                  text = renderInlineMarkdown(item.answer, clozeState = clozeState),
                  style = MaterialTheme.typography.bodyMedium.copy(
                    fontSize = bodyFontSize * 0.92f,
                    lineHeight = bodyFontSize * 1.4f,
                  ),
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
              }
            }
          }
          if (idx < items.lastIndex) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
          }
        }
      }
    }
  }
}
