package dev.lakshya.aisysdesign.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val BuckwheatLightColorScheme = lightColorScheme(
  primary = SagePrimaryLight,
  onPrimary = OnSageLight,
  primaryContainer = SageContainerLight,
  onPrimaryContainer = OnSageContainerLight,
  secondary = TerracottaSecondaryLight,
  onSecondary = OnTerracottaLight,
  secondaryContainer = TerracottaContainerLight,
  onSecondaryContainer = OnTerracottaContainerLight,
  tertiary = AmberTertiaryLight,
  tertiaryContainer = AmberContainerLight,
  onTertiaryContainer = OnAmberContainerLight,
  background = OatBackgroundLight,
  onBackground = OatOnSurfaceLight,
  surface = OatBackgroundLight,
  onSurface = OatOnSurfaceLight,
  surfaceVariant = OatSurfaceLight,
  onSurfaceVariant = OatOnSurfaceVariantLight,
  outline = OatOutlineLight,
  outlineVariant = OatOutlineVariantLight,
  surfaceContainerLowest = OatBackgroundLight,
  surfaceContainerLow = OatSurfaceLowLight,
  surfaceContainer = OatSurfaceLight,
  surfaceContainerHigh = OatSurfaceHighLight,
  surfaceContainerHighest = OatSurfaceHighestLight,
)

private val BuckwheatDarkColorScheme = darkColorScheme(
  primary = SagePrimaryDark,
  onPrimary = OnSageDark,
  primaryContainer = SageContainerDark,
  onPrimaryContainer = OnSageContainerDark,
  secondary = TerracottaSecondaryDark,
  onSecondary = OnTerracottaDark,
  secondaryContainer = TerracottaContainerDark,
  onSecondaryContainer = OnTerracottaContainerDark,
  tertiary = AmberTertiaryDark,
  tertiaryContainer = AmberContainerDark,
  onTertiaryContainer = OnAmberContainerDark,
  background = CharcoalBackgroundDark,
  onBackground = CharcoalOnSurfaceDark,
  surface = CharcoalBackgroundDark,
  onSurface = CharcoalOnSurfaceDark,
  surfaceVariant = CharcoalSurfaceDark,
  onSurfaceVariant = CharcoalOnSurfaceVariantDark,
  outline = CharcoalOutlineDark,
  outlineVariant = CharcoalOutlineVariantDark,
  surfaceContainerLowest = CharcoalBackgroundDark,
  surfaceContainerLow = CharcoalSurfaceLowDark,
  surfaceContainer = CharcoalSurfaceDark,
  surfaceContainerHigh = CharcoalSurfaceHighDark,
  surfaceContainerHighest = CharcoalSurfaceHighestDark,
)

@Composable
fun SysDesignTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = true,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }
      darkTheme -> BuckwheatDarkColorScheme
      else -> BuckwheatLightColorScheme
    }

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content,
  )
}
