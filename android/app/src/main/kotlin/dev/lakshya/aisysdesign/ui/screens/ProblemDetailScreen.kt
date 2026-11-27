package dev.lakshya.aisysdesign.ui.screens

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.model.CaseStudyProblem
import dev.lakshya.aisysdesign.ui.MockTimerState
import dev.lakshya.aisysdesign.ui.components.MermaidDiagramCard
import dev.lakshya.aisysdesign.ui.components.TactilePillButton
import dev.lakshya.aisysdesign.ui.components.TonalChip
import dev.lakshya.aisysdesign.ui.components.TonalIconPill

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProblemDetailScreen(
  problem: CaseStudyProblem,
  isCompleted: Boolean,
  timerState: MockTimerState,
  onBack: () -> Unit,
  onToggleCompleted: () -> Unit,
  onStartTimer: () -> Unit,
) {
  val clipboard = LocalClipboardManager.current
  val context = LocalContext.current

  Scaffold(
    containerColor = MaterialTheme.colorScheme.background,
    topBar = {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .statusBarsPadding()
          .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
      ) {
        IconButton(onClick = onBack) {
          Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
        }
        Text(
          text = "Case Study",
          style = MaterialTheme.typography.titleLarge,
          modifier = Modifier.weight(1f),
        )
        TonalIconPill(
          icon = Icons.Rounded.ContentCopy,
          contentDescription = "Copy mock prompt",
          onClick = {
            val mockPrompt =
              "You are a Principal AI Architect interviewing me for a Senior AI Engineer position. Prompt: \"${problem.prompt}\". Wait for my clarifying questions and back-of-the-envelope estimation before moving to architecture."
            clipboard.setText(AnnotatedString(mockPrompt))
            Toast.makeText(context, "Mock interviewer prompt copied", Toast.LENGTH_SHORT).show()
          },
        )
        TonalIconPill(
          icon = Icons.Rounded.Timer,
          label = if (timerState.isRunning) timerState.formattedTime else "45m",
          contentDescription = "Start 45m mock timer",
          onClick = onStartTimer,
        )
      }
    },
    bottomBar = {
      Surface(color = MaterialTheme.colorScheme.surfaceContainerLow) {
        BoxBottomBar(
          isCompleted = isCompleted,
          onToggleCompleted = onToggleCompleted,
        )
      }
    },
  ) { innerPadding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding),
      contentPadding = PaddingValues(horizontal = 20.dp, vertical = 14.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
      item {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          TonalChip(
            text = problem.tier.ifBlank { "case" },
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
          )
          TonalChip(text = problem.difficulty)
          TonalChip(text = "Week ${problem.week}")
        }
      }

      item {
        Text(text = problem.title, style = MaterialTheme.typography.headlineMedium)
      }

      item {
        Surface(
          shape = RoundedCornerShape(24.dp),
          color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f),
          modifier = Modifier.fillMaxWidth(),
        ) {
          Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("INTERVIEW PROMPT", style = MaterialTheme.typography.labelSmall)
            Text(problem.prompt, style = MaterialTheme.typography.bodyLarge)
          }
        }
      }

      if (problem.resumeTie.isNotBlank()) {
        item {
          SectionBulletCard("Resume Bridge", listOf(problem.resumeTie))
        }
      }

      if (problem.clarifying.isNotEmpty()) {
        item { SectionBulletCard("1. Clarifying Questions", problem.clarifying) }
      }
      if (problem.estimation.isNotEmpty()) {
        item { SectionBulletCard("2. Back-of-the-Envelope Math", problem.estimation) }
      }
      if (problem.architecture.isNotEmpty()) {
        item { SectionBulletCard("3. Reference Architecture", problem.architecture) }
      }
      if (problem.mermaid.isNotBlank()) {
        item { MermaidDiagramCard(code = problem.mermaid, title = "Architecture Blueprint") }
      }
      if (problem.deepDives.isNotEmpty()) {
        item {
          Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("4. Interviewer Deep Dives", style = MaterialTheme.typography.titleLarge)
            problem.deepDives.forEach { qa ->
              ExpandableQaCard(question = qa.q, answer = qa.a)
            }
          }
        }
      }
      if (problem.tradeoffs.isNotEmpty()) {
        item { SectionBulletCard("5. Key Trade-Offs", problem.tradeoffs) }
      }
      if (problem.failureModes.isNotEmpty()) {
        item { SectionBulletCard("6. Failure Modes", problem.failureModes) }
      }
    }
  }
}

@Composable
private fun BoxBottomBar(
  isCompleted: Boolean,
  onToggleCompleted: () -> Unit,
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .navigationBarsPadding()
      .padding(horizontal = 20.dp, vertical = 12.dp),
  ) {
    TactilePillButton(
      text = if (isCompleted) "Completed ✓" else "Mark Case Solved",
      icon = Icons.Rounded.Check,
      containerColor =
        if (isCompleted) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.primary,
      contentColor =
        if (isCompleted) MaterialTheme.colorScheme.onPrimaryContainer
        else MaterialTheme.colorScheme.onPrimary,
      onClick = onToggleCompleted,
      modifier = Modifier.fillMaxWidth(),
    )
  }
}

@Composable
fun SectionBulletCard(title: String, items: List<String>) {
  Surface(
    shape = RoundedCornerShape(22.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
    modifier = Modifier.fillMaxWidth(),
  ) {
    Column(
      modifier = Modifier.padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
      items.forEach { line ->
        Text("• $line", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
      }
    }
  }
}

@Composable
fun ExpandableQaCard(question: String, answer: String) {
  var expanded by remember { mutableStateOf(false) }
  Surface(
    shape = RoundedCornerShape(20.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(20.dp))
      .clickable { expanded = !expanded },
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        Text(
          text = question,
          style = MaterialTheme.typography.titleMedium,
          color = MaterialTheme.colorScheme.onSurface,
          modifier = Modifier.weight(1f),
        )
        Icon(
          imageVector = if (expanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
          contentDescription = null,
          tint = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
      if (expanded) {
        Text(
          text = answer,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
    }
  }
}
