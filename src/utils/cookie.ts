// eslint-disable-next-line import/prefer-default-export
export function getAvailableCookies() {
  const cookies : Map<string, string> = new Map<string, string>();
  // Split by semicolon
  const cookieParts = document.cookie.split(';');

  for (let i = 0; i < cookieParts.length; i += 1) {
    // 1. Find the first "=" only to avoid the "Equals Sign" bug
    const part = cookieParts[i];
    const separatorIndex = part.indexOf('=');

    // If no "=" is found, it's an invalid cookie format; skip it
    if (separatorIndex === -1) continue;

    // 2. Extract and Trim
    const key = part.substring(0, separatorIndex).trim();
    const value = part.substring(separatorIndex + 1).trim();

    // 3. Decode URI components
    try {
      cookies.set(decodeURIComponent(key), decodeURIComponent(value));
    } catch (e) {
      // Fallback if decoding fails
      cookies.set(key, value);
    }
  }
  return cookies;
}
