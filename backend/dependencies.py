from fastapi.security import OAuth2PasswordBearer

# login user to each time when they reach page
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


