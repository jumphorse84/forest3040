const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

// ─── Helper: Get all FCM tokens from active users ───────────────────────
async function getAllUserTokens() {
  const db = getFirestore();
  const usersSnap = await db.collection("users").get();
  const tokens = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    // Skip users who have disabled all notifications
    if (data.notif_all === false) continue;
    if (Array.isArray(data.fcm_tokens)) {
      tokens.push(...data.fcm_tokens);
    }
  }

  // Deduplicate
  return [...new Set(tokens)];
}

// ─── Helper: Send multicast notification ────────────────────────────────
async function sendPushNotification(tokens, title, body, category = "general") {
  if (!tokens || tokens.length === 0) {
    console.log("[FCM] No tokens to send to.");
    return;
  }

  const messaging = getMessaging();
  const chunkSize = 500; // FCM limit is 500 per batch
  const chunks = [];

  for (let i = 0; i < tokens.length; i += chunkSize) {
    chunks.push(tokens.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const message = {
      tokens: chunk,
      notification: { title, body },
      data: { category, click_action: "FLUTTER_NOTIFICATION_CLICK" },
      android: {
        priority: "high",
        notification: {
          channelId: "forest_default",
          icon: "ic_notification",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      webpush: {
        fcmOptions: {
          link: "https://forest3040-6f109.web.app",
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      console.log(
        `[FCM] Sent ${response.successCount}/${chunk.length} messages`
      );

      // Clean up invalid tokens
      const db = getFirestore();
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === "messaging/registration-token-not-registered" ||
            errCode === "messaging/invalid-registration-token"
          ) {
            failedTokens.push(chunk[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        console.log(`[FCM] Removing ${failedTokens.length} invalid tokens`);
        const usersSnap = await db.collection("users").get();
        for (const userDoc of usersSnap.docs) {
          const userTokens = userDoc.data().fcm_tokens || [];
          const validTokens = userTokens.filter(
            (t) => !failedTokens.includes(t)
          );
          if (validTokens.length !== userTokens.length) {
            await userDoc.ref.update({ fcm_tokens: validTokens });
          }
        }
      }
    } catch (error) {
      console.error("[FCM] Send error:", error);
    }
  }
}

// ─── Helper: Save Notification History ──────────────────────────────────
async function saveNotificationHistory(title, body, category, linkId) {
  try {
    const db = getFirestore();
    await db.collection("notifications").add({
      title,
      body,
      category,
      linkId,
      createdAt: new Date().toISOString()
    });
    console.log("[FCM] Notification history saved.");
  } catch (error) {
    console.error("[FCM] Error saving notification history:", error);
  }
}

// ─── Trigger 1: 가족 소식 등록 ─────────────────────────────────────────
exports.onFamilyNewsCreated = onDocumentCreated(
  "family_news/{newsId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const categoryLabels = {
      new_member: "🎉 새가족이 함께 합니다!",
      pregnancy: "👼 생명의 축복 소식!",
      childbirth: "🍼 출산 축하 소식!",
      wedding: "💍 결혼 축하 소식!",
      etc: "📬 특별한 소식",
    };

    const title = categoryLabels[data.category] || "🌿 우리 숲 가족 소식";
    const body = data.title || "새로운 소식을 확인해보세요.";

    const tokens = await getAllUserTokens();

    // Filter: skip users who disabled community notifications
    const db = getFirestore();
    const usersSnap = await db.collection("users").get();
    const communityOffUids = new Set();
    usersSnap.docs.forEach((doc) => {
      if (doc.data().notif_community === false) communityOffUids.add(doc.id);
    });

    await sendPushNotification(tokens, title, body, "family_news");
    await saveNotificationHistory(title, body, "family_news", event.params.newsId);
  }
);

// ─── Trigger 2: 새 일정 등록 ───────────────────────────────────────────
exports.onScheduleCreated = onDocumentCreated(
  "schedules/{scheduleId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const title = "📅 새 일정이 추가되었습니다";
    const body = data.title || "확인해보세요.";

    const tokens = await getAllUserTokens();
    await sendPushNotification(tokens, title, body, "schedule");
    await saveNotificationHistory(title, body, "schedule", event.params.scheduleId);
  }
);

// ─── Trigger 3: 새 설문 등록 ───────────────────────────────────────────
exports.onSurveyCreated = onDocumentCreated(
  "surveys/{surveyId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || data.status !== "active") return;

    const title = "📋 새 설문이 도착했습니다!";
    const body = data.title
      ? `"${data.title}"에 참여해주세요.`
      : "여러분의 소중한 의견을 남겨주세요.";

    const tokens = await getAllUserTokens();
    await sendPushNotification(tokens, title, body, "survey");
    await saveNotificationHistory(title, body, "survey", event.params.surveyId);
  }
);
