package dev.lakshya.aisysdesign

import dev.lakshya.aisysdesign.data.GitHubContentSyncClient
import dev.lakshya.aisysdesign.data.GitTreeEntry
import dev.lakshya.aisysdesign.data.PortalRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.io.File
import java.nio.file.Files

class GitHubContentSyncTest {

  @Test
  fun mapsRepoPathsCorrectly() {
    assertEquals(
      "data/curriculum.json",
      GitHubContentSyncClient.mapRepoPathToLocalRelativePath("src/data/curriculum.json"),
    )
    assertEquals(
      "content/fundamentals/fund-01.md",
      GitHubContentSyncClient.mapRepoPathToLocalRelativePath("src/content/fundamentals/fund-01.md"),
    )
    assertEquals(
      "content/sessions/session-02.md",
      GitHubContentSyncClient.mapRepoPathToLocalRelativePath("src/content/sessions/session-02.md"),
    )
    assertNull(GitHubContentSyncClient.mapRepoPathToLocalRelativePath("README.md"))
    assertNull(GitHubContentSyncClient.mapRepoPathToLocalRelativePath("src/app/page.tsx"))
    assertNull(GitHubContentSyncClient.mapRepoPathToLocalRelativePath("src/data/nested/extra.json"))
  }

  @Test
  fun computesOnlyChangedEntries() {
    val entries = listOf(
      GitTreeEntry(path = "src/data/curriculum.json", type = "blob", sha = "sha-1"),
      GitTreeEntry(path = "src/content/sessions/session-02.md", type = "blob", sha = "sha-2-new"),
      GitTreeEntry(path = "src/content/sessions/session-03.md", type = "blob", sha = "sha-3"),
      GitTreeEntry(path = "src/content", type = "tree", sha = "tree-sha"),
      GitTreeEntry(path = "package.json", type = "blob", sha = "pkg-sha"),
    )
    val cached = mapOf(
      "src/data/curriculum.json" to "sha-1",
      "src/content/sessions/session-02.md" to "sha-2-old",
    )

    val changed = GitHubContentSyncClient.computeChangedEntries(entries, cached)
    assertEquals(
      listOf("src/content/sessions/session-02.md", "src/content/sessions/session-03.md"),
      changed.map { it.first.path },
    )
    assertEquals(
      listOf("content/sessions/session-02.md", "content/sessions/session-03.md"),
      changed.map { it.second },
    )
  }

  @Test
  fun readFromDirOrFallbackPrefersOtaFile() {
    val tempDir = Files.createTempDirectory("ota_test").toFile()
    try {
      val rel = "content/sessions/session-02.md"
      val fallbackResult = PortalRepository.readFromDirOrFallback(tempDir, rel) { "bundled-fallback" }
      assertEquals("bundled-fallback", fallbackResult)

      val otaFile = File(tempDir, rel)
      otaFile.parentFile?.mkdirs()
      otaFile.writeText("# Updated from GitHub")

      val otaResult = PortalRepository.readFromDirOrFallback(tempDir, rel) { "bundled-fallback" }
      assertEquals("# Updated from GitHub", otaResult)
    } finally {
      tempDir.deleteRecursively()
    }
  }
}
