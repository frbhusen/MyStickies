import django_filters

from apps.catalog.models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category_id")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    variation = django_filters.CharFilter(method="filter_variation")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "variation"]

    def filter_variation(self, queryset, name, value):
        return queryset.filter(variations__name__icontains=value).distinct()
