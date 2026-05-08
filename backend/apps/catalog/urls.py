from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import CategoryViewSet, ProductViewSet, search_view

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [path("search/", search_view, name="search")]
urlpatterns += router.urls
