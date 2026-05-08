from decimal import Decimal

from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Product, Variation
from apps.orders.models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variation_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "variation_name", "quantity", "unit_price", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    whatsapp_link = serializers.ReadOnlyField()
    normalized_phone_number = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_full_name",
            "phone_number",
            "normalized_phone_number",
            "whatsapp_link",
            "city",
            "shipping_fee",
            "subtotal",
            "total",
            "status",
            "notes",
            "created_at",
            "updated_at",
            "items",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["customer_full_name", "phone_number", "city", "notes", "items"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")

        for item in value:
            product_id = item.get("product_id")
            variation_id = item.get("variation_id")
            if not Product.objects.filter(pk=product_id, is_active=True).exists():
                raise serializers.ValidationError(f"Product not found or inactive: {product_id}")

            if variation_id is not None:
                has_variation = Variation.objects.filter(
                    pk=variation_id,
                    is_active=True,
                    products__id=product_id,
                ).exists()
                if not has_variation:
                    raise serializers.ValidationError(
                        f"Variation {variation_id} is invalid for product {product_id}."
                    )
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        shipping_fee = Decimal(str(getattr(settings, "MY_STICKIES_SHIPPING_FEE", 100)))
        order = Order.objects.create(**validated_data)
        subtotal = Decimal("0")

        for item_data in items_data:
            product = Product.objects.get(pk=item_data["product_id"], is_active=True)
            variation = None
            unit_price = product.effective_base_price
            variation_name = ""

            variation_id = item_data.get("variation_id")
            if variation_id:
                variation = Variation.objects.get(pk=variation_id, is_active=True, products=product)
                unit_price = product.effective_base_price + variation.price_adjustment
                variation_name = variation.name

            quantity = item_data["quantity"]
            line_total = unit_price * quantity
            subtotal += line_total

            OrderItem.objects.create(
                order=order,
                product=product,
                variation=variation,
                product_name=product.name,
                variation_name=variation_name,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )

        order.subtotal = subtotal
        order.shipping_fee = shipping_fee
        order.total = subtotal + shipping_fee
        order.save(update_fields=["subtotal", "shipping_fee", "total", "updated_at"])
        return order
