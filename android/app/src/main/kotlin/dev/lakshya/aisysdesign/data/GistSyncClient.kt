package dev.lakshya.aisysdesign.data

import dev.lakshya.aisysdesign.data.model.GitHubUserInfo
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

class GistSyncClient {

  companion object {
    const val GIST_FILENAME = "ai-system-design-sync.json"
    const val GIST_DESCRIPTION =
      "[AI System Design Portal] Study Progress, Notes & Highlights Cloud Sync"
  }

  private val json = Json {
    ignoreUnknownKeys = true
    isLenient = true
    encodeDefaults = true
    prettyPrint = true
  }

  @Serializable
  private data class GistSummary(
    val id: String,
    val html_url: String = "",
    val description: String? = null,
    val files: Map<String, GistFileSummary> = emptyMap(),
  )

  @Serializable
  private data class GistFileSummary(
    val filename: String = "",
    val content: String? = null,
  )

  @Serializable
  private data class GistCreateRequest(
    val description: String,
    @SerialName("public") val isPublic: Boolean,
    val files: Map<String, GistFilePayload>,
  )

  @Serializable
  private data class GistPatchRequest(
    val description: String,
    val files: Map<String, GistFilePayload>,
  )

  @Serializable
  private data class GistFilePayload(
    val content: String,
  )

  private data class HttpResult(
    val code: Int,
    val message: String,
    val body: String,
    val scopesHeader: String,
  )

  private fun request(
    method: String,
    urlStr: String,
    token: String,
    body: String? = null,
  ): HttpResult {
    val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
      requestMethod = method
      connectTimeout = 12_000
      readTimeout = 15_000
      setRequestProperty("Accept", "application/vnd.github+json")
      setRequestProperty("Authorization", "Bearer ${token.trim()}")
      setRequestProperty("X-GitHub-Api-Version", "2022-11-28")
      if (body != null) {
        doOutput = true
        setRequestProperty("Content-Type", "application/json; charset=utf-8")
      }
    }

    return try {
      if (body != null) {
        conn.outputStream.use { os ->
          os.write(body.toByteArray(Charsets.UTF_8))
        }
      }
      val code = conn.responseCode
      val stream = if (code in 200..299) conn.inputStream else conn.errorStream
      val respBody = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
      val scopes = conn.getHeaderField("x-oauth-scopes").orEmpty()
      HttpResult(code, conn.responseMessage.orEmpty(), respBody, scopes)
    } finally {
      conn.disconnect()
    }
  }

  suspend fun validateToken(token: String): GitHubUserInfo = withContext(Dispatchers.IO) {
    val clean = token.trim()
    require(clean.isNotEmpty()) { "Token cannot be empty." }

    val res = request("GET", "https://api.github.com/user", clean)
    if (res.code == 401) {
      error("Invalid GitHub token. Please check your Personal Access Token.")
    }
    if (res.code !in 200..299) {
      error("GitHub API error (${res.code}): ${res.message}")
    }
    if (res.scopesHeader.isNotBlank() && !res.scopesHeader.contains("gist")) {
      error("This token lacks the 'gist' scope. Enable 'gist' permission on your PAT.")
    }

    json.decodeFromString<GitHubUserInfo>(res.body)
  }

  suspend fun findOrCreateSyncGist(
    token: String,
    initialState: SyncedStudyState,
  ): Triple<String, String, SyncedStudyState?> = withContext(Dispatchers.IO) {
    val listRes = request("GET", "https://api.github.com/gists?per_page=100", token)
    if (listRes.code !in 200..299) {
      error("Failed to list gists (${listRes.code}): ${listRes.message}")
    }

    val gists = json.decodeFromString<List<GistSummary>>(listRes.body)
    val found = gists.firstOrNull { g ->
      g.files.containsKey(GIST_FILENAME) ||
        (g.description?.contains("[AI System Design Portal]") == true)
    }

    if (found != null) {
      val detailRes = request("GET", "https://api.github.com/gists/${found.id}", token)
      if (detailRes.code in 200..299) {
        val detail = json.decodeFromString<GistSummary>(detailRes.body)
        val content = detail.files[GIST_FILENAME]?.content
        val remoteState =
          if (!content.isNullOrBlank()) {
            runCatching { json.decodeFromString<SyncedStudyState>(content) }.getOrNull()
          } else {
            null
          }
        return@withContext Triple(found.id, found.html_url, remoteState)
      }
    }

    val payload = GistCreateRequest(
      description = GIST_DESCRIPTION,
      isPublic = false,
      files = mapOf(
        GIST_FILENAME to GistFilePayload(json.encodeToString(SyncedStudyState.serializer(), initialState))
      ),
    )
    val createRes = request(
      "POST",
      "https://api.github.com/gists",
      token,
      json.encodeToString(GistCreateRequest.serializer(), payload),
    )
    if (createRes.code !in 200..299) {
      error("Failed to create private gist (${createRes.code}): ${createRes.message}")
    }

    val created = json.decodeFromString<GistSummary>(createRes.body)
    Triple(created.id, created.html_url, initialState)
  }

  suspend fun fetchFromGist(
    token: String,
    gistId: String,
  ): Pair<SyncedStudyState, String> = withContext(Dispatchers.IO) {
    val res = request("GET", "https://api.github.com/gists/$gistId", token)
    if (res.code !in 200..299) {
      error("Failed to fetch gist (${res.code}): ${res.message}")
    }

    val detail = json.decodeFromString<GistSummary>(res.body)
    val content = detail.files[GIST_FILENAME]?.content
      ?: error("File $GIST_FILENAME not found inside gist $gistId")
    val state = json.decodeFromString<SyncedStudyState>(content)
    state to detail.html_url
  }

  suspend fun pushToGist(
    token: String,
    gistId: String,
    state: SyncedStudyState,
  ) = withContext(Dispatchers.IO) {
    val payload = GistPatchRequest(
      description = GIST_DESCRIPTION,
      files = mapOf(
        GIST_FILENAME to GistFilePayload(json.encodeToString(SyncedStudyState.serializer(), state))
      ),
    )
    val res = request(
      "PATCH",
      "https://api.github.com/gists/$gistId",
      token,
      json.encodeToString(GistPatchRequest.serializer(), payload),
    )
    if (res.code !in 200..299) {
      error("Failed to update gist (${res.code}): ${res.message}")
    }
  }
}
