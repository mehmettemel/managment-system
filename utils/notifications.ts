/**
 * Notification Utilities
 * Helper functions for showing toast notifications using Mantine
 */

import { notifications } from '@mantine/notifications'

/**
 * Show a success notification
 */
export function showSuccess(message: string, title = 'Başarılı') {
  notifications.show({
    title,
    message,
    color: 'green',
    autoClose: 3000,
  })
}

/**
 * Show an error notification
 */
export function showError(message: string, title = 'Hata') {
  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: 5000,
  })
}

/**
 * Show an info notification
 */
export function showInfo(message: string, title = 'Bilgi') {
  notifications.show({
    title,
    message,
    color: 'blue',
    autoClose: 4000,
  })
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, title = 'Uyarı') {
  notifications.show({
    title,
    message,
    color: 'yellow',
    autoClose: 4000,
  })
}

/**
 * Show a loading notification that can be updated
 */
export function showLoading(message: string, id: string, title = 'İşleniyor') {
  notifications.show({
    id,
    title,
    message,
    loading: true,
    autoClose: false,
    withCloseButton: false,
  })
}

/**
 * Update a loading notification to success
 */
export function updateToSuccess(
  id: string,
  message: string,
  title = 'Başarılı'
) {
  notifications.update({
    id,
    title,
    message,
    color: 'green',
    loading: false,
    autoClose: 3000,
  })
}

/**
 * Update a loading notification to error
 */
export function updateToError(id: string, message: string, title = 'Hata') {
  notifications.update({
    id,
    title,
    message,
    color: 'red',
    loading: false,
    autoClose: 5000,
  })
}
