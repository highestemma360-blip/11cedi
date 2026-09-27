import os
from pathlib import Path

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "10080"))
ALLOWED_ORIGINS = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
ADMIN_PHONE = os.getenv("ADMIN_PHONE", "0200000000")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
CURRENCY = "GHS"

PERSIST_ROOT = Path(os.getenv("PERSIST_ROOT", "/var/data"))
LOCAL_DATA = Path(os.getenv("LOCAL_DATA_DIR", "/app/data"))


def _ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sqlite_url(path: Path) -> str:
    """Absolute SQLite URL for SQLAlchemy (sqlite:////abs/path)."""
    abs_path = path if path.is_absolute() else path.resolve()
    return "sqlite:///" + abs_path.as_posix()


def resolve_database_url() -> str:
    env = (os.getenv("DATABASE_URL") or "").strip()
    if env:
        if env.startswith("sqlite:"):
            # Ensure the parent directory exists for file-based SQLite URLs.
            if env.startswith("sqlite:////"):
                file_path = Path("/" + env[len("sqlite:////"):])
            elif env.startswith("sqlite:///"):
                rest = env[len("sqlite:///"):]
                file_path = Path(rest)
            else:
                file_path = None
            if file_path is not None:
                try:
                    _ensure_dir(file_path.parent)
                except OSError:
                    pass
        return env

    # Prefer Render persistent disk when available / writable.
    try:
        _ensure_dir(PERSIST_ROOT)
        return _sqlite_url(PERSIST_ROOT / "cedigain.db")
    except OSError:
        pass

    return _sqlite_url(_ensure_dir(LOCAL_DATA) / "cedigain.db")


def resolve_upload_dir() -> str:
    env = (os.getenv("UPLOAD_DIR") or "").strip()
    if env:
        try:
            _ensure_dir(Path(env))
        except OSError:
            pass
        return env
    try:
        return str(_ensure_dir(PERSIST_ROOT / "uploads"))
    except OSError:
        return str(_ensure_dir(LOCAL_DATA / "uploads"))


DATABASE_URL = resolve_database_url()
UPLOAD_DIR = resolve_upload_dir()
PERSISTENT = "/var/data" in DATABASE_URL or (os.getenv("DATABASE_URL") or "").find("/var/data") >= 0

DEFAULTS = {
    "min_deposit": "100",
    "min_withdrawal": "50",
    "withdrawal_fee": "16",
    "merchant_name": "CEDIGAIN",
    "merchant_number": "0550000000",
    "merchant_account_name": "CEDIGAIN",
    "merchant_network": "MTN",
    "merchant_instructions": "Send the exact amount from the MoMo account entered. Keep your confirmation message until approval.",
    "signup_bonus": "10",
    "referral_l1": "20",
    "referral_l2": "10",
    "referral_l3": "3",
    "ad_reward": "0.50",
    "telegram_link": "https://t.me/cedigain",
    "whatsapp_link": "https://wa.me/233000000000",
    "login_reward": "0.20",
    "deposit_disclaimer": "Automated payment processing is temporarily unavailable. We are working hard to restore automatic verification. For now, all deposits are verified manually — your funds will be credited once an admin confirms your payment. Thank you for your patience.",
}
