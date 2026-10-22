"""
URL configuration for Multi-Disease Prediction System.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.dashboard.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Health checks for deployment / monitoring
    path("health/", HealthCheckView.as_view(), name="root_health"),
    path("api/health/", HealthCheckView.as_view(), name="api_health"),
    # API endpoints
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.dashboard.urls")),
    path("api/predict/", include("apps.heart.urls")),
    path("api/predict/", include("apps.diabetes.urls")),
    path("api/predict/", include("apps.parkinsons.urls")),
    path("api/predict/", include("apps.liver.urls")),
    path("api/", include("apps.triage.urls")),
    path("api/", include("apps.uncertainty.urls")),
    path("api/", include("apps.what_if.urls")),
    path("api/", include("apps.cross_risk.urls")),
    path("api/", include("apps.data_quality.urls")),
    path("api/", include("apps.reports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
