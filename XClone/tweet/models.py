from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random


class Tweet(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tweets",
    )

    text = models.TextField(max_length=300)

    photo = models.ImageField(
        upload_to="photos/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.text[:30]}"


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
    )

    bio = models.CharField(
        max_length=160,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.username}'s profile"


@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        Profile.objects.get_or_create(user=instance)


class Like(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="likes",
    )

    tweet = models.ForeignKey(
        Tweet,
        on_delete=models.CASCADE,
        related_name="likes",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "tweet"],
                name="unique_user_tweet_like",
            )
        ]

    def __str__(self):
        return (
            f"{self.user.username} likes "
            f"tweet #{self.tweet.id}"
        )


class Comment(models.Model):
    # FIXED: this must point to User, not Tweet.
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    tweet = models.ForeignKey(
        Tweet,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    text = models.CharField(max_length=200)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.text[:20]}"


class OTP(models.Model):
    PURPOSE_LOGIN = "login"
    PURPOSE_RESET = "reset"

    PURPOSE_CHOICES = (
        (PURPOSE_LOGIN, "Login"),
        (PURPOSE_RESET, "Password reset"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otps",
    )

    code = models.CharField(max_length=6)

    purpose = models.CharField(
        max_length=10,
        choices=PURPOSE_CHOICES,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    is_used = models.BooleanField(default=False)

    @staticmethod
    def generate_code():
        return str(random.randint(0, 999999)).zfill(6)

    def is_expired(self):
        from django.utils import timezone

        elapsed = (
            timezone.now() - self.created_at
        ).total_seconds()

        return elapsed > 600

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.purpose} - {self.code}"
        )