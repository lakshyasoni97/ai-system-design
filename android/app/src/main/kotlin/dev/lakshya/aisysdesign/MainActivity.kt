package dev.lakshya.aisysdesign

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import dev.lakshya.aisysdesign.data.ThemeMode
import dev.lakshya.aisysdesign.ui.AppViewModel
import dev.lakshya.aisysdesign.ui.theme.SysDesignTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
    setContent {
      val vm: AppViewModel = viewModel()
      val prefs by vm.userPrefs.collectAsState()
      val darkTheme = when (prefs.themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
      }

      SysDesignTheme(
        darkTheme = darkTheme,
        dynamicColor = prefs.useDynamicColor,
      ) {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background,
        ) {
          MainNavigation(vm = vm)
        }
      }
    }
  }
}
