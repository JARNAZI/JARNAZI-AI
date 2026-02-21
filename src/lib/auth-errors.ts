export function mapAuthError(error: any, dict: any) {
    const d = dict.auth?.error || {};
    const message = error?.message || String(error);

    if (message.includes('Invalid login credentials')) {
        return d.invalidCredentials || 'Invalid login credentials';
    }
    if (message.includes('User not found')) {
        return d.userNotFound || 'User not found';
    }
    if (message.includes('User already registered') || message.includes('Email already taken')) {
        return d.userAlreadyExists || 'User already registered';
    }
    if (message.includes('Password is too short') || message.includes('weak_password')) {
        return d.weakPassword || 'Password is too weak';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
        return d.rateLimit || 'Too many attempts. Please try again later.';
    }
    if (message.includes('Network Error') || message.includes('Failed to fetch')) {
        return d.networkError || 'Network error. Please check your connection.';
    }

    // Fallback to localized generic error if possible, or original message
    return message;
}
