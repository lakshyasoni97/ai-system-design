package dev.lakshya.aisysdesign.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material.icons.rounded.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.StudyArticleParser
import dev.lakshya.aisysdesign.data.TtsUiState
import dev.lakshya.aisysdesign.data.model.ResumeProject
import dev.lakshya.aisysdesign.ui.components.MermaidDiagramCard
import dev.lakshya.aisysdesign.ui.components.TonalChip
import dev.lakshya.aisysdesign.ui.components.TonalIconPill

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProjectDetailScreen(
  project: ResumeProject,
  ttsState: TtsUiState,
  onToggleSpeak: (String, String) -> Unit,
  onBack: () -> Unit,
) {
  var archTab by remember { mutableIntStateOf(1) }
  val isSpeakingThis = ttsState.isSpeaking && ttsState.activeId == project.id

  Scaffold(
    containerColor = MaterialTheme.colorScheme.background,
    topBar = {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .statusBarsPadding()
          .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        IconButton(onClick = onBack) {
          Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
        }
        Text(
          text = "${project.company} · 100x Defense",
          style = MaterialTheme.typography.titleLarge,
          modifier = Modifier.weight(1f),
        )
        TonalIconPill(
          icon = if (isSpeakingThis) Icons.Rounded.Stop else Icons.Rounded.VolumeUp,
          label = if (isSpeakingThis) "Stop" else "Listen",
          contentDescription = "Listen to project defense",
          onClick = {
            val speech = buildString {
              append("${project.company}: ${project.title}. ")
              append(project.elevatorPitch).append(" ")
              project.hostileQuestions.forEachIndexed { idx, hq ->
                append("Question ${idx + 1}: ${hq.question} ")
                append("Answer: ${StudyArticleParser.stripMarkdownForSpeech(hq.answer)} ")
              }
            }
            onToggleSpeak(project.id, speech)
          },
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
        Text(text = project.title, style = MaterialTheme.typography.headlineMedium)
        Text(
          text = project.subtitle,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.primary,
          modifier = Modifier.padding(top = 4.dp),
        )
      }

      item {
        Surface(
          shape = RoundedCornerShape(22.dp),
          color = MaterialTheme.colorScheme.surfaceContainerLow,
          modifier = Modifier.fillMaxWidth(),
        ) {
          Text(
            text = project.elevatorPitch,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(18.dp),
          )
        }
      }

      item {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          project.impactMetrics.chunked(2).forEach { pair ->
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
              pair.forEach { metric ->
                Surface(
                  shape = RoundedCornerShape(20.dp),
                  color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                  modifier = Modifier.weight(1f),
                ) {
                  Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                  ) {
                    Text(
                      text = metric.value,
                      style = MaterialTheme.typography.titleLarge,
                      color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                    Text(
                      text = metric.label,
                      style = MaterialTheme.typography.labelMedium,
                      color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                    Text(
                      text = metric.delta,
                      style = MaterialTheme.typography.bodyMedium,
                      color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f),
                    )
                  }
                }
              }
            }
          }
        }
      }

      item {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            listOf("Current Prod", "100x Scale").forEachIndexed { idx, label ->
              SegmentedButton(
                selected = archTab == idx,
                onClick = { archTab = idx },
                shape = SegmentedButtonDefaults.itemShape(index = idx, count = 2),
              ) {
                Text(label)
              }
            }
          }
          val code =
            if (archTab == 0) project.currentArchitectureMermaid
            else project.scale100xArchitectureMermaid
          MermaidDiagramCard(
            code = code,
            title = if (archTab == 0) "Current Production Blueprint" else "100x Scale Blueprint",
          )
        }
      }

      item {
        SectionBulletCard(
          title = "Hard Numbers Cheat Sheet",
          items = listOf(
            "QPS: ${project.hardNumbers.qps}",
            "Daily Volume: ${project.hardNumbers.dailyVolume}",
            "Latency: ${project.hardNumbers.latency}",
            "Unit Cost: ${project.hardNumbers.costPer1k}",
            "Evals: ${project.hardNumbers.evalMetrics}",
          ),
        )
      }

      item {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          project.techStack.forEach { tech ->
            TonalChip(text = tech)
          }
        }
      }

      if (project.hostileQuestions.isNotEmpty()) {
        item {
          Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Hostile Interviewer Q&As", style = MaterialTheme.typography.titleLarge)
            project.hostileQuestions.forEach { hq ->
              ExpandableQaCard(question = hq.question, answer = hq.answer)
            }
          }
        }
      }
    }
  }
}
