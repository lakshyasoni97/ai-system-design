package dev.lakshya.aisysdesign.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

@Serializable
data class GitTreeResponse(
  val sha: String = "",
  val tree: List<GitTreeEntry> = emptyList(),
)

@Serializable
data class GitTreeEntry(
  val path: String = "",
  val type: String = "",
  val sha: String = "",
)

data class ContentSyncResult(
  val treeSha: String,
  val updatedCount: Int,
  val totalTracked: Int,
  val syncedAtIso: String,
)

data class ContentSyncUiState(
  val isSyncing: Boolean = false,
  val lastSyncedAt: String? = null,
  val updatedCount: Int = 0,
  val error: String? = null,
  val statusMessage: String? = null,
)

class GitHubContentSyncClient {

  companion object {
    const val REPO_OWNER = "lakshyasoni97"
    const val REPO_NAME = "ai-system-design"
    const val BRANCH = "main"

    private const val SHAS_FILENAME = "blob_shas.json"

    private val json = Json {
      ignoreUnknownKeys = true
      isLenient = true
      encodeDefaults = true
    }

    fun mapRepoPathToLocalRelativePath(repoPath: String): String? {
      return when {
        repoPath.startsWith("src/data/") && repoPath.endsWith(".json") -> {
          val fileName = repoPath.removePrefix("src/data/")
          if ('/' in fileName) null else "data/$fileName"
        }
        repoPath.startsWith("src/content/fundamentals/") && repoPath.endsWith(".md") -> {
          val fileName = repoPath.removePrefix("src/content/fundamentals/")
          if ('/' in fileName) null else "content/fundamentals/$fileName"
        }
        repoPath.startsWith("src/content/sessions/") && repoPath.endsWith(".md") -> {
          val fileName = repoPath.removePrefix("src/content/sessions/")
          if ('/' in fileName) null else "content/sessions/$fileName"
        }
        else -> null
      }
    }

    fun computeChangedEntries(
      entries: List<GitTreeEntry>,
      cachedShas: Map<String, String>,
    ): List<Pair<GitTreeEntry, String>> {
      return entries.mapNotNull { entry ->
        if (entry.type != "blob") return@mapNotNull null
        val localRel = mapRepoPathToLocalRelativePath(entry.path) ?: return@mapNotNull null
        if (cachedShas[entry.path] == entry.sha) null else (entry to localRel)
      }
    }
  }

  private fun httpGetText(urlStr: String, accept: String? = null): String {
    val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
      connectTimeout = 12_000
      readTimeout = 20_000
      setRequestProperty("User-Agent", "SysDesign-Android")
      if (accept != null) {
        setRequestProperty("Accept", accept)
      }
    }

    return try {
      val code = conn.responseCode
      val stream = if (code in 200..299) conn.inputStream else conn.errorStream
      val body = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
      if (code !in 200..299) {
        error("GitHub HTTP $code: ${conn.responseMessage}")
      }
      body
    } finally {
      conn.disconnect()
    }
  }

  private fun writeAtomic(target: File, content: String) {
    target.parentFile?.mkdirs()
    val tmp = File(target.parentFile, "${target.name}.tmp")
    tmp.writeText(content, Charsets.UTF_8)
    if (!tmp.renameTo(target)) {
      target.writeText(content, Charsets.UTF_8)
      tmp.delete()
    }
  }

  private fun loadCachedShas(otaDir: File): MutableMap<String, String> {
    val f = File(otaDir, SHAS_FILENAME)
    if (!f.exists()) return mutableMapOf()
    return try {
      json.decodeFromString<Map<String, String>>(f.readText()).toMutableMap()
    } catch (_: Exception) {
      mutableMapOf()
    }
  }

  suspend fun syncAll(otaDir: File): ContentSyncResult = withContext(Dispatchers.IO) {
    otaDir.mkdirs()
    val treeUrl = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/trees/$BRANCH?recursive=1"
    val treeBody = httpGetText(treeUrl, accept = "application/vnd.github+json")
    val treeResp = json.decodeFromString<GitTreeResponse>(treeBody)

    val cachedShas = loadCachedShas(otaDir)
    val trackedEntries = treeResp.tree.filter {
      it.type == "blob" && mapRepoPathToLocalRelativePath(it.path) != null
    }

    val changed = computeChangedEntries(trackedEntries, cachedShas).filter { (_, localRel) ->
      // Also download if file is missing locally even if SHA was recorded
      true
    }.let { list ->
      val missingOnDisk = trackedEntries.mapNotNull { entry ->
        val localRel = mapRepoPathToLocalRelativePath(entry.path) ?: return@mapNotNull null
        val target = File(otaDir, localRel)
        if (!target.exists() || target.length() == 0L) (entry to localRel) else null
      }
      (list + missingOnDisk).distinctBy { it.first.path }
    }

    var updatedCount = 0
    for ((entry, localRel) in changed) {
      val rawUrl = "https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/$BRANCH/${entry.path}"
      val content = httpGetText(rawUrl)
      if (content.isNotBlank()) {
        writeAtomic(File(otaDir, localRel), content)
        cachedShas[entry.path] = entry.sha
        updatedCount++
      }
    }

    writeAtomic(File(otaDir, SHAS_FILENAME), json.encodeToString(cachedShas))

    ContentSyncResult(
      treeSha = treeResp.sha,
      updatedCount = updatedCount,
      totalTracked = trackedEntries.size,
      syncedAtIso = SrsEngine.toIsoString(System.currentTimeMillis()),
    )
  }

  suspend fun refreshSingleMarkdown(
    otaDir: File,
    itemType: String,
    itemId: String,
  ): Boolean = withContext(Dispatchers.IO) {
    otaDir.mkdirs()
    val folder = if (itemType == "fundamental") "fundamentals" else "sessions"
    val cleanId = itemId.removeSuffix(".md")
    val relPath = "content/$folder/$cleanId.md"
    val rawUrl = "https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/$BRANCH/src/$relPath"
    val content = httpGetText(rawUrl)
    if (content.isBlank()) return@withContext false
    writeAtomic(File(otaDir, relPath), content)
    true
  }
}
