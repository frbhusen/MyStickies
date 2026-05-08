from django.urls import include, path

urlpatterns = [
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/admin/", include("apps.catalog.admin_urls")),
    path("api/admin/", include("apps.orders.admin_urls")),
    path("api/admin/", include("apps.admin_api.urls")),
]
