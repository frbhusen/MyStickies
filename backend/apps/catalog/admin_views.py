import csv
import io

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.catalog.admin_serializers import (
    AdminCategorySerializer,
    AdminProductImageSerializer,
    AdminProductSerializer,
    AdminVariationSerializer,
)
from apps.catalog.models import Category, Product, ProductImage, ProductVariation, Variation
from apps.catalog.utils import normalize_image_url


def parse_bool(value, default=False):
    if value is None or value == "":
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related("parent").order_by("sort_order", "name")
    serializer_class = AdminCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").prefetch_related("available_variations", "images").order_by("sort_order", "name")
    serializer_class = AdminProductSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset.order_by("sort_order", "name")

    @action(detail=False, methods=["post"], url_path="bulk-import")
    @transaction.atomic
    def bulk_import(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "CSV file is required as 'file'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"detail": "CSV must be UTF-8 encoded."}, status=status.HTTP_400_BAD_REQUEST)

        reader = csv.DictReader(io.StringIO(content))
        raw_headers = [h.strip() for h in (reader.fieldnames or []) if h and h.strip()]
        header_fields = {h.lower() for h in raw_headers}

        if not raw_headers:
            return Response(
                {"detail": "CSV header row is missing or empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Accept flexible header names. Required: name, slug, price, category/category_id.
        # Variations and image columns are optional.
        def has_any(*names):
            return any(n in header_fields for n in names)

        required_checks = [
            (('name',), 'name'),
            (('slug',), 'slug'),
            (('price', 'base_price'), 'price/base_price'),
            (('category', 'category_id'), 'category/category_id'),
        ]

        missing = [label for keys, label in required_checks if not has_any(*keys)]
        if missing:
            return Response(
                {
                    "detail": f"Missing required CSV columns (accepts synonyms): {', '.join(missing)}",
                    "received_headers": raw_headers,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errors = []

        for row_number, row in enumerate(reader, start=2):
            try:
                normalized_row = {
                    str(key).strip().lower(): (value or "")
                    for key, value in (row or {}).items()
                    if key is not None
                }

                def row_value(*keys):
                    for key in keys:
                        value = normalized_row.get(key)
                        if value is not None and str(value).strip() != "":
                            return str(value).strip()
                    return ""

                # Resolve category (accept id, slug, name, or a path like "Parent > Child")
                category_value = row_value("category", "category_id")
                if not category_value:
                    raise ValueError("category is required")

                def resolve_category(value):
                    # path-style: Parent > Child or Parent/Child
                    if ">" in value or "/" in value:
                        sep = ">" if ">" in value else "/"
                        parts = [p.strip() for p in value.split(sep) if p.strip()]
                        parent = None
                        cat = None
                        for part in parts:
                            qs = Category.objects.filter(parent=parent)
                            cat = qs.filter(slug=part).first() or qs.filter(name=part).first()
                            if not cat:
                                return None
                            parent = cat
                        return cat
                    # try id
                    try:
                        return Category.objects.get(pk=int(value))
                    except Exception:
                        pass
                    # try slug then name
                    return Category.objects.filter(slug=value).first() or Category.objects.filter(name=value).first()

                category = resolve_category(category_value)
                if not category:
                    raise ValueError(f"Category not found: {category_value}")

                price_value = row_value("price", "base_price")
                if price_value is None or price_value == "":
                    raise ValueError("price is required")

                product_name = row_value("name")
                if not product_name:
                    raise ValueError("name is required")

                defaults = {
                    "category": category,
                    "name": product_name,
                    "base_price": price_value,
                    "short_description": row_value("short_description"),
                    "description": row_value("description"),
                    "is_active": parse_bool(row_value("is_active"), True),
                    "is_featured": parse_bool(row_value("is_featured"), False),
                    "sort_order": int(row_value("sort_order") or 0),
                }

                product_slug = row_value("slug")
                if not product_slug:
                    raise ValueError("slug is required")

                product, was_created = Product.objects.update_or_create(slug=product_slug, defaults=defaults)

                # Handle variations: comma/semicolon separated list of variation names or ids
                variations_field = row_value("variations")
                variation_objs = []
                if variations_field:
                    parts = [p.strip() for p in (variations_field.replace(";", ",").split(",")) if p.strip()]
                    for part in parts:
                        v = None
                        try:
                            v = Variation.objects.get(pk=int(part))
                        except Exception:
                            v = Variation.objects.filter(slug=part).first() or Variation.objects.filter(name=part).first()
                        if v:
                            variation_objs.append(v)

                if variation_objs:
                    product.available_variations.set(variation_objs)

                # Handle image url: update existing primary image if present, avoid duplicates
                image_url = normalize_image_url(row_value("image_url", "image", "google_drive_image_url"))
                if image_url:
                    # if exact image already present, skip
                    existing = product.images.filter(public_url=image_url).first()
                    if existing:
                        pass
                    else:
                        primary = product.images.filter(is_primary=True).first()
                        if primary:
                            primary.public_url = image_url
                            primary.source_type = ProductImage.SourceType.MANUAL
                            primary.save()
                        else:
                            ProductImage.objects.create(
                                product=product,
                                source_type=ProductImage.SourceType.MANUAL,
                                public_url=image_url,
                                is_primary=True,
                                sort_order=0,
                            )

                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as error:
                errors.append(f"Row {row_number}: {error}")

        response_status = status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS
        return Response(
            {
                "created": created,
                "updated": updated,
                "errors": errors,
            },
            status=response_status,
        )


class AdminVariationViewSet(viewsets.ModelViewSet):
    queryset = Variation.objects.order_by("sort_order", "name")
    serializer_class = AdminVariationSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.select_related("product").order_by("sort_order", "id")
    serializer_class = AdminProductImageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None
