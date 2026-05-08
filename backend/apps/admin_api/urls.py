from django.urls import path

from apps.admin_api.views import AdminLoginView

urlpatterns = [
    path("auth/login/", AdminLoginView.as_view(), name="admin-login"),
]
