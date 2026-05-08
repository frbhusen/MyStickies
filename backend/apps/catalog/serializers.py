from rest_framework import serializers

from apps.catalog.models import Category, Product, ProductImage, ProductVariation, Variation
from apps.catalog.utils import normalize_image_url


class CategoryTreeSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image_url"] = normalize_image_url(data.get("image_url"))
        return data

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "parent", "name", "slug", "description", "image_url", "price_adjustment", "is_active", "sort_order", "children"]

    def get_children(self, obj):
        queryset = obj.children.filter(is_active=True).order_by("sort_order", "name")
        return CategoryTreeSerializer(queryset, many=True, context=self.context).data


class ProductImageSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["public_url"] = normalize_image_url(data.get("public_url"))
        return data

    class Meta:
        model = ProductImage
        fields = ["id", "source_type", "public_url", "alt_text", "is_primary", "sort_order"]


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = ["id", "name", "sku", "attributes", "price", "is_default", "is_active", "sort_order"]


class VariationSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = Variation
        fields = ["id", "name", "slug", "price_adjustment", "attributes", "is_active", "sort_order", "effective_price"]

    def get_effective_price(self, obj):
        effective_base_price = self.context.get("effective_base_price")
        if effective_base_price is None:
            return obj.price_adjustment
        return effective_base_price + obj.price_adjustment


class ProductSerializer(serializers.ModelSerializer):
    variations = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    effective_base_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "slug",
            "short_description",
            "description",
            "base_price",
            "effective_base_price",
            "is_most_sold",
            "is_active",
            "is_featured",
            "sort_order",
            "variations",
            "images",
        ]

    def get_effective_base_price(self, obj):
        return obj.effective_base_price

    def get_variations(self, obj):
        serializer = VariationSerializer(
            obj.available_variations.filter(is_active=True).order_by("sort_order", "name"),
            many=True,
            context={**self.context, "effective_base_price": obj.effective_base_price},
        )
        return serializer.data
