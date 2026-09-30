from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from . import views


# ============================================================
# MAIN ROUTER
# ============================================================

router = DefaultRouter()

router.register(
    "tweets",
    views.TweetViewSet,
    basename="tweet",
)


# ============================================================
# NESTED COMMENT ROUTER
# ============================================================

tweets_router = NestedDefaultRouter(
    router,
    "tweets",
    lookup="tweet",
)

tweets_router.register(
    "comments",
    views.CommentViewSet,
    basename="tweet-comments",
)


urlpatterns = [

    # Tweets
    path(
        "",
        include(router.urls),
    ),

    # Tweet comments
    path(
        "",
        include(tweets_router.urls),
    ),

    # Authentication
    path(
        "auth/login/",
        views.LoginView.as_view(),
        name="api-login",
    ),

    path(
        "auth/register/",
        views.RegisterView.as_view(),
        name="api-register",
    ),

    # Profile
    path(
        "profile/me/",
        views.MyProfileView.as_view(),
        name="my-profile",
    ),

    path(
    "users/search/",
    views.UserSearchView.as_view(),
    name="user-search",
    ),


    path(
        "users/<str:username>/",
        views.UserProfileView.as_view(),
        name="user-profile",
    ),

    # OTP
    path(
        "otp/request/",
        views.RequestOTPView.as_view(),
        name="otp-request",
    ),

    path(
        "otp/verify/",
        views.VerifyOTPView.as_view(),
        name="otp-verify",
    ),

    # Password reset
    path(
        "password/forgot/",
        views.ForgotPasswordRequestView.as_view(),
        name="password-forgot",
    ),

    path(
        "password/reset/",
        views.ResetPasswordView.as_view(),
        name="password-reset",
    ),
]