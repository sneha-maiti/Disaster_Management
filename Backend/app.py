from main import app


# -----------------------------------------
# IMPORT ADDITIONAL ROUTERS
# -----------------------------------------

from routes.dashboard_routes import router as dashboard_router
from routes.disaster_routes import router as disaster_router
from routes.auth_routes import router as auth_router


# -----------------------------------------
# CONNECT ROUTERS TO EXISTING APPLICATION
# -----------------------------------------

app.include_router(
    dashboard_router
)

app.include_router(
    disaster_router
)

app.include_router(
    auth_router
)