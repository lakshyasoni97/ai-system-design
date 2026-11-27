package dev.lakshya.aisysdesign.ui.components

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import dev.lakshya.aisysdesign.data.ThemeMode
import dev.lakshya.aisysdesign.data.UserPrefs
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsSheet(
  prefs: UserPrefs,
  onSetThemeMode: (ThemeMode) -> Unit,
  onSetDynamicColor: (Boolean) -> Unit,
  onUpdateReminder: (Boolean, Int, Int) -> Unit,
  onSendTestNotification: () -> Unit,
  onExportJson: () -> String,
  onImportJson: (String) -> Boolean,
  onDismiss: () -> Unit,
) {
  val context = LocalContext.current
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
  var showImportDialog by remember { mutableStateOf(false) }

  val permissionLauncher = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    if (granted) {
      onUpdateReminder(true, prefs.reminderHour, prefs.reminderMinute)
      Toast.makeText(context, "Daily reminder scheduled", Toast.LENGTH_SHORT).show()
    } else {
      Toast.makeText(context, "Notification permission declined", Toast.LENGTH_SHORT).show()
    }
  }

  fun enableReminderWithPermission(hour: Int, minute: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val granted = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.POST_NOTIFICATIONS,
      ) == PackageManager.PERMISSION_GRANTED
      if (!granted) {
        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        return
      }
    }
    onUpdateReminder(true, hour, minute)
  }

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
      Text("Preferences", style = MaterialTheme.typography.headlineSmall)

      // 1. Appearance
      Surface(
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(
          modifier = Modifier.padding(18.dp),
          verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
          Text("APPEARANCE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

          SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            ThemeMode.entries.forEachIndexed { idx, mode ->
              SegmentedButton(
                selected = prefs.themeMode == mode,
                onClick = { onSetThemeMode(mode) },
                shape = SegmentedButtonDefaults.itemShape(index = idx, count = ThemeMode.entries.size),
              ) {
                Text(mode.label)
              }
            }
          }

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Column(modifier = Modifier.weight(1f)) {
              Text("Wallpaper Dynamic Color", style = MaterialTheme.typography.titleMedium)
              Text(
                text = if (prefs.useDynamicColor) "Follows Android Material You wallpaper" else "Using Warm Buckwheat Oat & Sage",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
            Switch(
              checked = prefs.useDynamicColor,
              onCheckedChange = onSetDynamicColor,
            )
          }
        }
      }

      // 2. Daily Study Reminder
      Surface(
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(
          modifier = Modifier.padding(18.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Column(modifier = Modifier.weight(1f)) {
              Text("Daily Study Reminder", style = MaterialTheme.typography.titleMedium)
              Text(
                text = if (prefs.reminderEnabled) {
                  String.format(Locale.US, "Scheduled daily around %02d:%02d", prefs.reminderHour, prefs.reminderMinute)
                } else {
                  "Nudge when flashcards are due"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
            Switch(
              checked = prefs.reminderEnabled,
              onCheckedChange = { checked ->
                if (checked) enableReminderWithPermission(prefs.reminderHour, prefs.reminderMinute)
                else onUpdateReminder(false, prefs.reminderHour, prefs.reminderMinute)
              },
            )
          }

          FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            listOf(8 to 30, 13 to 0, 20 to 30, 22 to 0).forEach { (h, m) ->
              val selected = prefs.reminderHour == h && prefs.reminderMinute == m
              Surface(
                shape = CircleShape,
                color =
                  if (selected) MaterialTheme.colorScheme.primary
                  else MaterialTheme.colorScheme.surfaceContainerHigh,
                modifier = Modifier
                  .clip(CircleShape)
                  .clickable {
                    if (prefs.reminderEnabled) enableReminderWithPermission(h, m)
                    else onUpdateReminder(false, h, m)
                  },
              ) {
                Text(
                  text = String.format(Locale.US, "%02d:%02d", h, m),
                  style = MaterialTheme.typography.labelMedium,
                  color =
                    if (selected) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurface,
                  modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                )
              }
            }
          }

          TactilePillButton(
            text = "Send Test Notification",
            icon = Icons.Rounded.NotificationsActive,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            contentColor = MaterialTheme.colorScheme.onSurface,
            onClick = {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
              ) {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
              } else {
                onSendTestNotification()
              }
            },
            modifier = Modifier.fillMaxWidth(),
          )
        }
      }

      // 3. Offline JSON Backup
      Surface(
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        modifier = Modifier.fillMaxWidth(),
      ) {
        Column(
          modifier = Modifier.padding(18.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("OFFLINE PROGRESS BACKUP", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            TactilePillButton(
              text = "Export JSON",
              icon = Icons.Rounded.Share,
              onClick = {
                val payload = onExportJson()
                val intent = Intent(Intent.ACTION_SEND).apply {
                  type = "application/json"
                  putExtra(Intent.EXTRA_SUBJECT, "ai-system-design-progress.json")
                  putExtra(Intent.EXTRA_TEXT, payload)
                }
                context.startActivity(Intent.createChooser(intent, "Export Study Progress"))
              },
              modifier = Modifier.weight(1f),
            )
            TactilePillButton(
              text = "Import",
              icon = Icons.Rounded.Download,
              containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
              contentColor = MaterialTheme.colorScheme.onSurface,
              onClick = { showImportDialog = true },
            )
          }
        }
      }
    }
  }

  if (showImportDialog) {
    var jsonInput by remember { mutableStateOf("") }
    AlertDialog(
      onDismissRequest = { showImportDialog = false },
      title = { Text("Import Progress JSON") },
      text = {
        OutlinedTextField(
          value = jsonInput,
          onValueChange = { jsonInput = it },
          label = { Text("Paste exported JSON") },
          minLines = 5,
          maxLines = 8,
        )
      },
      confirmButton = {
        TextButton(
          onClick = {
            val ok = onImportJson(jsonInput)
            Toast.makeText(
              context,
              if (ok) "Progress merged successfully" else "Invalid JSON format",
              Toast.LENGTH_SHORT,
            ).show()
            if (ok) showImportDialog = false
          },
        ) {
          Text("Merge")
        }
      },
      dismissButton = {
        TextButton(onClick = { showImportDialog = false }) { Text("Cancel") }
      },
    )
  }
}
