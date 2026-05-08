from rest_framework import filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.catalog.filters import ProductFilter
from apps.catalog.models import Category, Product
from apps.catalog.serializers import CategoryTreeSerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).select_related("parent")
    serializer_class = CategoryTreeSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug"]
    ordering_fields = ["sort_order", "name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        parent = self.request.query_params.get("parent")
        if parent == "null":
            return queryset.filter(parent__isnull=True)
        if parent:
            return queryset.filter(parent_id=parent)
        return queryset


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("available_variations", "images")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "slug", "short_description", "description"]
    ordering_fields = ["sort_order", "name", "base_price", "created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        is_featured = self.request.query_params.get("featured")
        if is_featured is not None:
            queryset = queryset.filter(is_featured=is_featured.lower() in {"1", "true", "yes"})
        slug = self.request.query_params.get("slug")
        if slug:
            queryset = queryset.filter(slug=slug)
        is_most_sold = self.request.query_params.get("most_sold")
        if is_most_sold is not None:
            queryset = queryset.filter(is_most_sold=is_most_sold.lower() in {"1", "true", "yes"})
        return queryset.distinct()


@api_view(["GET"])
@permission_classes([AllowAny])
def search_view(request):
    query = (request.query_params.get("q") or "").strip()
    products = Product.objects.filter(is_active=True)
    categories = Category.objects.filter(is_active=True)
    if query:
        products = products.filter(name__icontains=query)
        categories = categories.filter(name__icontains=query)
    return Response(
        {
            "products": ProductSerializer(products.select_related("category").prefetch_related("available_variations", "images")[:12], many=True).data,
            "categories": CategoryTreeSerializer(categories[:12], many=True).data,
        }
    )
