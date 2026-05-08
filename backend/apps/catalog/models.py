from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["parent", "slug"], name="uniq_category_slug_per_parent"),
            models.UniqueConstraint(fields=["parent", "name"], name="uniq_category_name_per_parent"),
        ]
        indexes = [
            models.Index(fields=["parent", "is_active"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT)
    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True)
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_most_sold = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    available_variations = models.ManyToManyField("Variation", through="ProductVariationLink", related_name="products", blank=True)

    class Meta:
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return self.name

    @property
    def effective_base_price(self):
        return self.base_price + self.category.price_adjustment


class Variation(TimeStampedModel):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    attributes = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class ProductVariationLink(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation = models.ForeignKey(Variation, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["product", "variation"], name="uniq_product_variation_link"),
        ]
        indexes = [
            models.Index(fields=["product", "variation"]),
            models.Index(fields=["is_default"]),
        ]


class ProductVariation(TimeStampedModel):
    product = models.ForeignKey(Product, related_name="variations", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=80, blank=True)
    attributes = models.JSONField(default=dict, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["product", "name"], name="uniq_variation_name_per_product"),
        ]
        indexes = [
            models.Index(fields=["product", "is_active"]),
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductImage(TimeStampedModel):
    class SourceType(models.TextChoices):
        MANUAL = "manual", "Manual Link"
        DRIVE = "drive", "Google Drive Sync"

    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    public_url = models.URLField(max_length=500)
    drive_file_id = models.CharField(max_length=255, blank=True)
    drive_folder_id = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(fields=["product", "is_primary"]),
            models.Index(fields=["drive_file_id"]),
        ]
