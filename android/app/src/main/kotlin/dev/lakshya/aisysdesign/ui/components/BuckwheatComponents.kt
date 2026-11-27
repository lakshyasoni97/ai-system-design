package dev.lakshya.aisysdesign.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.sin

/**
 * Buckwheat-inspired hero progress card with an animated sinusoidal liquid fill wave.
 */
@Composable
fun WavyProgressHeroCard(
  completedItems: Int,
  totalItems: Int,
  fundamentalsDone: Int,
  fundamentalsTotal: Int,
  sessionsDone: Int,
  sessionsTotal: Int,
  problemsDone: Int,
  problemsTotal: Int,
  streakDays: Int = 0,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val targetFraction =
    if (totalItems > 0) (completedItems.toFloat() / totalItems.toFloat()).coerceIn(0f, 1f)
    else 0f
  val animatedFraction by animateFloatAsState(
    targetValue = targetFraction,
    animationSpec = tween(durationMillis = 700),
    label = "readinessFraction",
  )
  val pct = (targetFraction * 100).toInt()

  val infiniteTransition = rememberInfiniteTransition(label = "waveShift")
  val phase by infiniteTransition.animateFloat(
    initialValue = 0f,
    targetValue = (2f * PI).toFloat(),
    animationSpec = infiniteRepeatable(
      animation = tween(durationMillis = 4800, easing = LinearEasing),
      repeatMode = RepeatMode.Restart,
    ),
    label = "wavePhase",
  )

  val cardBg = MaterialTheme.colorScheme.surfaceContainerLow
  val waveColorBack = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
  val waveColorFront = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.72f)

  Surface(
    modifier = modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(28.dp))
      .clickable(onClick = onClick),
    shape = RoundedCornerShape(28.dp),
    color = cardBg,
    tonalElevation = 1.dp,
  ) {
    Box(modifier = Modifier.fillMaxWidth()) {
      Canvas(modifier = Modifier.matchParentSize()) {
        val w = size.width
        val h = size.height
        val visualFraction = if (animatedFraction == 0f) 0.06f else (0.12f + animatedFraction * 0.78f)
        val baseY = h * (1f - visualFraction)
        val amp = 10.dp.toPx()

        fun drawWave(waveColor: Color, phaseOffset: Float, amplitude: Float) {
          val path = Path().apply {
            moveTo(0f, h)
            lineTo(0f, baseY)
            val steps = 40
            for (i in 0..steps) {
              val x = (i.toFloat() / steps) * w
              val angle = (x / w) * 2.5f * PI.toFloat() + phase + phaseOffset
              val y = baseY + sin(angle) * amplitude
              lineTo(x, y)
            }
            lineTo(w, h)
            close()
          }
          drawPath(path = path, color = waveColor)
        }

        drawWave(waveColorBack, phaseOffset = 1.4f, amplitude = amp * 0.85f)
        drawWave(waveColorFront, phaseOffset = 0f, amplitude = amp)
      }

      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 22.dp, vertical = 22.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = "10-WEEK READINESS",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
          Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (streakDays > 0) {
              TonalChip(
                text = "${streakDays}d streak",
                containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.85f),
                contentColor = MaterialTheme.colorScheme.onTertiaryContainer,
              )
            }
            TonalChip(
              text = "$completedItems / $totalItems items",
              containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.75f),
              contentColor = MaterialTheme.colorScheme.onSurface,
            )
          }
        }

        Row(
          verticalAlignment = Alignment.Bottom,
          horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
          Text(
            text = "$pct%",
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.onSurface,
          )
          Text(
            text = "complete",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 8.dp),
          )
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          TonalChip(
            text = "Fund $fundamentalsDone/$fundamentalsTotal",
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.72f),
            contentColor = MaterialTheme.colorScheme.onSurface,
          )
          TonalChip(
            text = "Sessions $sessionsDone/$sessionsTotal",
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.72f),
            contentColor = MaterialTheme.colorScheme.onSurface,
          )
          TonalChip(
            text = "Cases $problemsDone/$problemsTotal",
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.72f),
            contentColor = MaterialTheme.colorScheme.onSurface,
          )
        }
      }
    }
  }
}

@Composable
fun TonalChip(
  text: String,
  containerColor: Color = MaterialTheme.colorScheme.surfaceContainerHigh,
  contentColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
  modifier: Modifier = Modifier,
) {
  Box(
    modifier = modifier
      .clip(CircleShape)
      .background(containerColor)
      .padding(horizontal = 11.dp, vertical = 5.dp),
  ) {
    Text(
      text = text,
      style = MaterialTheme.typography.labelMedium,
      color = contentColor,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis,
    )
  }
}

@Composable
fun TonalIconPill(
  icon: ImageVector,
  contentDescription: String,
  onClick: () -> Unit,
  badgeDotColor: Color? = null,
  label: String? = null,
  modifier: Modifier = Modifier,
) {
  Surface(
    modifier = modifier
      .clip(CircleShape)
      .clickable(onClick = onClick),
    shape = CircleShape,
    color = MaterialTheme.colorScheme.surfaceContainerHigh,
  ) {
    Row(
      modifier = Modifier.padding(horizontal = if (label != null) 14.dp else 11.dp, vertical = 10.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
      Icon(
        imageVector = icon,
        contentDescription = contentDescription,
        modifier = Modifier.size(18.dp),
        tint = MaterialTheme.colorScheme.onSurface,
      )
      if (label != null) {
        Text(
          text = label,
          style = MaterialTheme.typography.labelMedium,
          color = MaterialTheme.colorScheme.onSurface,
        )
      }
      if (badgeDotColor != null) {
        Box(
          modifier = Modifier
            .size(7.dp)
            .clip(CircleShape)
            .background(badgeDotColor),
        )
      }
    }
  }
}

@Composable
fun TactilePillButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  icon: ImageVector? = null,
  containerColor: Color = MaterialTheme.colorScheme.primary,
  contentColor: Color = MaterialTheme.colorScheme.onPrimary,
  enabled: Boolean = true,
) {
  val haptics = LocalHapticFeedback.current
  Button(
    onClick = {
      haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
      onClick()
    },
    enabled = enabled,
    modifier = modifier.height(54.dp),
    shape = CircleShape,
    colors = ButtonDefaults.buttonColors(
      containerColor = containerColor,
      contentColor = contentColor,
    ),
    contentPadding = PaddingValues(horizontal = 22.dp, vertical = 12.dp),
  ) {
    if (icon != null) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        modifier = Modifier.size(18.dp),
      )
      Spacer(modifier = Modifier.width(8.dp))
    }
    Text(
      text = text,
      style = MaterialTheme.typography.labelLarge,
      fontWeight = FontWeight.SemiBold,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis,
    )
  }
}

data class NavPillDestination(
  val id: String,
  val label: String,
  val icon: ImageVector,
)

@Composable
fun FloatingPillNavBar(
  destinations: List<NavPillDestination>,
  selectedId: String,
  onSelect: (String) -> Unit,
  modifier: Modifier = Modifier,
) {
  val haptics = LocalHapticFeedback.current
  Box(
    modifier = modifier
      .fillMaxWidth()
      .navigationBarsPadding()
      .padding(horizontal = 24.dp, vertical = 14.dp),
    contentAlignment = Alignment.Center,
  ) {
    Surface(
      shape = CircleShape,
      color = MaterialTheme.colorScheme.surfaceContainerHigh.copy(alpha = 0.96f),
      tonalElevation = 6.dp,
      shadowElevation = 6.dp,
    ) {
      Row(
        modifier = Modifier.padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
      ) {
        destinations.forEach { dest ->
          val selected = dest.id == selectedId
          val bg =
            if (selected) MaterialTheme.colorScheme.primaryContainer
            else Color.Transparent
          val fg =
            if (selected) MaterialTheme.colorScheme.onPrimaryContainer
            else MaterialTheme.colorScheme.onSurfaceVariant

          Row(
            modifier = Modifier
              .clip(CircleShape)
              .background(bg)
              .clickable {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onSelect(dest.id)
              }
              .padding(horizontal = 18.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp),
          ) {
            Icon(
              imageVector = dest.icon,
              contentDescription = dest.label,
              modifier = Modifier.size(18.dp),
              tint = fg,
            )
            Text(
              text = dest.label,
              style = MaterialTheme.typography.labelLarge,
              color = fg,
              maxLines = 1,
            )
          }
        }
      }
    }
  }
}
