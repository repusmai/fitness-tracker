// ── Google Drive Backup & Restore ─────────────────────────────────────────────
//
// SETUP REQUIRED (one-time):
//   1. Go to console.cloud.google.com
//   2. Create a new project → APIs & Services → Credentials
//   3. Create an OAuth 2.0 Client ID → Web application
//   4. Add your deployed URL to "Authorised JavaScript origins"
//      e.g. https://yourusername.github.io
//   5. Replace the placeholder below with your actual Client ID.
//
function getGoogleClientId() { return localStorage.getItem("google_client_id") || ""; }
function setGoogleClientId(id) { localStorage.setItem("google_client_id", id.trim()); }
const DRIVE_SCOPE      = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILE_NAME  = "fitness-tracker-backup.json";

let _googleApisLoaded = false;
let _tokenClient      = null;
let _accessToken      = null;

function loadGoogleAPIs() {
  return new Promise(resolve => {
    if (_googleApisLoaded) { resolve(); return; }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => { _googleApisLoaded = true; resolve(); };
    script.onerror = () => resolve(); // Fail gracefully if offline
    document.head.appendChild(script);
  });
}

async function getAccessToken() {
  if (_accessToken) return _accessToken;

  await loadGoogleAPIs();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services failed to load");
  }

  return new Promise((resolve, reject) => {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: getGoogleClientId(),
      scope: DRIVE_SCOPE,
      callback: response => {
        if (response.error) { reject(new Error(response.error)); return; }
        _accessToken = response.access_token;
        // Clear the token ~1 minute before it actually expires
        setTimeout(() => { _accessToken = null; }, (response.expires_in - 60) * 1000);
        resolve(_accessToken);
      },
    });
    _tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function findDriveFile(token) {
  const query = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and not trashed`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const result = await response.json();
  return result.files?.[0] || null;
}

async function uploadToDrive(data) {
  const token    = await getAccessToken();
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const existing = await findDriveFile(token);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: DRIVE_FILE_NAME })], { type: 'application/json' }));
  form.append('file', jsonBlob);

  const url    = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const method = existing ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) throw new Error('Drive upload failed');

  // Record the backup timestamp in localStorage
  try {
    const prefs = getDrivePrefs();
    prefs.lastBackup = Date.now();
    saveDrivePrefs(prefs);
  } catch (_) {}
}

async function restoreFromDrive() {
  const token = await getAccessToken();
  const file  = await findDriveFile(token);
  if (!file) throw new Error('No backup found on Drive');

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Drive download failed');

  const text   = await response.text();
  const parsed = JSON.parse(text);

  if (!parsed.workouts || !parsed.exercises) {
    throw new Error('Invalid backup format');
  }

  return { data: parsed, modifiedTime: file.modifiedTime };
}
