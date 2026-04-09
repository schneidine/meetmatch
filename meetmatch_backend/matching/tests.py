from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
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

    def test_balanced_match_ranks_above_interest_only_match(self):
        self.request_user.location = Point(-81.3792, 28.5383)
        self.request_user.radius = 15
        self.request_user.save(update_fields=["location", "radius"])

        balanced_match = User.objects.create_user(
            username="taylor",
            email="taylor@example.com",
            password="secret123",
            age=26,
            location=Point(-81.3778, 28.5391),
            radius=15,
        )
        balanced_match.interests.set([self.music, self.movies, self.gaming])
        balanced_match.top_interests.set([self.music, self.movies, self.gaming])

        interest_only_match = User.objects.create_user(
            username="riley",
            email="riley@example.com",
            password="secret123",
            age=39,
            location=Point(-81.2000, 28.7000),
            radius=15,
        )
        interest_only_match.interests.set([self.music, self.hiking, self.coffee])
        interest_only_match.top_interests.set([self.music, self.hiking, self.coffee])

        response = self.client.get(f"/api/users/{self.request_user.id}/matches/")

        self.assertEqual(response.status_code, 200)
        matches = response.json()["matches"]
        self.assertGreaterEqual(len(matches), 4)
        usernames_in_order = [match["username"] for match in matches]
        self.assertLess(usernames_in_order.index("taylor"), usernames_in_order.index("riley"))

    def test_interest_and_location_outweigh_age_only_boost(self):
        self.request_user.location = Point(-81.3792, 28.5383)
        self.request_user.radius = 15
        self.request_user.save(update_fields=["location", "radius"])

        age_favored_match = User.objects.create_user(
            username="morgan",
            email="morgan@example.com",
            password="secret123",
            age=25,
            location=Point(-81.3794, 28.5385),
            radius=15,
        )
        age_favored_match.interests.set([self.music, self.movies, self.gaming])
        age_favored_match.top_interests.set([self.music, self.movies, self.gaming])

        interest_location_match = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="secret123",
            age=37,
            location=Point(-81.3790, 28.5381),
            radius=15,
        )
        interest_location_match.interests.set([self.music, self.hiking, self.coffee])
        interest_location_match.top_interests.set([self.music, self.hiking, self.coffee])

        response = self.client.get(f"/api/users/{self.request_user.id}/matches/")

        self.assertEqual(response.status_code, 200)
        matches = response.json()["matches"]
        usernames_in_order = [match["username"] for match in matches]
        self.assertLess(usernames_in_order.index("jamie"), usernames_in_order.index("morgan"))

    def test_excludes_single_shared_interest_without_top_overlap(self):
        low_overlap_match = User.objects.create_user(
            username="drew",
            email="drew@example.com",
            password="secret123",
            age=25,
        )
        low_overlap_match.interests.set([self.music, self.gaming, self.movies])
        low_overlap_match.top_interests.set([self.gaming, self.movies])

        response = self.client.get(f"/api/users/{self.request_user.id}/matches/")

        self.assertEqual(response.status_code, 200)
        usernames = [match["username"] for match in response.json()["matches"]]
        self.assertNotIn("drew", usernames)

    def test_shared_top_interests_rank_above_general_overlap(self):
        self.request_user.top_interests.set([self.music, self.coffee])

        top_aligned_match = User.objects.create_user(
            username="quinn",
            email="quinn@example.com",
            password="secret123",
            age=30,
        )
        top_aligned_match.interests.set([self.music, self.gaming, self.movies])
        top_aligned_match.top_interests.set([self.music, self.movies])

        broader_overlap_match = User.objects.create_user(
            username="blake",
            email="blake@example.com",
            password="secret123",
            age=30,
        )
        broader_overlap_match.interests.set([self.hiking, self.coffee, self.gaming])
        broader_overlap_match.top_interests.set([self.gaming, self.movies])

        response = self.client.get(f"/api/users/{self.request_user.id}/matches/")

        self.assertEqual(response.status_code, 200)
        usernames_in_order = [match["username"] for match in response.json()["matches"]]
        self.assertLess(usernames_in_order.index("quinn"), usernames_in_order.index("blake"))

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
