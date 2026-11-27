package dev.lakshya.aisysdesign.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.ui.MOCK_INTERVIEW_PHASES
import dev.lakshya.aisysdesign.ui.MockTimerState
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun PocketToolsSheet(
  timerState: MockTimerState,
  onToggleTimer: () -> Unit,
  onResetTimer: () -> Unit,
  onDismiss: () -> Unit,
) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
  var activeTab by remember { mutableIntStateOf(0) }

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
        .verticalScroll(rememberScrollState())
        .padding(horizontal = 20.dp)
        .padding(bottom = 28.dp),
      verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
      SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
        listOf("45m Mock Timer", "Capacity Math").forEachIndexed { idx, label ->
          SegmentedButton(
            selected = activeTab == idx,
            onClick = { activeTab = idx },
            shape = SegmentedButtonDefaults.itemShape(index = idx, count = 2),
          ) {
            Text(label)
          }
        }
      }

      if (activeTab == 0) {
        MockTimerContent(
          timerState = timerState,
          onToggleTimer = onToggleTimer,
          onResetTimer = onResetTimer,
        )
      } else {
        CapacityCalculatorContent()
      }
    }
  }
}

@Composable
private fun MockTimerContent(
  timerState: MockTimerState,
  onToggleTimer: () -> Unit,
  onResetTimer: () -> Unit,
) {
  val currentPhase = timerState.currentPhase

  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(28.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
  ) {
    Column(
      modifier = Modifier.padding(24.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      TonalChip(
        text = currentPhase.label,
        containerColor = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
      )
      Text(
        text = timerState.formattedTime,
        style = MaterialTheme.typography.displayLarge,
        color = MaterialTheme.colorScheme.onSurface,
      )
      Text(
        text = currentPhase.tip,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }
  }

  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    TactilePillButton(
      text = if (timerState.isRunning) "Pause" else if (timerState.remainingSeconds < timerState.totalSeconds) "Resume" else "Start Mock",
      icon = if (timerState.isRunning) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
      onClick = onToggleTimer,
      modifier = Modifier.weight(1f),
    )
    TactilePillButton(
      text = "Reset",
      icon = Icons.Rounded.Refresh,
      onClick = onResetTimer,
      containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
      contentColor = MaterialTheme.colorScheme.onSurface,
    )
  }

  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    MOCK_INTERVIEW_PHASES.forEach { phase ->
      val active = phase == currentPhase
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(16.dp))
          .background(
            if (active) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
            else MaterialTheme.colorScheme.surfaceContainerLow
          )
          .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text(
          text = phase.label,
          style = MaterialTheme.typography.labelLarge,
          color = MaterialTheme.colorScheme.onSurface,
        )
        Text(
          text = "${phase.rangeMinutes.first}–${phase.rangeMinutes.last + if (phase == MOCK_INTERVIEW_PHASES.last()) 0 else 1}m",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
    }
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CapacityCalculatorContent() {
  var vectorMillions by remember { mutableIntStateOf(50) }
  var dims by remember { mutableIntStateOf(1536) }
  var dtypeIndex by remember { mutableIntStateOf(1) }
  var peakQps by remember { mutableIntStateOf(100) }
  var outputTokens by remember { mutableIntStateOf(400) }

  // Cost estimator state
  var inputTokens by remember { mutableIntStateOf(4000) }
  var isProTier by remember { mutableStateOf(false) }
  var promptCacheEnabled by remember { mutableStateOf(true) }

  val bytesPerDim = when (dtypeIndex) {
    0 -> 4.0
    1 -> 1.0
    else -> 0.125
  }
  val dtypeLabel = listOf("FP32 (4B)", "INT8 (1B)", "Binary (1b)")[dtypeIndex]
  val ramGb = (vectorMillions * 1_000_000.0 * dims * bytesPerDim * 1.5) / 1_000_000_000.0
  val tokensPerSec = peakQps * outputTokens
  val gpusNeeded = kotlin.math.ceil((tokensPerSec / 1800.0) * 1.3).toInt().coerceAtLeast(1)

  // Daily cost math (~86,400s * avgQps (= 0.35 * peakQps))
  val dailyRequests = peakQps * 0.35 * 86_400.0
  val inRatePer1M = if (isProTier) 1.25 else 0.075
  val outRatePer1M = if (isProTier) 5.00 else 0.30
  val effectiveInputTokens = if (promptCacheEnabled) inputTokens * 0.4 else inputTokens.toDouble()
  val dailyCostUsd =
    (dailyRequests * ((effectiveInputTokens / 1_000_000.0) * inRatePer1M + (outputTokens / 1_000_000.0) * outRatePer1M))

  // HNSW Vector RAM Card
  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(24.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
  ) {
    Column(
      modifier = Modifier.padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text(
        text = "HNSW VECTOR RAM (N × D × Bytes × 1.5)",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
      Text(
        text = String.format(Locale.US, "%.1f GB", ramGb),
        style = MaterialTheme.typography.displayMedium,
        color = MaterialTheme.colorScheme.primary,
      )

      Text("Vectors", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(10, 50, 100, 250).forEach { m ->
          ChipSelect("${m}M", vectorMillions == m) { vectorMillions = m }
        }
      }

      Text("Dimensions", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(768, 1024, 1536, 3072).forEach { d ->
          ChipSelect("${d}d", dims == d) { dims = d }
        }
      }

      Text("Quantization", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf("FP32", "INT8", "Binary").forEachIndexed { idx, label ->
          ChipSelect(label, dtypeIndex == idx) { dtypeIndex = idx }
        }
      }
      Text(
        text = "${vectorMillions}M × $dims dims × $dtypeLabel × 1.5 HNSW overhead",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }
  }

  // LLM Decode GPU Estimator
  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(24.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
  ) {
    Column(
      modifier = Modifier.padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text(
        text = "LLM SERVING FLEET (~1,800 tok/s/GPU + 1.3x headroom)",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
      Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        Text(
          text = "$gpusNeeded GPUs",
          style = MaterialTheme.typography.displayMedium,
          color = MaterialTheme.colorScheme.secondary,
        )
        Text(
          text = "($tokensPerSec tok/s)",
          style = MaterialTheme.typography.titleMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.padding(bottom = 4.dp),
        )
      }

      Text("Peak QPS", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(25, 100, 500, 1500).forEach { q ->
          ChipSelect("$q QPS", peakQps == q) { peakQps = q }
        }
      }

      Text("Avg Output Tokens", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(200, 400, 800, 1200).forEach { t ->
          ChipSelect("$t tok", outputTokens == t) { outputTokens = t }
        }
      }
    }
  }

  // LLM API Cost Estimator
  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(24.dp),
    color = MaterialTheme.colorScheme.surfaceContainerLow,
  ) {
    Column(
      modifier = Modifier.padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text(
        text = "API COST ESTIMATOR (AVG QPS ≈ 35% PEAK)",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
      Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        Text(
          text = String.format(Locale.US, "$%,.0f/day", dailyCostUsd),
          style = MaterialTheme.typography.displayMedium,
          color = MaterialTheme.colorScheme.tertiary,
        )
        Text(
          text = String.format(Locale.US, "($%,.0f/mo)", dailyCostUsd * 30.0),
          style = MaterialTheme.typography.titleMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.padding(bottom = 4.dp),
        )
      }

      Text("Model Tier", style = MaterialTheme.typography.labelMedium)
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        ChipSelect("Flash ($0.075/$0.30)", !isProTier) { isProTier = false }
        ChipSelect("Pro ($1.25/$5.00)", isProTier) { isProTier = true }
      }

      Text("Input Context", style = MaterialTheme.typography.labelMedium)
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(1000, 4000, 12000, 32000).forEach { tok ->
          ChipSelect("${tok / 1000}k tok", inputTokens == tok) { inputTokens = tok }
        }
      }

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text("Provider Prompt Caching (-60% input)", style = MaterialTheme.typography.bodyMedium)
        Switch(checked = promptCacheEnabled, onCheckedChange = { promptCacheEnabled = it })
      }
    }
  }
}

@Composable
private fun ChipSelect(
  label: String,
  selected: Boolean,
  onClick: () -> Unit,
) {
  Surface(
    shape = CircleShape,
    color =
      if (selected) MaterialTheme.colorScheme.primary
      else MaterialTheme.colorScheme.surfaceContainerHigh,
    modifier = Modifier
      .clip(CircleShape)
      .clickable(onClick = onClick),
  ) {
    Text(
      text = label,
      style = MaterialTheme.typography.labelMedium,
      fontWeight = FontWeight.SemiBold,
      color =
        if (selected) MaterialTheme.colorScheme.onPrimary
        else MaterialTheme.colorScheme.onSurface,
      modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
    )
  }
}
