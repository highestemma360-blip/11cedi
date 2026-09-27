from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from .config import SECRET_KEY,ALGORITHM,ACCESS_TOKEN_MINUTES
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
def hash_password(v):
 v=v if isinstance(v,str) else str(v)
 if len(v.encode('utf-8'))>72: v=v.encode('utf-8')[:72].decode('utf-8','ignore')
 return pwd.hash(v)
def verify_password(v,h):
 v=v if isinstance(v,str) else str(v)
 if len(v.encode('utf-8'))>72: v=v.encode('utf-8')[:72].decode('utf-8','ignore')
 return pwd.verify(v,h)
def create_token(uid,version=0): return jwt.encode({'sub':str(uid),'ver':int(version or 0),'iat':datetime.now(timezone.utc),'exp':datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_MINUTES)},SECRET_KEY,algorithm=ALGORITHM)
def decode_token(token):
 try: return jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
 except JWTError: return None
