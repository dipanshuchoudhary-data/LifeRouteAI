"""Shared constants. Keep product language honest."""

SAFE_ERROR = "Something went wrong. Please try again."
PROVIDER_BUSY = "Model provider is busy. Please try again later."
SAFE_EMERGENCY_ERROR = "Help request could not be prepared. Please call 108."
DEMO_NOTICE = "Emergency request prepared. Family notification is simulated in this demo. Please call 108 if you need an ambulance."

ALLOWED_IMAGE_MIMES = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})
ALLOWED_IMAGE_EXTS = frozenset({".jpg", ".jpeg", ".png", ".webp", ".gif"})
FORBIDDEN_EXTENSIONS = frozenset({
    ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".js", ".mjs",
    ".vbs", ".ps1", ".sh", ".php", ".py", ".jar", ".dll", ".html", ".htm", ".svg",
})

INTENT_APPOINTMENT = "appointment"
INTENT_HEALTH = "health"
INTENT_FAMILY = "family"
INTENT_MEMORY = "memory"
INTENT_FOOD = "food"
INTENT_EXPLAIN = "explain"
INTENT_HELP = "help"
INTENT_EMERGENCY = "emergency"
INTENT_TALK = "talk"
INTENT_DAY = "day"
