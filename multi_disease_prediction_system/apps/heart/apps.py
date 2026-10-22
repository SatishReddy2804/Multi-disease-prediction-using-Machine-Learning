from django.apps import AppConfig


class HeartConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.heart"
    verbose_name = "Heart Disease Prediction"
