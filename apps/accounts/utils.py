import logging
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that guarantees no internal stack traces
    or sensitive system paths are leaked to client responses in production.
    """
    # Call REST framework's default exception handler first to get standard error response.
    response = exception_handler(exc, context)

    view_name = ""
    if context and "view" in context:
        view_name = context["view"].__class__.__name__

    if response is not None:
        # Standardize DRF error response
        custom_data = {
            "status": "error",
            "status_code": response.status_code,
            "error": response.data,
        }
        response.data = custom_data
        return response

    # If response is None, this is an unhandled exception (500)
    logger.exception(
        f"Unhandled exception in view '{view_name}': {str(exc)}",
        exc_info=True,
        extra={"context": str(context)},
    )

    if settings.DEBUG:
        error_detail = {
            "status": "error",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "error": "Internal Server Error",
            "details": str(exc),
            "view": view_name,
        }
    else:
        error_detail = {
            "status": "error",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "error": "An internal server error occurred. Please contact technical support.",
        }

    return Response(error_detail, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
