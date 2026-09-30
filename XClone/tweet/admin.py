from django.contrib import admin

from .models import (
    Tweet,
    Profile,
    Like,
    Comment,
    OTP,
)


@admin.register(Tweet)
class TweetAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "text",
        "created_at",
    )

    search_fields = (
        "text",
        "user__username",
    )

    list_filter = (
        "created_at",
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "bio",
    )

    search_fields = (
        "user__username",
    )


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "tweet",
        "created_at",
    )

    search_fields = (
        "user__username",
        "tweet__text",
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "tweet",
        "text",
        "created_at",
    )

    search_fields = (
        "user__username",
        "text",
        "tweet__text",
    )


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "purpose",
        "created_at",
        "is_used",
    )

    search_fields = (
        "user__username",
    )

    list_filter = (
        "purpose",
        "is_used",
        "created_at",
    )

    # Don't make OTP codes casually editable in admin.
    readonly_fields = (
        "code",
        "created_at",
    )