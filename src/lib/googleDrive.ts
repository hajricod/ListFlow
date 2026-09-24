import { ShoppingList, ListGroup, ListItem, Language } from '../types';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

export interface WorkspaceBackupData {
  version: string;
  type: string;
  exportedAt: string;
  language?: Language;
  lists: ShoppingList[];
  groups: ListGroup[];
  items: ListItem[];
}

/**
 * List all List Flow backup files from the user's Google Drive.
 * Scope: https://www.googleapis.com/auth/drive.file
 */
export async function listGoogleDriveBackups(token: string): Promise<DriveBackupFile[]> {
  try {
    const query = encodeURIComponent("name contains 'listflow-backup' and trashed = false");
    const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, size)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch backups (${response.status})`);
    }

    const data = await response.json();
    return (data.files || []) as DriveBackupFile[];
  } catch (error) {
    console.error('Google Drive list error:', error);
    throw error;
  }
}

/**
 * Upload a new backup JSON file to the user's Google Drive.
 * Uses standard multipart upload.
 */
export async function uploadGoogleDriveBackup(
  token: string,
  backupData: WorkspaceBackupData
): Promise<DriveBackupFile> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `listflow-backup-${today}-${timeStr}.json`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'List Flow Workspace Backup',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(backupData, null, 2) +
      closeDelimiter;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,modifiedTime,size';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to upload backup (${response.status})`);
    }

    return (await response.json()) as DriveBackupFile;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}

/**
 * Download a backup file from Google Drive and parse as WorkspaceBackupData.
 */
export async function downloadGoogleDriveBackup(
  token: string,
  fileId: string
): Promise<WorkspaceBackupData> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to download backup (${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data.groups) || !Array.isArray(data.items)) {
      throw new Error('Invalid List Flow backup structure');
    }

    return data as WorkspaceBackupData;
  } catch (error) {
    console.error('Google Drive download error:', error);
    throw error;
  }
}

/**
 * Delete a backup file from Google Drive.
 * (MUST be accompanied by user confirmation before invocation!)
 */
export async function deleteGoogleDriveBackup(token: string, fileId: string): Promise<void> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete backup (${response.status})`);
    }
  } catch (error) {
    console.error('Google Drive delete error:', error);
    throw error;
  }
}
