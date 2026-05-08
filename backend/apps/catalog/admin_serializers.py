from rest_framework import serializers

from apps.catalog.models import Category, Product, ProductImage, ProductVariation, ProductVariationLink, Variation
from apps.catalog.utils import extract_google_drive_file_id, normalize_image_url


class AdminCategorySerializer(serializers.ModelSerializer):
    def validate_image_url(self, value):
        return normalize_image_url(value)

    class Meta:
        model = Category
        fields = ["id", "parent", "name", "slug", "description", "image_url", "price_adjustment", "is_active", "sort_order"]


class AdminVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Variation
        fields = ["id", "name", "slug", "price_adjustment", "attributes", "is_active", "sort_order"]


class AdminProductSerializer(serializers.ModelSerializer):
    variation_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    image_url = serializers.CharField(write_only=True, required=False, allow_blank=True)
    primary_image_url = serializers.SerializerMethodField()
    variations = serializers.SerializerMethodField()

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
            "is_most_sold",
            "is_active",
            "is_featured",
            "sort_order",
            "variation_ids",
            "image_url",
            "primary_image_url",
            "variations",
        ]

    def get_variations(self, obj):
        return AdminVariationSerializer(obj.available_variations.filter(is_active=True).order_by("sort_order", "name"), many=True).data

    def get_primary_image_url(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.order_by("sort_order", "id").first()
        if not image:
            return ""
        return normalize_image_url(image.public_url)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Return image_url for edit forms so saved value is visible when reopening settings.
        data["image_url"] = data.get("primary_image_url") or ""
        return data

    def create(self, validated_data):
        variation_ids = validated_data.pop("variation_ids", [])
        image_url = normalize_image_url(validated_data.pop("image_url", ""))
        product = super().create(validated_data)
        self._set_variations(product, variation_ids)
        self._upsert_primary_image(product, image_url)
        return product

    def update(self, instance, validated_data):
        variation_ids = validated_data.pop("variation_ids", None)
        image_url = normalize_image_url(validated_data.pop("image_url", ""))
        product = super().update(instance, validated_data)
        if variation_ids is not None:
            self._set_variations(product, variation_ids)
        self._upsert_primary_image(product, image_url)
        return product

    def _set_variations(self, product, variation_ids):
        product.available_variations.set(Variation.objects.filter(id__in=variation_ids))

    def _upsert_primary_image(self, product, image_url):
        if not image_url:
            return
        existing = product.images.filter(public_url=image_url).first()
        if existing:
            if not existing.is_primary:
                existing.is_primary = True
                existing.save(update_fields=["is_primary"])
            return
        primary = product.images.filter(is_primary=True).first()
        if primary:
            primary.public_url = image_url
            primary.source_type = ProductImage.SourceType.MANUAL
            primary.save(update_fields=["public_url", "source_type"])
            return
        ProductImage.objects.create(
            product=product,
            source_type=ProductImage.SourceType.MANUAL,
            public_url=image_url,
            is_primary=True,
            sort_order=0,
        )

class AdminProductImageSerializer(serializers.ModelSerializer):
    def validate_public_url(self, value):
        return normalize_image_url(value)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["public_url"] = normalize_image_url(data.get("public_url"))
        if not data.get("drive_file_id"):
            data["drive_file_id"] = extract_google_drive_file_id(data.get("public_url"))
        return data

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "product",
            "source_type",
            "public_url",
            "drive_file_id",
            "drive_folder_id",
            "alt_text",
            "is_primary",
            "sort_order",
            "synced_at",
        ]
