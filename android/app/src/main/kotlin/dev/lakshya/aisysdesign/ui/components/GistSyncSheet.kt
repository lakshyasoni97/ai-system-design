package dev.lakshya.aisysdesign.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CloudDone
import androidx.compose.material.icons.rounded.CloudSync
import androidx.compose.material.icons.rounded.LinkOff
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import dev.lakshya.aisysdesign.data.model.SyncUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GistSyncSheet(
  syncUi: SyncUiState,
  onConnect: (String) -> Unit,
  onSyncNow: () -> Unit,
  onDisconnect: () -> Unit,
  onDismiss: () -> Unit,
) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
  var tokenInput by remember { mutableStateOf("") }

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
        .padding(bottom = 28.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        TonalChip(
          text = if (syncUi.isConfigured) "Gist Connected" else "Offline Local",
          containerColor =
            if (syncUi.isConfigured) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.surfaceContainerHigh,
          contentColor =
            if (syncUi.isConfigured) MaterialTheme.colorScheme.onPrimaryContainer
            else MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
          text = "Cross-Device Sync",
          style = MaterialTheme.typography.titleLarge,
        )
      }

      Text(
        text = "Uses your private GitHub Gist (ai-system-design-sync.json) so progress, SRS flashcards, quizzes, notes, and highlights stay 1-to-1 with the web portal.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )

      if (!syncUi.syncError.isNullOrBlank()) {
        Surface(
          shape = RoundedCornerShape(18.dp),
          color = MaterialTheme.colorScheme.errorContainer,
          modifier = Modifier.fillMaxWidth(),
        ) {
          Text(
            text = syncUi.syncError,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onErrorContainer,
            modifier = Modifier.padding(14.dp),
          )
        }
      }

      if (syncUi.isConfigured) {
        Surface(
          shape = RoundedCornerShape(22.dp),
          color = MaterialTheme.colorScheme.surfaceContainerLow,
          modifier = Modifier.fillMaxWidth(),
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Text(
              text = "@${syncUi.githubUser?.login ?: "github"}",
              style = MaterialTheme.typography.titleMedium,
              color = MaterialTheme.colorScheme.onSurface,
            )
            if (!syncUi.lastSyncedAt.isNullOrBlank()) {
              Text(
                text = "Last synced: ${syncUi.lastSyncedAt.take(19).replace('T', ' ')} UTC",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
            if (!syncUi.gistUrl.isNullOrBlank()) {
              Text(
                text = syncUi.gistUrl,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
              )
            }
          }
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          TactilePillButton(
            text = if (syncUi.isSyncing) "Syncing..." else "Sync Now",
            icon = Icons.Rounded.CloudSync,
            enabled = !syncUi.isSyncing,
            onClick = onSyncNow,
            modifier = Modifier.weight(1f),
          )
          TactilePillButton(
            text = "Disconnect",
            icon = Icons.Rounded.LinkOff,
            onClick = onDisconnect,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            contentColor = MaterialTheme.colorScheme.onSurface,
          )
        }
      } else {
        OutlinedTextField(
          value = tokenInput,
          onValueChange = { tokenInput = it },
          label = { Text("GitHub Personal Access Token (gist scope)") },
          placeholder = { Text("ghp_...") },
          singleLine = true,
          visualTransformation = PasswordVisualTransformation(),
          shape = RoundedCornerShape(18.dp),
          modifier = Modifier.fillMaxWidth(),
        )

        TactilePillButton(
          text = if (syncUi.isSyncing) "Connecting..." else "Connect & Merge Gist",
          icon = Icons.Rounded.CloudDone,
          enabled = !syncUi.isSyncing && tokenInput.isNotBlank(),
          onClick = { onConnect(tokenInput) },
          modifier = Modifier.fillMaxWidth(),
        )
      }
    }
  }
}
