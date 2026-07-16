import { addDocument } from '@/hooks/use-firestore';

export async function sendEmail(
  userId: string | null,
  recipientEmail: string,
  subject: string,
  body: string
): Promise<boolean> {
  console.log(`[EMAIL SENT] To: ${recipientEmail} | Subject: ${subject}\nBody: ${body}`);

  if (typeof window !== 'undefined') {
    const log = localStorage.getItem('coopsync_notifications_log');
    const logs = log ? JSON.parse(log) : [];
    logs.unshift({
      id: `email_${Date.now()}`,
      userId,
      type: 'email',
      recipient: recipientEmail,
      title: subject,
      message: body,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('coopsync_notifications_log', JSON.stringify(logs));
    window.dispatchEvent(new Event('coopsync_notifications_changed'));
  }

  if (userId) {
    try {
      await addDocument('notifications', {
        userId,
        title: subject,
        message: body,
        type: 'info',
        read: false,
      });
    } catch (e) {
      console.error('Error adding user in-app notification:', e);
    }
  }

  return true;
}

export async function sendSMS(
  userId: string | null,
  phoneNumber: string,
  message: string
): Promise<boolean> {
  console.log(`[SMS SENT] To: ${phoneNumber} | Message: ${message}`);

  if (typeof window !== 'undefined') {
    const log = localStorage.getItem('coopsync_notifications_log');
    const logs = log ? JSON.parse(log) : [];
    logs.unshift({
      id: `sms_${Date.now()}`,
      userId,
      type: 'sms',
      recipient: phoneNumber,
      title: 'SMS Alert',
      message,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('coopsync_notifications_log', JSON.stringify(logs));
    window.dispatchEvent(new Event('coopsync_notifications_changed'));
  }

  return true;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<boolean> {
  console.log(`[PUSH NOTIFICATION] User: ${userId} | Title: ${title} | Body: ${body}`);

  if (typeof window !== 'undefined') {
    const log = localStorage.getItem('coopsync_notifications_log');
    const logs = log ? JSON.parse(log) : [];
    logs.unshift({
      id: `push_${Date.now()}`,
      userId,
      type: 'push',
      recipient: `User ID: ${userId}`,
      title,
      message: body,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('coopsync_notifications_log', JSON.stringify(logs));
    window.dispatchEvent(new Event('coopsync_notifications_changed'));
  }

  try {
    await addDocument('notifications', {
      userId,
      title,
      message: body,
      type: title.toLowerCase().includes('fail') || title.toLowerCase().includes('penalty') ? 'warning' : 'success',
      read: false,
    });
  } catch (e) {
    console.error('Error adding user in-app notification:', e);
  }

  return true;
}
