from django.contrib.auth import get_user_model
from django.test import TestCase

from users.models import Interest


User = get_user_model()


class MatchSuggestionTests(TestCase):
    def setUp(self):
        self.music = Interest.objects.create(name="Music")
        self.hiking = Interest.objects.create(name="Hiking")
        self.coffee = Interest.objects.create(name="Coffee")
        self.gaming = Interest.objects.create(name="Gaming")
        self.movies = Interest.objects.create(name="Movies")

        self.request_user = User.objects.create_user(
            username="casey",
            email="casey@example.com",
            password="secret123",
            age=25,
        )
        self.request_user.interests.set([self.music, self.hiking, self.coffee])
        self.request_user.top_interests.set([self.music, self.hiking, self.coffee])

        self.best_match = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="secret123",
            age=24,
        )
        self.best_match.interests.set([self.music, self.hiking, self.coffee, self.movies])
        self.best_match.top_interests.set([self.music, self.hiking, self.movies])

        self.weaker_match = User.objects.create_user(
            username="jordan",
            email="jordan@example.com",
            password="secret123",
            age=32,
        )
        self.weaker_match.interests.set([self.music, self.gaming, self.movies])
        self.weaker_match.top_interests.set([self.music, self.gaming, self.movies])

    def test_returns_matches_ranked_by_shared_interests(self):
        response = self.client.get(f"/api/users/{self.request_user.id}/matches/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["user_id"], self.request_user.id)
        self.assertEqual(len(payload["matches"]), 2)
        self.assertEqual(payload["matches"][0]["username"], "alex")
        self.assertGreater(payload["matches"][0]["match_score"], payload["matches"][1]["match_score"])
        self.assertCountEqual(
            payload["matches"][0]["shared_interest_names"],
            ["Music", "Hiking", "Coffee"],
        )
        self.assertIn("Music", payload["matches"][0]["shared_top_interest_names"])

    def test_requires_saved_interests_before_matching(self):
        new_user = User.objects.create_user(
            username="sam",
            email="sam@example.com",
            password="secret123",
            age=27,
        )

        response = self.client.get(f"/api/users/{new_user.id}/matches/")

        self.assertEqual(response.status_code, 400)
        self.assertIn("select interests", response.json()["error"].lower())
