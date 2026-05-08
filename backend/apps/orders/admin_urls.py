from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.orders.views import AdminOrderViewSet

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")

urlpatterns = router.urls
