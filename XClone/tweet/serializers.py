from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import Tweet, Profile, Comment


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = Profile
        fields = [
            "username",
            "avatar",
            "bio",
        ]


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(
        source="profile.avatar",
        read_only=True,
        allow_null=True,
    )

    bio = serializers.CharField(
        source="profile.bio",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "avatar",
            "bio",
        ]


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment

        fields = [
            "id",
            "user",
            "tweet",
            "text",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "tweet",
            "created_at",
        ]


class TweetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    comments = CommentSerializer(
        many=True,
        read_only=True,
    )

    likes_count = serializers.IntegerField(
        source="likes.count",
        read_only=True,
    )

    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Tweet

        fields = [
            "id",
            "user",
            "text",
            "photo",
            "created_at",
            "updated_at",
            "comments",
            "likes_count",
            "liked_by_me",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
            "comments",
            "likes_count",
            "liked_by_me",
        ]

    def get_liked_by_me(self, tweet):
        request = self.context.get("request")

        if not request:
            return False

        if not request.user.is_authenticated:
            return False

        return tweet.likes.filter(
            user=request.user
        ).exists()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
        ]

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user