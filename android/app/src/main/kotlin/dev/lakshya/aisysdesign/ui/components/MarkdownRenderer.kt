package dev.lakshya.aisysdesign.ui.components

import android.annotation.SuppressLint
import android.webkit.WebView
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountTree
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

data class ClozeState(
  val isRecallMode: Boolean = false,
  val revealedIds: Set<String> = emptySet(),
  val onToggleCloze: (String) -> Unit = {},
)

@Composable
fun renderInlineMarkdown(
  raw: String,
  codeBg: Color = MaterialTheme.colorScheme.surfaceContainerHighest,
  codeFg: Color = MaterialTheme.colorScheme.primary,
  clozeState: ClozeState = ClozeState(),
  idPrefix: String = "",
): AnnotatedString {
  val hiddenBg = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
  val hiddenFg = MaterialTheme.colorScheme.onPrimaryContainer
  val revealedBg = MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)

  return buildAnnotatedString {
    var idx = 0
    var codeIndex = 0
    while (idx < raw.length) {
      when {
        raw.startsWith("**", idx) -> {
          val end = raw.indexOf("**", idx + 2)
          if (end != -1) {
            withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
              append(raw.substring(idx + 2, end))
            }
            idx = end + 2
          } else {
            append("**")
            idx += 2
          }
        }
        raw[idx] == '`' -> {
          val end = raw.indexOf('`', idx + 1)
          if (end != -1) {
            val codeText = raw.substring(idx + 1, end)
            val clozeId = "$idPrefix:${codeIndex++}:${codeText.hashCode()}"
            if (!clozeState.isRecallMode) {
              withStyle(
                SpanStyle(
                  fontFamily = FontFamily.Monospace,
                  background = codeBg,
                  color = codeFg,
                  fontSize = 13.sp,
                )
              ) {
                append(" $codeText ")
              }
            } else {
              val isRevealed = clozeId in clozeState.revealedIds
              val display =
                if (isRevealed) " $codeText "
                else {
                  val dots = when {
                    codeText.length <= 5 -> "•••"
                    codeText.length <= 12 -> "•••••"
                    else -> "•••••••"
                  }
                  " [$dots] "
                }
              withLink(
                LinkAnnotation.Clickable(tag = clozeId) {
                  clozeState.onToggleCloze(clozeId)
                }
              ) {
                withStyle(
                  SpanStyle(
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.SemiBold,
                    background = if (isRevealed) revealedBg else hiddenBg,
                    color = if (isRevealed) codeFg else hiddenFg,
                    fontSize = 13.sp,
                  )
                ) {
                  append(display)
                }
              }
            }
            idx = end + 1
          } else {
            append('`')
            idx++
          }
        }
        raw[idx] == '*' -> {
          val end = raw.indexOf('*', idx + 1)
          if (end != -1 && end > idx + 1) {
            withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
              append(raw.substring(idx + 1, end))
            }
            idx = end + 1
          } else {
            append('*')
            idx++
          }
        }
        raw[idx] == '[' -> {
          val closeBracket = raw.indexOf(']', idx + 1)
          val openParen = if (closeBracket != -1 && closeBracket + 1 < raw.length && raw[closeBracket + 1] == '(') closeBracket + 1 else -1
          val closeParen = if (openParen != -1) raw.indexOf(')', openParen + 1) else -1
          if (closeParen != -1) {
            val label = raw.substring(idx + 1, closeBracket)
            withStyle(SpanStyle(color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Medium)) {
              append(label)
            }
            idx = closeParen + 1
          } else {
            append('[')
            idx++
          }
        }
        else -> {
          append(raw[idx])
          idx++
        }
      }
    }
  }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MarkdownBlockView(
  block: MarkdownBlock,
  bodyFontSize: TextUnit = 16.sp,
  clozeState: ClozeState = ClozeState(),
  onLongPressQuote: ((String) -> Unit)? = null,
) {
  when (block) {
    is MarkdownBlock.Heading -> {
      val style =
        when (block.level) {
          1 -> MaterialTheme.typography.headlineMedium
          2 -> MaterialTheme.typography.headlineSmall
          else -> MaterialTheme.typography.titleLarge
        }
      val topPad = if (block.level <= 2) 14.dp else 8.dp
      Text(
        text = renderInlineMarkdown(block.text, clozeState = clozeState, idPrefix = "h-${block.text.hashCode()}"),
        style = style,
        color = MaterialTheme.colorScheme.onSurface,
        modifier = Modifier.padding(top = topPad, bottom = 4.dp),
      )
    }

    is MarkdownBlock.Paragraph -> {
      val mod =
        if (onLongPressQuote != null) {
          Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .combinedClickable(
              onClick = {},
              onLongClick = { onLongPressQuote(block.text) },
            )
        } else {
          Modifier
        }
      Text(
        text = renderInlineMarkdown(block.text, clozeState = clozeState, idPrefix = "p-${block.text.hashCode()}"),
        style = MaterialTheme.typography.bodyLarge.copy(
          fontSize = bodyFontSize,
          lineHeight = bodyFontSize * 1.55f,
        ),
        color = MaterialTheme.colorScheme.onSurface,
        modifier = mod,
      )
    }

    is MarkdownBlock.Blockquote -> {
      val mod =
        if (onLongPressQuote != null) {
          Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .combinedClickable(
              onClick = {},
              onLongClick = { onLongPressQuote(block.lines.joinToString(" ")) },
            )
        } else {
          Modifier.fillMaxWidth()
        }
      Surface(
        modifier = mod,
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.55f),
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          block.lines.forEachIndexed { idx, line ->
            if (line.isNotBlank()) {
              Text(
                text = renderInlineMarkdown(line, clozeState = clozeState, idPrefix = "bq-${line.hashCode()}-$idx"),
                style = MaterialTheme.typography.bodyMedium.copy(
                  fontSize = bodyFontSize * 0.94f,
                  lineHeight = bodyFontSize * 1.45f,
                ),
                color = MaterialTheme.colorScheme.onSecondaryContainer,
              )
            }
          }
        }
      }
    }

    is MarkdownBlock.BulletList -> {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        block.items.forEachIndexed { idx, item ->
          val rowMod =
            if (onLongPressQuote != null) {
              Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .combinedClickable(
                  onClick = {},
                  onLongClick = { onLongPressQuote(item) },
                )
            } else {
              Modifier.fillMaxWidth()
            }
          Row(
            modifier = rowMod,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            Box(
              modifier = Modifier
                .padding(top = 9.dp)
                .size(6.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            )
            Text(
              text = renderInlineMarkdown(item, clozeState = clozeState, idPrefix = "bl-${item.hashCode()}-$idx"),
              style = MaterialTheme.typography.bodyLarge.copy(
                fontSize = bodyFontSize,
                lineHeight = bodyFontSize * 1.5f,
              ),
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.weight(1f),
            )
          }
        }
      }
    }

    is MarkdownBlock.OrderedList -> {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        block.items.forEachIndexed { idx, item ->
          val rowMod =
            if (onLongPressQuote != null) {
              Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .combinedClickable(
                  onClick = {},
                  onLongClick = { onLongPressQuote(item) },
                )
            } else {
              Modifier.fillMaxWidth()
            }
          Row(
            modifier = rowMod,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            Text(
              text = "${idx + 1}.",
              style = MaterialTheme.typography.labelLarge,
              color = MaterialTheme.colorScheme.primary,
              modifier = Modifier.padding(top = 2.dp),
            )
            Text(
              text = renderInlineMarkdown(item, clozeState = clozeState, idPrefix = "ol-${item.hashCode()}-$idx"),
              style = MaterialTheme.typography.bodyLarge.copy(
                fontSize = bodyFontSize,
                lineHeight = bodyFontSize * 1.5f,
              ),
              color = MaterialTheme.colorScheme.onSurface,
              modifier = Modifier.weight(1f),
            )
          }
        }
      }
    }

    is MarkdownBlock.CodeBlock -> {
      Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
      ) {
        Column(modifier = Modifier.padding(14.dp)) {
          if (block.language.isNotBlank()) {
            Text(
              text = block.language.uppercase(),
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.primary,
              modifier = Modifier.padding(bottom = 6.dp),
            )
          }
          Row(modifier = Modifier.horizontalScroll(rememberScrollState())) {
            Text(
              text = block.code,
              fontFamily = FontFamily.Monospace,
              fontSize = 12.5.sp,
              lineHeight = 18.sp,
              color = MaterialTheme.colorScheme.onSurface,
            )
          }
        }
      }
    }

    is MarkdownBlock.MermaidBlock -> {
      MermaidDiagramCard(code = block.code)
    }

    is MarkdownBlock.Table -> {
      Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
      ) {
        Column(
          modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(12.dp),
        ) {
          Row(
            modifier = Modifier
              .clip(RoundedCornerShape(10.dp))
              .background(MaterialTheme.colorScheme.surfaceContainerHigh)
              .padding(vertical = 8.dp, horizontal = 10.dp),
          ) {
            block.headers.forEachIndexed { hIdx, h ->
              Text(
                text = renderInlineMarkdown(h, clozeState = clozeState, idPrefix = "th-$hIdx-${h.hashCode()}"),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.width(160.dp).padding(end = 12.dp),
              )
            }
          }
          Spacer(modifier = Modifier.height(6.dp))
          block.rows.forEachIndexed { rIdx, row ->
            Row(modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp)) {
              block.headers.indices.forEach { cIdx ->
                val cell = row.getOrElse(cIdx) { "" }
                Text(
                  text = renderInlineMarkdown(cell, clozeState = clozeState, idPrefix = "td-$rIdx-$cIdx-${cell.hashCode()}"),
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSurface,
                  modifier = Modifier.width(160.dp).padding(end = 12.dp),
                )
              }
            }
            if (rIdx < block.rows.lastIndex) {
              HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            }
          }
        }
      }
    }

    MarkdownBlock.HorizontalRule -> {
      HorizontalDivider(
        modifier = Modifier.padding(vertical = 8.dp),
        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
      )
    }
  }
}

@Composable
fun MermaidDiagramCard(
  code: String,
  title: String = "Architecture Blueprint",
) {
  var showViewer by remember { mutableStateOf(false) }

  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(24.dp),
    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Icon(
            imageVector = Icons.Rounded.AccountTree,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(18.dp),
          )
          Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
          )
        }
        Surface(
          shape = CircleShape,
          color = MaterialTheme.colorScheme.primary,
          onClick = { showViewer = true },
        ) {
          Text(
            text = "Open Visual",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
          )
        }
      }

      Text(
        text = code.lines().take(6).joinToString("\n"),
        fontFamily = FontFamily.Monospace,
        fontSize = 11.5.sp,
        lineHeight = 16.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }
  }

  if (showViewer) {
    MermaidViewerDialog(
      title = title,
      code = code,
      onDismiss = { showViewer = false },
    )
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MermaidViewerDialog(
  title: String,
  code: String,
  onDismiss: () -> Unit,
) {
  val isDark = isSystemInDarkTheme()
  val bgHex = if (isDark) "#141310" else "#FAF8F3"
  val fgHex = if (isDark) "#EAE5DC" else "#1D1C18"
  val themeName = if (isDark) "dark" else "neutral"
  val escapedCode = remember(code) {
    code.replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;")
  }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false),
  ) {
    Surface(
      modifier = Modifier.fillMaxSize(),
      color = MaterialTheme.colorScheme.background,
    ) {
      Column(modifier = Modifier.fillMaxSize()) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
          )
          IconButton(onClick = onDismiss) {
            Icon(Icons.Rounded.Close, contentDescription = "Close")
          }
        }

        AndroidView(
          modifier = Modifier.fillMaxSize(),
          factory = { ctx ->
            WebView(ctx).apply {
              settings.javaScriptEnabled = true
              settings.builtInZoomControls = true
              settings.displayZoomControls = false
              settings.loadWithOverviewMode = true
              settings.useWideViewPort = true
              val html = """
                <!doctype html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
                  <style>
                    body { margin: 16px; background: $bgHex; color: $fgHex; font-family: sans-serif; }
                    .mermaid { display: flex; justify-content: center; }
                    pre { white-space: pre-wrap; font-size: 12px; opacity: 0.85; }
                  </style>
                </head>
                <body>
                  <div class="mermaid">$escapedCode</div>
                  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
                    onerror="document.getElementById('fallback').style.display='block';"></script>
                  <script>
                    if (window.mermaid) {
                      mermaid.initialize({ startOnLoad: true, theme: '$themeName' });
                    }
                  </script>
                  <pre id="fallback" style="display:none;">Offline mode — raw Mermaid source:

$escapedCode</pre>
                </body>
                </html>
              """.trimIndent()
              loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
            }
          },
        )
      }
    }
  }
}
