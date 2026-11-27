package dev.lakshya.aisysdesign.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import dev.lakshya.aisysdesign.MainActivity
import dev.lakshya.aisysdesign.R
import dev.lakshya.aisysdesign.data.SrsEngine
import dev.lakshya.aisysdesign.data.model.Flashcard
import dev.lakshya.aisysdesign.data.model.SyncedStudyState
import kotlinx.serialization.json.Json
import java.io.File

class StudyReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    StudyReminderManager.showDueNotification(context)
  }
}

object StudyReminderManager {
  const val CHANNEL_ID = "sysdesign_study_reminders"
  private const val NOTIFICATION_ID = 1001
  private const val REQUEST_CODE = 2001

  private val json = Json { ignoreUnknownKeys = true; isLenient = true }

  fun ensureChannel(context: Context) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Daily Study Reminders",
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = "Gentle daily reminders when flashcards are due or to keep your 10-week prep moving."
    }
    nm.createNotificationChannel(channel)
  }

  fun scheduleDailyReminder(context: Context, hour: Int, minute: Int) {
    ensureChannel(context)
    val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
    val intent = Intent(context, StudyReminderReceiver::class.java)
    val pi = PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val cal = java.util.Calendar.getInstance().apply {
      set(java.util.Calendar.HOUR_OF_DAY, hour)
      set(java.util.Calendar.MINUTE, minute)
      set(java.util.Calendar.SECOND, 0)
      set(java.util.Calendar.MILLISECOND, 0)
      if (timeInMillis <= System.currentTimeMillis()) {
        add(java.util.Calendar.DAY_OF_YEAR, 1)
      }
    }

    am.setInexactRepeating(
      android.app.AlarmManager.RTC_WAKEUP,
      cal.timeInMillis,
      android.app.AlarmManager.INTERVAL_DAY,
      pi,
    )
  }

  fun cancelReminder(context: Context) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
    val intent = Intent(context, StudyReminderReceiver::class.java)
    val pi = PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    am.cancel(pi)
  }

  fun showDueNotification(context: Context) {
    ensureChannel(context)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val granted = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.POST_NOTIFICATIONS,
      ) == PackageManager.PERMISSION_GRANTED
      if (!granted) return
    }

    val (dueCount, doneCount) = readDueSummary(context)
    val title = if (dueCount > 0) "$dueCount flashcards due for review" else "Keep your 100x prep moving"
    val body = if (dueCount > 0) {
      "Tap for a 3-minute spaced-repetition sprint ($doneCount topics completed)."
    } else {
      "Open Today's focus topic or try a 2 AM failure quiz."
    }

    val launchIntent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val contentPi = PendingIntent.getActivity(
      context,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notif = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_launcher_foreground)
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setAutoCancel(true)
      .setContentIntent(contentPi)
      .build()

    NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notif)
  }

  private fun readDueSummary(context: Context): Pair<Int, Int> {
    return try {
      val cardsRaw = context.assets.open("data/flashcards.json").bufferedReader().use { it.readText() }
      val cards = json.decodeFromString<List<Flashcard>>(cardsRaw)
      val stateFile = File(context.filesDir, "study_progress_v2.json")
      val state = if (stateFile.exists()) {
        json.decodeFromString<SyncedStudyState>(stateFile.readText())
      } else {
        SyncedStudyState()
      }
      val now = System.currentTimeMillis()
      val due = cards.count { SrsEngine.isCardDue(state.flashcardSRS[it.id], now) }
      due to state.completedItems.size
    } catch (_: Exception) {
      0 to 0
    }
  }
}
