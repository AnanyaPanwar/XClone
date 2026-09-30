from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.db.models import Q

from rest_framework import (
    generics,
    permissions,
    status,
    viewsets,
)

from rest_framework.decorators import action

from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)

from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Tweet,
    Comment,
    Like,
    Profile,
    OTP,
)

from .serializers import (
    TweetSerializer,
    CommentSerializer,
    ProfileSerializer,
    UserSerializer,
    RegisterSerializer,
)


# ============================================================
# JWT
# ============================================================

def issue_tokens_for(user):
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ============================================================
# PERMISSIONS
# ============================================================

class TweetPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Anyone can read tweets.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Creating/updating/deleting requires authentication.
        return request.user.is_authenticated

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.user == request.user


class CommentPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_authenticated

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.user == request.user


# ============================================================
# TWEETS
# ============================================================

class TweetViewSet(viewsets.ModelViewSet):

    serializer_class = TweetSerializer

    permission_classes = [
        TweetPermission,
    ]

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    def get_queryset(self):
        queryset = (
            Tweet.objects
            .select_related(
                "user",
                "user__profile",
            )
            .prefetch_related(
                "likes",
                "comments__user",
                "comments__user__profile",
            )
            .order_by("-created_at")
        )

        q = self.request.query_params.get(
            "q",
            "",
        ).strip()

        if q:
            queryset = queryset.filter(
                Q(text__icontains=q)
                |
                Q(user__username__icontains=q)
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )

    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You can only edit your own tweets."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You can only delete your own tweets."
            )

        instance.delete()

    @action(
    detail=True,
    methods=["post"],
    permission_classes=[
        permissions.IsAuthenticated
    ],)
    def like(self, request, pk=None):
        tweet = self.get_object()
        
        like = Like.objects.filter(
        user=request.user,
        tweet=tweet,
        ).first()
        
        if like:
            like.delete()
            
            return Response({
                "liked": False,
                "likes_count": Like.objects.filter(
                tweet=tweet
                ).count(),
            })

        Like.objects.create(
            user=request.user,
            tweet=tweet,
        )

        return Response({
            "liked": True,
            "likes_count": Like.objects.filter(
            tweet=tweet
            ).count(),
         })


# ============================================================
# COMMENTS
# ============================================================

class CommentViewSet(viewsets.ModelViewSet):

    serializer_class = CommentSerializer

    permission_classes = [
        CommentPermission,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
    ]

    def get_queryset(self):
        return (
            Comment.objects
            .filter(
                tweet_id=self.kwargs["tweet_pk"]
            )
            .select_related(
                "user",
                "user__profile",
                "tweet",
            )
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        tweet_id = self.kwargs["tweet_pk"]

        if not Tweet.objects.filter(
            id=tweet_id
        ).exists():
            from rest_framework.exceptions import NotFound

            raise NotFound("Tweet not found.")

        serializer.save(
            user=self.request.user,
            tweet_id=tweet_id,
        )


# ============================================================
# MY PROFILE
# ============================================================

class MyProfileView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = ProfileSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(
            user=self.request.user
        )

        return profile


# ============================================================
# PUBLIC USER PROFILE
# ============================================================

class UserProfileView(
    generics.RetrieveAPIView
):
    serializer_class = UserSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    lookup_field = "username"

    queryset = User.objects.select_related(
        "profile"
    )


# ============================================================
# USER SEARCH
# ============================================================

class UserSearchView(
    generics.ListAPIView
):
    serializer_class = UserSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    def get_queryset(self):
        q = self.request.query_params.get(
            "q",
            "",
        ).strip()

        if not q:
            return User.objects.none()

        return (
            User.objects
            .filter(
                username__icontains=q
            )
            .select_related("profile")
            .order_by("username")[:20]
        )

    
# ============================================================
# REGISTER
# ============================================================

class RegisterView(
    generics.CreateAPIView
):
    queryset = User.objects.all()

    serializer_class = RegisterSerializer

    permission_classes = [
        permissions.AllowAny
    ]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(
                    user,
                    context={
                        "request": request
                    },
                ).data,
                **issue_tokens_for(user),
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# LOGIN
# ============================================================

class LoginView(APIView):

    permission_classes = [
        permissions.AllowAny
    ]

    def post(self, request):
        username = request.data.get(
            "username",
            "",
        ).strip()

        password = request.data.get(
            "password",
            "",
        )

        user = authenticate(
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "detail": (
                        "Invalid username or password."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({
            "user": UserSerializer(
                user,
                context={
                    "request": request
                },
            ).data,
            **issue_tokens_for(user),
        })


# ============================================================
# REQUEST LOGIN OTP
# ============================================================

class RequestOTPView(APIView):

    permission_classes = [
        permissions.AllowAny
    ]

    def post(self, request):
        username = request.data.get(
            "username",
            "",
        ).strip()

        user = User.objects.filter(
            username=username
        ).first()

        # Deliberately generic response.
        if not user:
            return Response({
                "detail": (
                    "If that account exists, "
                    "an OTP has been sent."
                )
            })

        code = OTP.generate_code()

        OTP.objects.filter(
            user=user,
            purpose=OTP.PURPOSE_LOGIN,
            is_used=False,
        ).update(
            is_used=True
        )

        OTP.objects.create(
            user=user,
            code=code,
            purpose=OTP.PURPOSE_LOGIN,
        )

        send_mail(
            subject="Your XClone login code",
            message=(
                f"Your XClone OTP is {code}. "
                "It expires in 10 minutes."
            ),
            from_email=None,
            recipient_list=[
                user.email
            ],
        )

        return Response({
            "detail": (
                "If that account exists, "
                "an OTP has been sent."
            )
        })


# ============================================================
# VERIFY LOGIN OTP
# ============================================================

class VerifyOTPView(APIView):

    permission_classes = [
        permissions.AllowAny
    ]

    def post(self, request):
        username = request.data.get(
            "username",
            "",
        ).strip()

        code = request.data.get(
            "code",
            "",
        ).strip()

        user = User.objects.filter(
            username=username
        ).first()

        if not user:
            return Response(
                {
                    "detail": "Invalid code."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = (
            OTP.objects
            .filter(
                user=user,
                code=code,
                purpose=OTP.PURPOSE_LOGIN,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or otp.is_expired():
            return Response(
                {
                    "detail": (
                        "Invalid or expired code."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        return Response({
            "user": UserSerializer(
                user,
                context={
                    "request": request
                },
            ).data,
            **issue_tokens_for(user),
        })


# ============================================================
# FORGOT PASSWORD REQUEST
# ============================================================

class ForgotPasswordRequestView(APIView):

    permission_classes = [
        permissions.AllowAny
    ]

    def post(self, request):
        username = request.data.get(
            "username",
            "",
        ).strip()

        user = User.objects.filter(
            username=username
        ).first()

        if not user:
            return Response({
                "detail": (
                    "If that account exists, "
                    "a reset code has been sent."
                )
            })

        code = OTP.generate_code()

        OTP.objects.filter(
            user=user,
            purpose=OTP.PURPOSE_RESET,
            is_used=False,
        ).update(
            is_used=True
        )

        OTP.objects.create(
            user=user,
            code=code,
            purpose=OTP.PURPOSE_RESET,
        )

        send_mail(
            subject="Your XClone password reset code",
            message=(
                f"Your XClone password reset code is "
                f"{code}. It expires in 10 minutes."
            ),
            from_email=None,
            recipient_list=[
                user.email
            ],
        )

        return Response({
            "detail": (
                "If that account exists, "
                "a reset code has been sent."
            )
        })


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordView(APIView):

    permission_classes = [
        permissions.AllowAny
    ]

    def post(self, request):
        username = request.data.get(
            "username",
            "",
        ).strip()

        code = request.data.get(
            "code",
            "",
        ).strip()

        new_password = request.data.get(
            "new_password",
            "",
        )

        user = User.objects.filter(
            username=username
        ).first()

        if not user:
            return Response(
                {
                    "detail": "Invalid code."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = (
            OTP.objects
            .filter(
                user=user,
                code=code,
                purpose=OTP.PURPOSE_RESET,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or otp.is_expired():
            return Response(
                {
                    "detail": (
                        "Invalid or expired code."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                new_password,
                user=user,
            )

        except Exception as exc:
            return Response(
                {
                    "detail": getattr(
                        exc,
                        "messages",
                        ["Invalid password."],
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)

        user.save(
            update_fields=["password"]
        )

        otp.is_used = True

        otp.save(
            update_fields=["is_used"]
        )

        return Response({
            "detail": (
                "Password reset successfully. "
                "You can now log in."
            )
        })