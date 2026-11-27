package dev.lakshya.aisysdesign.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.FormatSize
import androidx.compose.material.icons.rounded.List
import androidx.compose.material.icons.rounded.Quiz
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material.icons.rounded.VolumeUp
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.lakshya.aisysdesign.data.SectionBlock
import dev.lakshya.aisysdesign.data.StudyArticleParser
import dev.lakshya.aisysdesign.data.StudyTabId
import dev.lakshya.aisysdesign.data.TtsUiState
import dev.lakshya.aisysdesign.data.model.StudyResource
import dev.lakshya.aisysdesign.data.model.TextHighlight
import dev.lakshya.aisysdesign.ui.components.ClozeState
import dev.lakshya.aisysdesign.ui.components.ExplainInLayersCard
import dev.lakshya.aisysdesign.ui.components.InterviewQAGroupCard
import dev.lakshya.aisysdesign.ui.components.MarkdownBlockView
import dev.lakshya.aisysdesign.ui.components.RapidFireCard
import dev.lakshya.aisysdesign.ui.components.SocraticLadderCard
import dev.lakshya.aisysdesign.ui.components.TactilePillButton
import dev.lakshya.aisysdesign.ui.components.TimestampedTimelineCard
import dev.lakshya.aisysdesign.ui.components.TonalChip
import dev.lakshya.aisysdesign.ui.components.TonalIconPill
import dev.lakshya.aisysdesign.ui.components.parseMarkdownBlocks
import kotlinx.coroutines.launch

private sealed interface ReaderRow {
  data class Intro(val markdown: String) : ReaderRow
  data class SectionHeader(val id: String, val title: String) : ReaderRow
  data class Block(val block: SectionBlock) : ReaderRow
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReaderScreen(
  itemType: String,
  itemId: String,
  title: String,
  markdown: String,
  studyPrompt: String,
  isCompleted: Boolean,
  scratchpadNote: String,
  highlights: List<TextHighlight>,
  resources: List<StudyResource>,
  quizCount: Int,
  initialScrollIndex: Int,
  ttsState: TtsUiState,
  isRefreshingContent: Boolean,
  onRefreshArticle: () -> Unit,
  onSaveScrollIndex: (Int) -> Unit,
  onBack: () -> Unit,
  onToggleCompleted: () -> Unit,
  onSaveScratchpad: (String) -> Unit,
  onAddHighlight: (text: String, color: String, note: String?) -> Unit,
  onOpenQuizzes: () -> Unit,
  onOpenInternalResource: (String) -> Unit,
  onToggleSpeak: (String, String) -> Unit,
  onCycleTtsSpeed: () -> Unit,
) {
  val context = LocalContext.current
  val clipboard = LocalClipboardManager.current
  val scope = rememberCoroutineScope()

  val parsedArticle = remember(markdown) { StudyArticleParser.parseStudyArticle(markdown) }
  var selectedTab by remember(itemId) {
    mutableStateOf(parsedArticle.availableTabs.firstOrNull() ?: StudyTabId.ALL)
  }

  // Active Recall Cloze Mode state
  var isRecallMode by remember(itemId) { mutableStateOf(false) }
  var revealedClozes by remember(itemId) { mutableStateOf(setOf<String>()) }
  val clozeState = remember(isRecallMode, revealedClozes) {
    ClozeState(
      isRecallMode = isRecallMode,
      revealedIds = revealedClozes,
      onToggleCloze = { id ->
        revealedClozes = if (id in revealedClozes) revealedClozes - id else revealedClozes + id
      },
    )
  }

  val visibleSections = remember(parsedArticle, selectedTab) {
    if (selectedTab == StudyTabId.ALL) parsedArticle.sections
    else parsedArticle.sections.filter { it.tab == selectedTab }
  }

  val rows = remember(parsedArticle, visibleSections, selectedTab) {
    buildList {
      val showIntro =
        parsedArticle.introMarkdown.isNotBlank() &&
          (selectedTab == StudyTabId.ALL || selectedTab == parsedArticle.availableTabs.firstOrNull())
      if (showIntro) {
        add(ReaderRow.Intro(parsedArticle.introMarkdown))
      }
      visibleSections.forEach { sec ->
        add(ReaderRow.SectionHeader(sec.id, sec.title))
        StudyArticleParser.parseSectionBlocks(sec).forEach { sb ->
          add(ReaderRow.Block(sb))
        }
      }
    }
  }

  val listState = rememberLazyListState(initialFirstVisibleItemIndex = initialScrollIndex.coerceAtLeast(0))

  // Persist scroll position when leaving or changing tab
  DisposableEffect(itemId) {
    onDispose {
      onSaveScrollIndex(listState.firstVisibleItemIndex)
    }
  }

  LaunchedEffect(selectedTab) {
    if (selectedTab != parsedArticle.availableTabs.firstOrNull()) {
      listState.scrollToItem(0)
    }
  }

  var fontScaleIdx by remember { mutableIntStateOf(0) }
  val bodyFontSize = listOf(16.sp, 18.sp, 20.sp)[fontScaleIdx]
  val fontScaleLabel = listOf("S", "M", "L")[fontScaleIdx]

  var showNotesSheet by remember { mutableStateOf(false) }
  var showTocSheet by remember { mutableStateOf(false) }
  var showResourcesSheet by remember { mutableStateOf(false) }
  var highlightDraft by remember { mutableStateOf<String?>(null) }

  val isSpeakingThis = ttsState.isSpeaking && ttsState.activeId == itemId

  val readProgress by remember(rows.size) {
    derivedStateOf {
      if (rows.isEmpty()) 0f
      else {
        val visible = listState.firstVisibleItemIndex + listState.layoutInfo.visibleItemsInfo.size
        (visible.toFloat() / rows.size.toFloat()).coerceIn(0f, 1f)
      }
    }
  }

  Scaffold(
    containerColor = MaterialTheme.colorScheme.background,
    topBar = {
      Column(modifier = Modifier.statusBarsPadding()) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 8.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
          }
          Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
          )
          // Active Recall Cloze Mode toggle
          TonalIconPill(
            icon = if (isRecallMode) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
            contentDescription = "Active recall cloze mode",
            badgeDotColor = if (isRecallMode) MaterialTheme.colorScheme.primary else null,
            onClick = {
              isRecallMode = !isRecallMode
              if (!isRecallMode) revealedClozes = emptySet()
            },
          )
          // Refresh this .md from GitHub
          TonalIconPill(
            icon = Icons.Rounded.Sync,
            contentDescription = "Refresh markdown from GitHub",
            badgeDotColor = if (isRefreshingContent) MaterialTheme.colorScheme.primary else null,
            onClick = onRefreshArticle,
          )
          // TTS Listen toggle
          TonalIconPill(
            icon = if (isSpeakingThis) Icons.Rounded.Stop else Icons.Rounded.VolumeUp,
            label = if (isSpeakingThis) "${ttsState.speechRate}x" else null,
            contentDescription = "Listen to topic",
            onClick = {
              val textToRead = buildString {
                append(title).append(". ")
                if (selectedTab == StudyTabId.ALL) {
                  append(StudyArticleParser.stripMarkdownForSpeech(markdown))
                } else {
                  visibleSections.forEach { sec ->
                    append(sec.title).append(". ")
                    append(StudyArticleParser.stripMarkdownForSpeech(sec.markdown)).append(" ")
                  }
                }
              }
              onToggleSpeak(itemId, textToRead)
            },
          )
          TonalIconPill(
            icon = Icons.Rounded.FormatSize,
            label = fontScaleLabel,
            contentDescription = "Cycle font size",
            onClick = { fontScaleIdx = (fontScaleIdx + 1) % 3 },
          )
        }

        LinearProgressIndicator(
          progress = { readProgress },
          modifier = Modifier.fillMaxWidth().height(3.dp),
          color = MaterialTheme.colorScheme.primary,
          trackColor = MaterialTheme.colorScheme.surfaceContainerHigh,
        )

        // 4-Stage Study Tabs
        if (parsedArticle.availableTabs.isNotEmpty()) {
          val tabsToShow = parsedArticle.availableTabs + StudyTabId.ALL
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .horizontalScroll(rememberScrollState())
              .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            tabsToShow.forEach { tab ->
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
                  text = tab.shortLabel,
                  style = MaterialTheme.typography.labelLarge,
                  color =
                    if (selected) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurface,
                  modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                )
              }
            }
          }
        }

        // Active Recall Cloze Mode Helper Strip
        if (isRecallMode) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f))
              .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Text(
              text = "Active Recall: tap [•••] pills (${revealedClozes.size} revealed)",
              style = MaterialTheme.typography.labelMedium,
              color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            TonalChip(
              text = "Reset",
              modifier = Modifier
                .clip(CircleShape)
                .clickable { revealedClozes = emptySet() },
            )
          }
        }

        // TTS Speed Strip while playing
        if (isSpeakingThis) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.55f))
              .padding(horizontal = 16.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Text(
              text = "Listening to ${selectedTab.shortLabel}...",
              style = MaterialTheme.typography.labelMedium,
              color = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            TonalChip(
              text = "Speed ${ttsState.speechRate}x",
              modifier = Modifier
                .clip(CircleShape)
                .clickable(onClick = onCycleTtsSpeed),
            )
          }
        }
      }
    },
    bottomBar = {
      Surface(
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        tonalElevation = 2.dp,
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 14.dp, vertical = 12.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          TonalIconPill(
            icon = Icons.Rounded.List,
            contentDescription = "Sections",
            onClick = { showTocSheet = true },
          )
          if (resources.isNotEmpty()) {
            TonalIconPill(
              icon = Icons.AutoMirrored.Rounded.MenuBook,
              contentDescription = "Reading list",
              onClick = { showResourcesSheet = true },
            )
          }
          TonalIconPill(
            icon = Icons.Rounded.EditNote,
            contentDescription = "Scratchpad notes",
            badgeDotColor = if (scratchpadNote.isNotBlank()) MaterialTheme.colorScheme.primary else null,
            onClick = { showNotesSheet = true },
          )
          if (quizCount > 0) {
            TonalIconPill(
              icon = Icons.Rounded.Quiz,
              label = "$quizCount",
              contentDescription = "Open topic quizzes",
              onClick = onOpenQuizzes,
            )
          }
          TactilePillButton(
            text = if (isCompleted) "Done ✓" else "Mark Done",
            icon = Icons.Rounded.Check,
            containerColor =
              if (isCompleted) MaterialTheme.colorScheme.primaryContainer
              else MaterialTheme.colorScheme.primary,
            contentColor =
              if (isCompleted) MaterialTheme.colorScheme.onPrimaryContainer
              else MaterialTheme.colorScheme.onPrimary,
            onClick = onToggleCompleted,
            modifier = Modifier.weight(1f),
          )
        }
      }
    },
  ) { innerPadding ->
    LazyColumn(
      state = listState,
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding),
      contentPadding = PaddingValues(horizontal = 20.dp, vertical = 18.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
      if (highlights.isNotEmpty()) {
        item {
          Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.45f),
            modifier = Modifier.fillMaxWidth(),
          ) {
            Text(
              text = "${highlights.size} saved highlight(s) · Long-press any paragraph to highlight more",
              style = MaterialTheme.typography.labelMedium,
              color = MaterialTheme.colorScheme.onTertiaryContainer,
              modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            )
          }
        }
      }

      items(rows) { row ->
        when (row) {
          is ReaderRow.Intro -> {
            val mdBlocks = remember(row.markdown) { parseMarkdownBlocks(row.markdown) }
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
              mdBlocks.forEach { b ->
                MarkdownBlockView(
                  block = b,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                  onLongPressQuote = { highlightDraft = it },
                )
              }
            }
          }

          is ReaderRow.SectionHeader -> {
            Text(
              text = row.title,
              style = MaterialTheme.typography.headlineSmall,
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.padding(top = 10.dp, bottom = 2.dp),
            )
          }

          is ReaderRow.Block -> {
            when (val b = row.block) {
              is SectionBlock.Markdown -> {
                val mdBlocks = remember(b.markdown) { parseMarkdownBlocks(b.markdown) }
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                  mdBlocks.forEach { mdBlock ->
                    MarkdownBlockView(
                      block = mdBlock,
                      bodyFontSize = bodyFontSize,
                      clozeState = clozeState,
                      onLongPressQuote = { highlightDraft = it },
                    )
                  }
                }
              }

              is SectionBlock.SocraticLadder -> {
                SocraticLadderCard(
                  heading = b.heading,
                  steps = b.steps,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                )
              }

              is SectionBlock.ExplainInLayers -> {
                ExplainInLayersCard(
                  heading = b.heading,
                  layers = b.layers,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                )
              }

              is SectionBlock.TimestampedTimeline -> {
                TimestampedTimelineCard(
                  heading = b.heading,
                  events = b.events,
                  takeawayMarkdown = b.takeawayMarkdown,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                )
              }

              is SectionBlock.InterviewQaGroup -> {
                InterviewQAGroupCard(
                  items = b.items,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                )
              }

              is SectionBlock.RapidFire -> {
                RapidFireCard(
                  heading = b.heading,
                  items = b.items,
                  bodyFontSize = bodyFontSize,
                  clozeState = clozeState,
                )
              }
            }
          }
        }
      }
    }
  }

  // Section Jump Bottom Sheet
  if (showTocSheet) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
      onDismissRequest = { showTocSheet = false },
      sheetState = sheetState,
      shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(horizontal = 20.dp)
          .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        Text("Jump to Section", style = MaterialTheme.typography.headlineSmall)
        LazyColumn(modifier = Modifier.height(340.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          items(parsedArticle.sections) { sec ->
            Surface(
              shape = RoundedCornerShape(18.dp),
              color = MaterialTheme.colorScheme.surfaceContainerLow,
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .clickable {
                  showTocSheet = false
                  selectedTab = sec.tab
                  scope.launch {
                    val idx = rows.indexOfFirst { it is ReaderRow.SectionHeader && it.id == sec.id }
                    if (idx >= 0) listState.animateScrollToItem(idx)
                  }
                },
            ) {
              Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
              ) {
                Text(
                  text = sec.title,
                  style = MaterialTheme.typography.titleMedium,
                  modifier = Modifier.weight(1f).padding(end = 8.dp),
                )
                TonalChip(text = sec.tab.shortLabel)
              }
            }
          }
        }
      }
    }
  }

  // Curated Reading List Sheet
  if (showResourcesSheet) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
      onDismissRequest = { showResourcesSheet = false },
      sheetState = sheetState,
      shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(horizontal = 20.dp)
          .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
      ) {
        Text("Curated Reading List", style = MaterialTheme.typography.headlineSmall)
        resources.forEach { res ->
          Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceContainerLow,
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(20.dp))
              .clickable {
                when {
                  !res.url.isNullOrBlank() -> {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(res.url)))
                  }
                  !res.href.isNullOrBlank() -> {
                    showResourcesSheet = false
                    onOpenInternalResource(res.href)
                  }
                }
              },
          ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
              Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                TonalChip(text = res.type.uppercase())
                if (!res.url.isNullOrBlank() || !res.href.isNullOrBlank()) {
                  Text("Tap to open", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
              }
              Text(res.title, style = MaterialTheme.typography.titleMedium)
              if (res.why.isNotBlank()) {
                Text(res.why, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
              }
            }
          }
        }
      }
    }
  }

  // Scratchpad + Copy Prompt Sheet
  if (showNotesSheet) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var noteDraft by remember(scratchpadNote) { mutableStateOf(scratchpadNote) }

    ModalBottomSheet(
      onDismissRequest = {
        onSaveScratchpad(noteDraft)
        showNotesSheet = false
      },
      sheetState = sheetState,
      shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(horizontal = 20.dp)
          .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text("Scratchpad · $itemId", style = MaterialTheme.typography.headlineSmall)
          TonalIconPill(
            icon = Icons.Rounded.ContentCopy,
            label = "Prompt",
            contentDescription = "Copy Socratic study prompt",
            onClick = {
              clipboard.setText(AnnotatedString(studyPrompt))
              Toast.makeText(context, "Study prompt copied", Toast.LENGTH_SHORT).show()
            },
          )
        }
        OutlinedTextField(
          value = noteDraft,
          onValueChange = { noteDraft = it },
          label = { Text("Interview defense notes & numbers") },
          minLines = 5,
          maxLines = 10,
          shape = RoundedCornerShape(18.dp),
          modifier = Modifier.fillMaxWidth(),
        )
        TactilePillButton(
          text = "Save Note",
          onClick = {
            onSaveScratchpad(noteDraft)
            showNotesSheet = false
          },
          modifier = Modifier.fillMaxWidth(),
        )
      }
    }
  }

  // Long-Press Highlight Sheet
  highlightDraft?.let { initialQuote ->
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var quoteText by remember(initialQuote) { mutableStateOf(initialQuote) }
    var quoteNote by remember { mutableStateOf("") }
    var selectedColor by remember { mutableStateOf("emerald") }

    val colorMap = listOf(
      "amber" to Color(0xFFE0A13B),
      "emerald" to Color(0xFF3E8C5C),
      "indigo" to Color(0xFF5668C4),
      "rose" to Color(0xFFC95A6B),
    )

    ModalBottomSheet(
      onDismissRequest = { highlightDraft = null },
      sheetState = sheetState,
      shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(horizontal = 20.dp)
          .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
      ) {
        Text("Save Highlight", style = MaterialTheme.typography.headlineSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
          colorMap.forEach { (name, color) ->
            Box(
              modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(color)
                .clickable { selectedColor = name },
              contentAlignment = Alignment.Center,
            ) {
              if (selectedColor == name) {
                Icon(
                  imageVector = Icons.Rounded.Check,
                  contentDescription = name,
                  tint = Color.White,
                  modifier = Modifier.size(18.dp),
                )
              }
            }
          }
        }
        OutlinedTextField(
          value = quoteText,
          onValueChange = { quoteText = it },
          label = { Text("Highlighted text") },
          minLines = 3,
          maxLines = 6,
          shape = RoundedCornerShape(18.dp),
          modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
          value = quoteNote,
          onValueChange = { quoteNote = it },
          label = { Text("Personal note (optional)") },
          singleLine = true,
          shape = RoundedCornerShape(18.dp),
          modifier = Modifier.fillMaxWidth(),
        )
        TactilePillButton(
          text = "Save Highlight",
          enabled = quoteText.isNotBlank(),
          onClick = {
            onAddHighlight(quoteText, selectedColor, quoteNote)
            highlightDraft = null
          },
          modifier = Modifier.fillMaxWidth(),
        )
      }
    }
  }
}
