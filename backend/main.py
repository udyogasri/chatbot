# This allows running the application using both:
# `uvicorn app:app --reload` (specified in project requirements)
# and
# `uvicorn main:app --reload`

from app import app
