from rest_framework.routers import DefaultRouter

from apps.catalog.admin_views import (
    AdminCategoryViewSet,
    AdminProductImageViewSet,
    AdminProductViewSet,
    AdminVariationViewSet,
)

router = DefaultRouter()
router.register(r"categories", AdminCategoryViewSet, basename="admin-categories")
router.register(r"products", AdminProductViewSet, basename="admin-products")
router.register(r"variations", AdminVariationViewSet, basename="admin-variations")
router.register(r"images", AdminProductImageViewSet, basename="admin-images")

urlpatterns = router.urls
