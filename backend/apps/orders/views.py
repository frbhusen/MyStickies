from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import OrderCreateSerializer, OrderSerializer


class PublicOrderCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=201)


class AdminOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.prefetch_related("items")
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(Order.Status.choices):
            return Response({"detail": "Invalid status."}, status=400)
        order.status = status_value
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["get"])
    def whatsapp(self, request, pk=None):
        order = self.get_object()
        return Response({
            "phone_number": order.normalized_phone_number,
            "whatsapp_link": order.whatsapp_link,
        })
