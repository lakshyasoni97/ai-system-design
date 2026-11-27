package dev.lakshya.aisysdesign.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

enum class ThemeMode(val label: String) {
  SYSTEM("System"),
  LIGHT("Light"),
  DARK("Dark"),
}

data class UserPrefs(
  val themeMode: ThemeMode = ThemeMode.SYSTEM,
  val useDynamicColor: Boolean = true,
  val reminderEnabled: Boolean = false,
  val reminderHour: Int = 20,
  val reminderMinute: Int = 30,
)

class UserPreferencesRepository(context: Context) {
  private val prefs = context.getSharedPreferences("sysdesign_user_prefs_v1", Context.MODE_PRIVATE)

  private val _userPrefs = MutableStateFlow(loadPrefs())
  val userPrefs: StateFlow<UserPrefs> = _userPrefs.asStateFlow()

  private fun loadPrefs(): UserPrefs {
    val modeName = prefs.getString("theme_mode", ThemeMode.SYSTEM.name) ?: ThemeMode.SYSTEM.name
    val mode = runCatching { ThemeMode.valueOf(modeName) }.getOrDefault(ThemeMode.SYSTEM)
    return UserPrefs(
      themeMode = mode,
      useDynamicColor = prefs.getBoolean("dynamic_color", true),
      reminderEnabled = prefs.getBoolean("reminder_enabled", false),
      reminderHour = prefs.getInt("reminder_hour", 20),
      reminderMinute = prefs.getInt("reminder_minute", 30),
    )
  }

  fun setThemeMode(mode: ThemeMode) {
    prefs.edit().putString("theme_mode", mode.name).apply()
    _userPrefs.update { it.copy(themeMode = mode) }
  }

  fun setDynamicColor(enabled: Boolean) {
    prefs.edit().putBoolean("dynamic_color", enabled).apply()
    _userPrefs.update { it.copy(useDynamicColor = enabled) }
  }

  fun setReminder(enabled: Boolean, hour: Int = _userPrefs.value.reminderHour, minute: Int = _userPrefs.value.reminderMinute) {
    prefs.edit()
      .putBoolean("reminder_enabled", enabled)
      .putInt("reminder_hour", hour)
      .putInt("reminder_minute", minute)
      .apply()
    _userPrefs.update {
      it.copy(reminderEnabled = enabled, reminderHour = hour, reminderMinute = minute)
    }
  }

  fun saveScrollPosition(articleId: String, firstVisibleIndex: Int) {
    prefs.edit().putInt("scroll_$articleId", firstVisibleIndex).apply()
  }

  fun getScrollPosition(articleId: String): Int {
    return prefs.getInt("scroll_$articleId", 0)
  }
}
