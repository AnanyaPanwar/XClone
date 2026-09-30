from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APIClient

from .models import Tweet, Profile, Like, Comment, OTP


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class XCloneAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPass123!",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="TestPass123!",
        )

        self.tweet = Tweet.objects.create(
            user=self.user,
            text="My first test tweet",
        )

    # ========================================================
    # REGISTRATION
    # ========================================================

    def test_user_registration(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "NewPass123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            User.objects.filter(
                username="newuser"
            ).exists()
        )

        self.assertTrue(
            Profile.objects.filter(
                user__username="newuser"
            ).exists()
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    # ========================================================
    # LOGIN
    # ========================================================

    def test_user_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testuser",
                "password": "TestPass123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(
            response.data["user"]["username"],
            "testuser",
        )

    def test_invalid_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testuser",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # ========================================================
    # TWEETS
    # ========================================================

    def test_tweet_list_is_public(self):
        response = self.client.get(
            "/api/tweets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["text"],
            "My first test tweet",
        )

    def test_authenticated_user_can_create_tweet(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/tweets/",
            {
                "text": "A new test tweet",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Tweet.objects.filter(
                user=self.user,
                text="A new test tweet",
            ).exists()
        )

    def test_anonymous_user_cannot_create_tweet(self):
        response = self.client.post(
            "/api/tweets/",
            {
                "text": "Anonymous tweet",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_user_can_edit_own_tweet(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            f"/api/tweets/{self.tweet.id}/",
            {
                "text": "Updated tweet",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.tweet.refresh_from_db()

        self.assertEqual(
            self.tweet.text,
            "Updated tweet",
        )

    def test_user_cannot_edit_another_users_tweet(self):
        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.patch(
            f"/api/tweets/{self.tweet.id}/",
            {
                "text": "Unauthorized edit",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.tweet.refresh_from_db()

        self.assertEqual(
            self.tweet.text,
            "My first test tweet",
        )

    def test_user_can_delete_own_tweet(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.delete(
            f"/api/tweets/{self.tweet.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Tweet.objects.filter(
                id=self.tweet.id
            ).exists()
        )

    # ========================================================
    # LIKES
    # ========================================================

    def test_authenticated_user_can_like_tweet(self):
        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.post(
            f"/api/tweets/{self.tweet.id}/like/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["liked"]
        )

        self.assertEqual(
            response.data["likes_count"],
            1,
        )

        self.assertTrue(
            Like.objects.filter(
                user=self.other_user,
                tweet=self.tweet,
            ).exists()
        )

    def test_like_endpoint_toggles_like(self):
        self.client.force_authenticate(
            user=self.other_user
        )

        url = f"/api/tweets/{self.tweet.id}/like/"

        first_response = self.client.post(url)

        self.assertTrue(
            first_response.data["liked"]
        )

        second_response = self.client.post(url)

        self.assertFalse(
            second_response.data["liked"]
        )

        self.assertEqual(
            Like.objects.filter(
                user=self.other_user,
                tweet=self.tweet,
            ).count(),
            0,
        )

    def test_anonymous_user_cannot_like(self):
        response = self.client.post(
            f"/api/tweets/{self.tweet.id}/like/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # ========================================================
    # COMMENTS
    # ========================================================

    def test_authenticated_user_can_create_comment(self):
        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.post(
            f"/api/tweets/{self.tweet.id}/comments/",
            {
                "text": "Nice tweet!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Comment.objects.filter(
                user=self.other_user,
                tweet=self.tweet,
                text="Nice tweet!",
            ).exists()
        )

    def test_comments_can_be_listed(self):
        Comment.objects.create(
            user=self.other_user,
            tweet=self.tweet,
            text="Test comment",
        )

        response = self.client.get(
            f"/api/tweets/{self.tweet.id}/comments/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["text"],
            "Test comment",
        )

    def test_anonymous_user_cannot_comment(self):
        response = self.client.post(
            f"/api/tweets/{self.tweet.id}/comments/",
            {
                "text": "Anonymous comment",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # ========================================================
    # PROFILE
    # ========================================================

    def test_authenticated_user_can_get_own_profile(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["username"],
            "testuser",
        )

    def test_user_can_update_own_bio(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            "/api/profile/me/",
            {
                "bio": "Django and React developer",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.user.profile.refresh_from_db()

        self.assertEqual(
            self.user.profile.bio,
            "Django and React developer",
        )

    def test_public_profile_can_be_viewed(self):
        response = self.client.get(
            "/api/users/testuser/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["username"],
            "testuser",
        )

    # ========================================================
    # USER SEARCH
    # ========================================================

    def test_user_search(self):
        response = self.client.get(
            "/api/users/search/?q=test"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        usernames = [
            user["username"]
            for user in response.data
        ]

        self.assertIn(
            "testuser",
            usernames,
        )

    # ========================================================
    # LOGIN OTP
    # ========================================================

    def test_login_otp_request_creates_otp(self):
        response = self.client.post(
            "/api/otp/request/",
            {
                "username": "testuser",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            OTP.objects.filter(
                user=self.user,
                purpose=OTP.PURPOSE_LOGIN,
                is_used=False,
            ).exists()
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

    def test_login_otp_can_be_verified(self):
        otp = OTP.objects.create(
            user=self.user,
            code="123456",
            purpose=OTP.PURPOSE_LOGIN,
        )

        response = self.client.post(
            "/api/otp/verify/",
            {
                "username": "testuser",
                "code": "123456",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data,
        )

        otp.refresh_from_db()

        self.assertTrue(
            otp.is_used
        )

    # ========================================================
    # PASSWORD RESET
    # ========================================================

    def test_password_reset_request_creates_otp(self):
        response = self.client.post(
            "/api/password/forgot/",
            {
                "username": "testuser",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            OTP.objects.filter(
                user=self.user,
                purpose=OTP.PURPOSE_RESET,
                is_used=False,
            ).exists()
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

    def test_password_can_be_reset(self):
        OTP.objects.create(
            user=self.user,
            code="654321",
            purpose=OTP.PURPOSE_RESET,
        )

        response = self.client.post(
            "/api/password/reset/",
            {
                "username": "testuser",
                "code": "654321",
                "new_password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                "NewPassword123!"
            )
        )

    def test_invalid_password_reset_code_is_rejected(self):
        OTP.objects.create(
            user=self.user,
            code="654321",
            purpose=OTP.PURPOSE_RESET,
        )

        response = self.client.post(
            "/api/password/reset/",
            {
                "username": "testuser",
                "code": "000000",
                "new_password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_used_password_reset_otp_cannot_be_reused(self):
        otp = OTP.objects.create(
            user=self.user,
            code="654321",
            purpose=OTP.PURPOSE_RESET,
            is_used=True,
        )

        response = self.client.post(
            "/api/password/reset/",
            {
                "username": "testuser",
                "code": "654321",
                "new_password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        otp.refresh_from_db()

        self.assertTrue(
            otp.is_used
        )