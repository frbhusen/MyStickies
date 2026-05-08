import re
import secrets

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product, Variation
from apps.common.models import TimeStampedModel


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELED = "canceled", "Canceled"

    order_number = models.CharField(max_length=24, unique=True, editable=False)
    customer_full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=100, validators=[MinValueValidator(0)])
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["phone_number"]),
        ]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        if not self.shipping_fee:
            self.shipping_fee = getattr(settings, "MY_STICKIES_SHIPPING_FEE", 100)
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_number():
        return f"MS-{secrets.token_hex(4).upper()}"

    @property
    def normalized_phone_number(self):
        digits = re.sub(r"\D", "", self.phone_number or "")
        if digits.startswith("09"):
            digits = digits[1:]
        if digits.startswith("963"):
            return f"00{digits}"
        return f"00963{digits}"

    @property
    def whatsapp_link(self):
        digits = re.sub(r"\D", "", self.phone_number or "")
        if digits.startswith("09"):
            digits = digits[1:]
        if digits.startswith("963"):
            digits = digits[3:]
        return f"https://wa.me/963{digits}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variation = models.ForeignKey(Variation, null=True, blank=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=180)
    variation_name = models.CharField(max_length=150, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
