import { getMessaging } from 'firebase-admin/messaging'

export async function sendPushNotification({
  tokens,
  title,
  body,
  data
}: {
  tokens: string[]
  title: string
  body: string
  data: Record<string, string>
}) {
  if (tokens.length == 0) {
    return
  }

  const messaging = getMessaging()
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body
    },
    data
  })

  if (response.failureCount > 0) {
    console.warn(`[NOTIFICATION] ${response.failureCount} notifications failed`)
  }
}
